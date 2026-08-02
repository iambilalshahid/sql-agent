import { ChatOllama } from "@langchain/ollama";
import { createAgent, tool } from "langchain";
import * as z from "zod";
import { getCurrentUser } from "./auth";
import { executeWithRole, getSchema, sanitizeSqlQuery } from "./db";

const executeSql = tool(
    async ({ query }: { query: string }) => {
        const user = await getCurrentUser();
        const role = user?.role || 'customer';

        const q = sanitizeSqlQuery(query, role);
        const result = await executeWithRole(q, role);
        return JSON.stringify(result, null, 2);
        // try {
        //     const result = await runQuery(q);
        //     return JSON.stringify(result, null, 2);
        // } catch (e) {
        //     const message = e instanceof Error ? e.message : String(e);
        //     throw new Error(message);
        // }
    },
    {
        name: "execute_sql",
        description: "Execute SQLite query. Customers = SELECT only. Admins = full CRUD.",
        schema: z.object({
            schema: z.object({ query: z.string() }),
        }),
    },
);

// This is the schema that drives the "generative UI": the model itself decides
// how the answer should be rendered (plain text, a table, or a chart), and
// hands back the exact column/row shape the frontend needs to draw it.
export const uiResponseSchema = z.object({
    summary: z
        .string()
        .describe("A short, plain-language answer to the user's question (1-3 sentences)."),
    uiType: z
        .enum(["text", "table", "bar_chart", "line_chart", "pie_chart"])
        .describe(
            "How this data should be visualized. Use 'text' only when there is no tabular result " +
            "worth showing (e.g. a yes/no or single scalar answer). Prefer 'bar_chart' for comparisons " +
            "across categories, 'line_chart' for values over time/sequence, 'pie_chart' for proportions " +
            "of a whole (max ~6 slices), and 'table' when the data has many columns or doesn't fit a chart.",
        ),
    columns: z
        .array(z.string())
        .optional()
        .describe("Column names in display order, matching the keys in `rows`."),
    rows: z
        .array(z.record(z.string(), z.union([z.string(), z.number(), z.null()])))
        .optional()
        .describe("Row data as an array of objects keyed by column name."),
    xKey: z
        .string()
        .optional()
        .describe("For charts only: which column to use as the category/x-axis."),
    yKeys: z
        .array(z.string())
        .optional()
        .describe("For charts only: which numeric column(s) to plot as values."),
});

export type UiResponse = z.infer<typeof uiResponseSchema>;

async function buildSystemPrompt() {
    const schema = await getSchema();
    return `You are a careful SQLite analyst with access to an e-commerce store database
(customers, products, categories, orders, order_items, payments, reviews).

Authoritative schema (do not invent columns/tables):
${schema}

Rules:
- Think step-by-step.
- Always check user role before suggesting write operations.
- If user is not logged in or is customer → only SELECT.
- When you need data, call the tool \`execute_sql\` with ONE SELECT query.
- Read-only only; no INSERT/UPDATE/DELETE/ALTER/DROP/CREATE/REPLACE/TRUNCATE.
- Limit to 20 rows unless the user explicitly asks for more.
- If the tool returns an error, revise the SQL and try again (max 5 attempts total).
- If you are not successful after 5 attempts, set uiType to "text" and explain what went wrong.
- Prefer explicit column lists; avoid SELECT *.
- After getting results, decide the best uiType for showing them to a human, and return
  columns/rows (and xKey/yKeys for charts) that exactly match the query result shape.`;
}
// async function buildSystemPrompt() {
//     const schema = await getSchema();
//     const user = await getCurrentUser();
//     const role = user?.role || 'customer';

//     return `You are a powerful e-commerce SQLite database assistant.

// Current User: ${user ? `${user.email} (${role.toUpperCase()})` : 'Not logged in (Customer)'}

// Authoritative Schema:
// ${schema || "No tables found. Please run the seed script."}

// Core Rules:
// - **Admins** have full CRUD access: SELECT, INSERT, UPDATE, DELETE.
// - **Customers / Guests** are READ-ONLY (SELECT only).
// - Always check the current user role before deciding on write operations.
// - Use the \`execute_sql\` tool for ALL database interactions.
// - For SELECT queries, limit to 20 rows unless the user asks for more.
// - After using the tool, always return a structured response with \`summary\` and \`uiType\`.
// - Be helpful and direct. If write operation is attempted by non-admin, politely ask them to login as admin.`;
// }

let cachedAgent: ReturnType<typeof createAgent> | null = null;

export async function getAgent() {
    if (cachedAgent) return cachedAgent;

    const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma4:cloud";
    const systemPrompt = await buildSystemPrompt();

    const llm = new ChatOllama({
        model: OLLAMA_MODEL,
        baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
        temperature: 0.1,
    });

    cachedAgent = createAgent({
        model: llm,
        tools: [executeSql],
        systemPrompt,
    });

    return cachedAgent;
}