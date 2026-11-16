import { ChatOllama } from "@langchain/ollama";
import { createAgent, tool } from "langchain";
import * as z from "zod";
import { getCurrentUser } from "./auth";
import { executeWithRole, getSchema, sanitizeSqlQuery } from "./db";
import { ChatGroq } from "@langchain/groq";

const executeSql = tool(
    async ({ query }: { query: string }) => {
        try {
            const user = await getCurrentUser();
            const role = user?.role || 'customer';

            const q = sanitizeSqlQuery(query, role);
            const result = await executeWithRole(q, role);

            return JSON.stringify(result, null, 2);
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            return `Error: ${message}`;
        }
    },
    {
        name: "execute_sql",
        description: "Execute SQL query. Customers = SELECT only. Admins = full CRUD allowed.",
        schema: z.object({
            query: z.string().describe("The SQL query to run"),
        }),
    }
);

export const uiResponseSchema = z.object({
    summary: z.string(),
    uiType: z.enum(["text", "table", "bar_chart", "line_chart", "pie_chart"]),
    columns: z.array(z.string()).optional(),
    rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))).optional(),
    xKey: z.string().optional(),
    yKeys: z.array(z.string()).optional(),
});

export type UiResponse = z.infer<typeof uiResponseSchema>;

async function buildSystemPrompt() {
    const schema = await getSchema();
    const user = await getCurrentUser();
    const role = user?.role || 'customer';

    return `You are an e-commerce SQLite assistant.

Current Role: ${role.toUpperCase()}

Schema:
${schema}

You MUST reply with **ONLY** valid JSON in this format (no markdown, no extra text):

{
  "summary": "Short clear answer",
  "uiType": "table",
  "columns": ["name", "description"],
  "rows": [{"name": "...", "description": "..."}]
}

Rules:
- Use "table" when data has 3+ columns or doesn't fit a chart.
- Use "bar_chart" for comparisons across categories.
- Use "line_chart" for values over time/sequence.
- Use "pie_chart" for proportions of a whole (max ~6 slices).
- Be helpful and accurate.
- Do not add any explanation outside the JSON object.`;
}

let cachedLlm: ChatOllama | ChatGroq | null = null;

function getLlm() {
    if (cachedLlm) return cachedLlm;

    cachedLlm = process.env.USE_GROQ === "true"
        ? new ChatGroq({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
            apiKey: process.env.GROQ_API_KEY!,
            temperature: 0.1,
        })
        : new ChatOllama({
            model: process.env.OLLAMA_MODEL ?? "gemma4:cloud",
            baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
            temperature: 0.1,
        });

    return cachedLlm;
}

export async function getAgent() {
    const systemPrompt = await buildSystemPrompt(); // always current role

    return createAgent({
        model: getLlm(),
        tools: [executeSql],
        systemPrompt,
    });
}