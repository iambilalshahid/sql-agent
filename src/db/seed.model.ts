import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";

const dbPath = path.resolve(process.cwd(), "./src/db/Ecommerce.db");

const db = new Database(dbPath);

console.log("Seeding database...");

// Drop and recreate tables cleanly
db.exec(`DROP TABLE IF EXISTS users`);
db.exec(`DROP TABLE IF EXISTS products`);

// Create Users table
db.exec(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT
)`);

// Create Products table
db.exec(`CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price REAL,
    stock INTEGER DEFAULT 0,
    description TEXT
)`);

// Insert Admin & Customer
const adminHash = crypto.createHash("sha256").update("admin123").digest("hex");
const customerHash = crypto.createHash("sha256").update("customer123").digest("hex");

const insertUser = db.prepare(
    `INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)`,
);
insertUser.run("admin@example.com", adminHash, "admin", "Admin User");
insertUser.run("customer@example.com", customerHash, "customer", "Test Customer");

// Insert Sample Products
const insertProduct = db.prepare(
    `INSERT INTO products (name, category, price, stock, description) VALUES (?, ?, ?, ?, ?)`,
);
insertProduct.run("Hair AC", "Electronics", 299.99, 50, "Portable Air Conditioner");

const insertProductNoDesc = db.prepare(
    `INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)`,
);
insertProductNoDesc.run("Wireless Earbuds", "Electronics", 89.99, 100);

console.log("✅ Database seeded successfully!");
console.log("🔑 Admin Login:");
console.log("   Email: admin@example.com");
console.log("   Pass : admin123");

db.close();