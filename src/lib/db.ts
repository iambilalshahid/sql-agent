import fs from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";

// const CHINOOK_URL =
//     "https://storage.googleapis.com/benchmarks-artifacts/chinook/Chinook.db";
const localPath = path.resolve(process.cwd(), "./src/db/Ecommerce.db");

// export async function resolveDbPath() {
//     try {
//         await fs.access(localPath);
//         return localPath;
//     } catch {
//         // not present locally; download it below
//     }
//     const resp = await fetch(CHINOOK_URL);
//     if (!resp.ok) throw new Error(`Failed to download DB. Status: ${resp.status}`);
//     const buf = Buffer.from(await resp.arrayBuffer());
//     await fs.writeFile(localPath, buf);
//     return localPath;
// }
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

export async function runQuery(query: string): Promise<Record<string, unknown>[]> {
    const dbPath = await resolveDbPath();
    const db = new sqlite3.Database(dbPath);
    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            db.close();
            if (err) reject(err);
            else resolve(rows as Record<string, unknown>[]);
        });
    });
}

export async function getSchema() {
    const tables = await runQuery(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
    );
    return tables.map((row) => String(row.sql)).join("\n\n");
}

const DENY_RE = /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|REPLACE|TRUNCATE)\b/i;
const HAS_LIMIT_TAIL_RE = /\blimit\b\s+\d+(\s*,\s*\d+)?\s*;?\s*$/i;

// export function sanitizeSqlQuery(q: string) {
//     let query = String(q ?? "").trim();

//     const semis = [...query].filter((c) => c === ";").length;
//     if (semis > 1 || (query.endsWith(";") && query.slice(0, -1).includes(";"))) {
//         throw new Error("multiple statements are not allowed.");
//     }
//     query = query.replace(/;+\s*$/g, "").trim();

//     if (!query.toLowerCase().startsWith("select")) {
//         throw new Error("Only SELECT statements are allowed");
//     }
//     if (DENY_RE.test(query)) {
//         throw new Error("DML/DDL detected. Only read-only queries are permitted.");
//     }
//     if (!HAS_LIMIT_TAIL_RE.test(query)) {
//         query += " LIMIT 20";
//     }
//     return query;
// }

export function sanitizeSqlQuery(q: string, role: 'admin' | 'customer') {
    let query = String(q ?? "").trim();
    if (role === 'customer' && /\b(INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|CREATE)\b/i.test(query)) {
        throw new Error("Write operations are not allowed for customers.");
    }

    // Auto LIMIT for SELECTs only
    if (query.toLowerCase().startsWith("select") && !/\blimit\b/i.test(query)) {
        query += " LIMIT 20";
    }
    return query;
}

export async function executeWithRole(query: string, role: 'admin' | 'customer' = 'customer') {
    const dbPath = await resolveDbPath();
    const db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
        const isWrite = /\b(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(query);

        if (isWrite && role !== 'admin') {
            db.close();
            return reject(new Error("Unauthorized: Admin role required for write operations."));
        }

        db.all(query, [], (err, rows) => {
            db.close();
            if (err) reject(err);
            else resolve(rows as Record<string, unknown>[]);
        });
    });
}