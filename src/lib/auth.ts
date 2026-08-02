// lib/auth.ts
"use server";
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'super-secret-dev-key-change-in-prod'
);

export type User = { 
    id: number; 
    email: string; 
    role: 'admin' | 'customer'; 
    name?: string;
};

export async function createSession(user: User) {
    const token = await new SignJWT({
        id: user.id,
        email: user.email,
        role: user.role,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
    });
}

export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as User;
    } catch {
        return null;
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
}