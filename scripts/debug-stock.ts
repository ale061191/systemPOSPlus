
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugStock() {
    console.log("Debugging Stock Levels...")

    const { data: products, error } = await supabase
        .from("products")
        .select("id, name, stock")
        .lte("stock", 40)

    if (error) {
        console.error("Error fetching low stock:", error)
        return
    }

    console.log("Low Stock Products (<= 40):", products)

    const { data: specific, error: specificError } = await supabase
        .from("products")
        .select("id, name, stock")
        .ilike("name", "%Citrico Energetico%") // Try exact name match from user image

    if (specificError) {
        console.error("Error fetching specific product:", specificError)
    } else {
        console.log("Specific Product Check:", specific)
    }
}

debugStock()
