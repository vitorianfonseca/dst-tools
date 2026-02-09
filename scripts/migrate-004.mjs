import { Pool } from "pg";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function runMigration() {
    try {
        console.log("Applying migration 004...");
        const migration = readFileSync("neon/migrations/004_create_auth_users.sql", "utf-8");
        await pool.query(migration);
        console.log("✓ Migration 004 applied successfully");
    } catch (error) {
        console.error("Migration error:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
