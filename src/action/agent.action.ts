import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import Database from "better-sqlite3";
import { SystemMessage, createAgent, tool } from "langchain";
import fs from "node:fs/promises";
import path from "node:path";
import * as z from "zod";

export const localPath = path.resolve(process.cwd(), ".src/db/Ecommerce.db");

export async function resolveDbPath() {
    try {
        await fs.access(localPath);
        return localPath;
    } catch {
        throw new Error(
            `Ecommerce.db not found at ${localPath}. Make sure the file is committed/copied there.`,
        );
    }
}

// Below are minimal tools for demonstration purposes.
// export async function runQuery(query: string): Promise<Record<string, unknown>[]> {
//     const dbPath = await resolveDbPath();
//     const db = new sqlite3.Database(dbPath);
//     return new Promise((resolve, reject) => {
//         db.all(query, [], (err, rows) => {
//             db.close();
//             if (err) reject(err);
//             else resolve(rows as Record<string, unknown>[]);
//         });
//     });
// }
export async function runQuery(query: string): Promise<Record<string, unknown>[]> {
    const dbPath = await resolveDbPath();
    const db = new Database(dbPath, { readonly: true,fileMustExist:true });
    try {
        return db.prepare(query).all() as Record<string, unknown>[];
    } finally {
        db.close();
    }
}

async function getSchema() {
    const tables = await runQuery(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
    );
    return tables.map((row) => String(row.sql)).join("\n\n");
}

const DENY_RE =
    /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|REPLACE|TRUNCATE)\b/i;
const HAS_LIMIT_TAIL_RE = /\blimit\b\s+\d+(\s*,\s*\d+)?\s*;?\s*$/i;

export function sanitizeSqlQuery(q: string) {
    let query = String(q ?? "").trim();

    const semis = [...query].filter((c) => c === ";").length;
    if (semis > 1 || (query.endsWith(";") && query.slice(0, -1).includes(";"))) {
        throw new Error("multiple statements are not allowed.");
    }
    query = query.replace(/;+\s*$/g, "").trim();

    if (!query.toLowerCase().startsWith("select")) {
        throw new Error("Only SELECT statements are allowed");
    }
    if (DENY_RE.test(query)) {
        throw new Error("DML/DDL detected. Only read-only queries are permitted.");
    }

    if (!HAS_LIMIT_TAIL_RE.test(query)) {
        query += " LIMIT 5";
    }
    return query;
}

const executeSql = tool(
    async ({ query }) => {
        const q = sanitizeSqlQuery(query);
        try {
            const result = await runQuery(q);
            return JSON.stringify(result, null, 2);
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new Error(message);
        }
    },
    {
        name: "execute_sql",
        description: "Execute a READ-ONLY SQLite SELECT query and return results.",
        schema: z.object({
            query: z.string().describe("SQLite SELECT query to execute (read-only)."),
        }),
    },
);

const getSystemPrompt = async () =>
    new SystemMessage(`You are a careful SQLite analyst.

Authoritative schema (do not invent columns/tables):
${await getSchema()}

Rules:
- Think step-by-step.
- When you need data, call the tool \`execute_sql\` with ONE SELECT query.
- Read-only only; no INSERT/UPDATE/DELETE/ALTER/DROP/CREATE/REPLACE/TRUNCATE.
- Limit to 5 rows unless user explicitly asks otherwise.
- If the tool returns 'Error:', revise the SQL and try again.
- Limit the number of attempts to 5.
- If you are not successful after 5 attempts, return a note to the user.
- Prefer explicit column lists; avoid SELECT *.
`);

// Ollama's cloud-hosted Gemma tag as of mid-2026 — run `ollama list` to confirm
// what you actually have pulled and swap it in via OLLAMA_MODEL if different.
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma4:cloud";

const llm = process.env.USE_GROQ === "true"
    ? new ChatGroq({ model: process.env.GROQ_MODEL!, apiKey: process.env.GROQ_API_KEY! })
    : new ChatOllama({ model: process.env.OLLAMA_MODEL ?? "gemma4:cloud" });

export const agent = createAgent({
    model: llm,
    // model: `ollama:${OLLAMA_MODEL}`,
    tools: [executeSql],
    systemPrompt: await getSystemPrompt(),
});

