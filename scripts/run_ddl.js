
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("❌ Error: DATABASE_URL is not defined in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase transaction pooler/direct connection
    });

    try {
        await client.connect();
        console.log("✅ Connected to database");

        const migrationPath = process.argv[2];
        if (!migrationPath) {
            console.error("❌ Error: No migration file provided");
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log(`Running migration: ${migrationPath}`);

        await client.query(sql);

        console.log("✅ Migration applied successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
