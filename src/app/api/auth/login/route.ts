import { createSession } from '@/lib/auth';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import path from "node:path";

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();

    const dbPath = path.resolve(process.cwd(), "src/db/Ecommerce.db");
    const db = new Database(dbPath, { readonly: true });

    let user: any;
    try {
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    } finally {
        db.close();
    }

    if (!user || user.password_hash !== crypto.createHash("sha256").update(password).digest("hex")) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession({ id: user.id, email: user.email, role: user.role, name: user.name });
    return Response.json({ success: true, role: user.role });
}