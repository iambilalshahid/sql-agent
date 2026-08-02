import sqlite3 from "sqlite3";
import crypto from "crypto";
import path from "path";

const dbPath = path.resolve(process.cwd(), "./src/db/Ecommerce.db");

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Seeding database...");

    // Drop and recreate tables cleanly
    db.run(`DROP TABLE IF EXISTS users`);
    db.run(`DROP TABLE IF EXISTS products`);

    // Create Users table
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT
    )`);

    // Create Products table
    db.run(`CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        price REAL,
        stock INTEGER DEFAULT 0,
        description TEXT
    )`);

    // Insert Admin & Customer
    const adminHash = crypto.createHash('sha256').update('admin123').digest('hex');
    const customerHash = crypto.createHash('sha256').update('customer123').digest('hex');

    db.run(`INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)`, 
        ['admin@example.com', adminHash, 'admin', 'Admin User']);

    db.run(`INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)`, 
        ['customer@example.com', customerHash, 'customer', 'Test Customer']);

    // Insert Sample Product
    db.run(`INSERT INTO products (name, category, price, stock, description) VALUES (?, ?, ?, ?, ?)`, 
        ['Hair AC', 'Electronics', 299.99, 50, 'Portable Air Conditioner']);

    db.run(`INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)`, 
        ['Wireless Earbuds', 'Electronics', 89.99, 100]);

    console.log("✅ Database seeded successfully!");
    console.log("🔑 Admin Login:");
    console.log("   Email: admin@example.com");
    console.log("   Pass : admin123");
});

db.close();