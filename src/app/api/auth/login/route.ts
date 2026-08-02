import { NextRequest } from 'next/server';
import sqlite3 from 'sqlite3';
import { createSession } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();
    
    const db = new sqlite3.Database('./src/db/Ecommerce.db');
    const user = await new Promise<any>((res) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => res(row));
    });
    db.close();

    if (!user || user.password_hash !== crypto.createHash('sha256').update(password).digest('hex')) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession({ id: user.id, email: user.email, role: user.role, name: user.name });
    return Response.json({ success: true, role: user.role });
}