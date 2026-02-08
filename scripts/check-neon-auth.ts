import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function getNeonAuthConfig() {
    try {
        console.log('🔍 Checking Neon Auth configuration...\n');

        // Check if neon_auth schema exists
        const schemaCheck = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'neon_auth'
    `);

        if (schemaCheck.rows.length === 0) {
            console.log('❌ Neon Auth schema not found');
            return;
        }

        console.log('✅ Neon Auth schema exists\n');

        // Get project config
        const config = await pool.query(`
      SELECT * FROM neon_auth.project_config LIMIT 1
    `);

        if (config.rows.length > 0) {
            console.log('📋 Neon Auth Configuration:');
            console.log(JSON.stringify(config.rows[0], null, 2));
        } else {
            console.log('⚠️  No project configuration found in neon_auth.project_config');
        }

        // Check tables
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'neon_auth'
      ORDER BY table_name
    `);

        console.log('\n📊 Neon Auth Tables:');
        tables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

getNeonAuthConfig();
