import { readFileSync, readdirSync } from 'node:fs';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log('🚀 Applying migrations...');

    // Get all SQL files in migrations directory
    const migrationsDir = './neon/migrations';
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      console.log(`📄 Applying ${file}...`);
      await pool.query(sql);
      console.log(`✅ ${file} applied successfully`);
    }

    console.log('✅ All migrations applied successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
