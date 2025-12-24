
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStock() {
    console.log("Debugging Stock Levels (JS)...");

    // 1. Check Low Stock Query
    const { data: products, error } = await supabase
        .from("products")
        .select("id, name, stock")
        .lte("stock", 40);

    if (error) {
        console.error("Error fetching low stock:", error);
    } else {
        console.log("Low Stock Products (<= 40):", products.length > 0 ? products : "None found");
    }

    // 2. Check Specific Product
    const { data: specific, error: specificError } = await supabase
        .from("products")
        .select("id, name, stock")
        .ilike("name", "%Citrico%");

    if (specificError) {
        console.error("Error fetching specific product:", specificError);
    } else {
        console.log("Specific Product Check ('Citrico'):", specific);
    }

    // 3. List ALL products (Limit 20) to verify what exists
    console.log("Listing Top 20 Products in DB:");
    const { data: allProducts, error: allError } = await supabase
        .from("products")
        .select("id, name, stock")
        .limit(20);

    if (allError) {
        console.error("Error fetching all products:", allError);
    } else {
        console.table(allProducts);
    }
}

debugStock();
