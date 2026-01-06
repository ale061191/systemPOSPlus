
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
    console.log("Checking customers table schema...")

    // Insert a dummy customer to check structure without worrying about existing data
    const dummyId = "00000000-0000-0000-0000-000000000000"

    // Try to select * from customers limit 1
    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .limit(1)

    if (error) {
        console.error("Error fetching customers:", error)
        return
    }

    if (data && data.length > 0) {
        const keys = Object.keys(data[0])
        console.log("Columns found in customers table:", keys)
        if (keys.includes("client_type")) {
            console.log("✅ client_type column EXISTS.")
        } else {
            console.log("❌ client_type column is MISSING.")
        }
    } else {
        console.log("No customers found to check schema.")
        // Try creating one with client_type to see if it errors
    }
}

checkSchema()
