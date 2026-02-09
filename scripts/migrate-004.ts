import { exec } from "child_process";
import { readFileSync } from "fs";
import { promisify } from "util";
import postgres from "postgres";

const execAsync = promisify(exec);

async function runMigration() {
    const sql = postgres(process.env.DATABASE_URL!);

    try {
        console.log("Applying migration 004...");
        const migration = readFileSync("neon/migrations/004_create_auth_users.sql", "utf-8");
        await sql.unsafe(migration);
        console.log("✓ Migration 004 applied successfully");

        await sql.end();
    } catch (error) {
        console.error("Migration error:", error);
        process.exit(1);
    }
}

runMigration();
