import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function cleanupProfiles() {
    try {
        console.log('🔍 Checking profiles...');

        // Get all profiles
        const result = await pool.query('SELECT * FROM profiles ORDER BY created_at DESC');
        console.log(`\nFound ${result.rows.length} profiles:`);

        result.rows.forEach((profile, index) => {
            console.log(`\n${index + 1}. Profile:`);
            console.log(`   ID: ${profile.id}`);
            console.log(`   Display Name: ${profile.display_name || 'NULL'}`);
            console.log(`   Email: ${profile.email || 'N/A'}`);
            console.log(`   Private: ${profile.is_private}`);
            console.log(`   Created: ${profile.created_at}`);
        });

        // Keep only the most recent one
        if (result.rows.length > 1) {
            console.log('\n⚠️  Multiple profiles found. Keeping the most recent one...');
            const keepId = result.rows[0].id;
            const deleteIds = result.rows.slice(1).map(p => p.id);

            for (const id of deleteIds) {
                await pool.query('DELETE FROM profiles WHERE id = $1', [id]);
                console.log(`🗑️  Deleted profile: ${id}`);
            }

            console.log(`✅ Kept profile: ${keepId}`);
        } else {
            console.log('\n✅ No duplicates found!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

cleanupProfiles();
