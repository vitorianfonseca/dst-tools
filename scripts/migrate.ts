import { readFileSync } from 'node:fs';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const sql = readFileSync('./neon/migrations/001_initial.sql', 'utf-8');
  
  try {
    console.log('🚀 Applying migration...');
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
