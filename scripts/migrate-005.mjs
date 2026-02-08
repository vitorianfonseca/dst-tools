import { readFileSync } from 'node:fs';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function migrate() {
    try {
        console.log('🚀 Applying migration 005...');
        const sql = readFileSync('./neon/migrations/005_create_workspace_tiles.sql', 'utf-8');
        await pool.query(sql);
        console.log('✅ Migration 005 applied successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
