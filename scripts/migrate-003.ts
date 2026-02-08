import { readFileSync } from 'node:fs';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function migrate() {
    const sql = readFileSync('./neon/migrations/003_add_email_to_profiles.sql', 'utf-8');

    try {
        console.log('🚀 Applying migration 003...');
        await pool.query(sql);
        console.log('✅ Migration applied successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
