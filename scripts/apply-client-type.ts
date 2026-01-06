
import { Client } from 'pg'
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

// Try common env var names for DB connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL

if (!connectionString) {
    console.error("❌ No DATABASE_URL or POSTGRES_URL found in .env.local")
    process.exit(1)
}

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase usually
})

async function runMigration() {
    try {
        await client.connect()
        console.log("Connected to database.")

        console.log("Adding client_type column...")
        await client.query(`
            alter table customers 
            add column if not exists client_type text default 'Externo';
            
            comment on column customers.client_type is 'Type of customer: Profesor, Estudiante, Trabajador, Externo';
        `)

        console.log("✅ Successfully added client_type column.")
    } catch (err) {
        console.error("❌ Error applying migration:", err)
    } finally {
        await client.end()
    }
}

runMigration()
