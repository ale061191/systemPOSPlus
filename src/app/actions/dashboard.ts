"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
    const supabase = await createClient()

    // Initialize result with zeros to safely return partial data
    let totalSales = 0
    let totalOrders = 0
    let recentOrders: any[] = []
    let chartData: any[] = []
    let topSelling: any[] = []
    let cancelledCount = 0
    let lowStockProducts: any[] = []
    let healthyProducts: any[] = []
    let totalProductsCount = 0

    try {
        // 1. Total Sales & Count
        try {
            const { data: orders, error: ordersError } = await supabase
                .from("orders")
                .select("total_amount, created_at, status")
                .eq("status", "COMPLETED")

            if (ordersError) {
                console.error("Dashboard: Orders Error", JSON.stringify(ordersError, null, 2))
            } else {
                const safeOrders = orders || []
                totalSales = safeOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
                totalOrders = safeOrders.length

                // 3. Chart Data (Calculated from orders)
                const chartDataMap = new Map<string, number>()
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                const today = new Date()
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today)
                    d.setDate(d.getDate() - i)
                    chartDataMap.set(days[d.getDay()], 0)
                }
                safeOrders.forEach(order => {
                    const dayName = days[new Date(order.created_at).getDay()]
                    if (chartDataMap.has(dayName)) chartDataMap.set(dayName, (chartDataMap.get(dayName) || 0) + Number(order.total_amount))
                })
                chartData = Array.from(chartDataMap).map(([name, total]) => ({ name, total }))
            }
        } catch (err) {
            console.error("Dashboard: Orders Exception", err)
        }

        // 2. Recent Orders
        try {
            const { data: recent, error: recentError } = await supabase
                .from("orders")
                .select("*, customers(full_name)")
                .order("created_at", { ascending: false })
                .limit(50)

            if (recentError) console.error("Dashboard: Recent Orders Error", JSON.stringify(recentError, null, 2))
            else recentOrders = recent || []
        } catch (err) {
            console.error("Dashboard: Recent Orders Exception", err)
        }

        // 4. Top Selling
        try {
            const { data: items, error: itemsError } = await supabase
                .from("order_items")
                .select("quantity, unit_price, products ( name, image_url )")

            if (itemsError) console.error("Dashboard: Items Error", JSON.stringify(itemsError, null, 2))
            else if (items) {
                const stats = new Map<string, any>()
                items.forEach((item: any) => {
                    if (!item.products) return
                    const key = item.products.name
                    const s = stats.get(key) || { name: key, image: item.products.image_url, count: 0, revenue: 0 }
                    s.count += item.quantity
                    s.revenue += (item.quantity * item.unit_price)
                    stats.set(key, s)
                })
                topSelling = Array.from(stats.values()).sort((a, b) => b.count - a.count).slice(0, 5)
            }
        } catch (err) {
            console.error("Dashboard: Top Selling Exception", err)
        }

        // 5. Cancelled
        try {
            const { count: cncl, error: cnclError } = await supabase
                .from("orders")
                .select("*", { count: 'exact', head: true })
                .eq("status", "CANCELLED")
            if (!cnclError) cancelledCount = cncl || 0
        } catch (err) {
            console.error("Dashboard: Cancelled Exception", err)
        }

        // 6. LOW STOCK & HEALTHY CALCULATION (Mirrored POS Logic)
        try {
            // Fetch exact same columns as POS/Inventory to ensure consistency
            const { data: allProducts, error: prodError } = await supabase
                .from("products")
                .select("*, categories(name, color)")
                .order("created_at", { ascending: false })

            if (prodError) {
                console.error("Dashboard: Products Error", JSON.stringify(prodError, null, 2))
            } else {
                const safeProds = allProducts || []
                totalProductsCount = safeProds.length

                // Use robust JavaScript filtering with Percentage Logic
                // Critical: <= 20%, Warning: <= 50%
                // We consider a product "Low Stock" if EITHER Store OR Warehouse is <= 50%
                lowStockProducts = safeProds.filter((p: any) => {
                    const storeInitial = p.initial_stock || p.stock || 1
                    const storePct = (Number(p.stock) / storeInitial) * 100

                    const whseInitial = p.initial_stock_warehouse || p.stock_warehouse || 1
                    const whsePct = (Number(p.stock_warehouse) / whseInitial) * 100

                    // Include if either is in Warning (<=50%) or Critical (<=20%) range
                    return (storePct <= 50) || (whsePct <= 50)
                }).sort((a: any, b: any) => {
                    // Sort order: Critical first, then Warning.
                    // Lower percentage gets higher priority. 
                    // We calculate the "worst" percentage for each product to sort.
                    const aStorePct = (Number(a.stock) / (a.initial_stock || a.stock || 1))
                    const aWhsePct = (Number(a.stock_warehouse) / (a.initial_stock_warehouse || a.stock_warehouse || 1))
                    const aMin = Math.min(aStorePct, aWhsePct)

                    const bStorePct = (Number(b.stock) / (b.initial_stock || b.stock || 1))
                    const bWhsePct = (Number(b.stock_warehouse) / (b.initial_stock_warehouse || b.stock_warehouse || 1))
                    const bMin = Math.min(bStorePct, bWhsePct)

                    return aMin - bMin
                })

                // Healthy products are those that are NOT in the low stock list
                // (i.e. both Store and Warehouse > 50%)
                const lowStockIds = new Set(lowStockProducts.map(p => p.id))
                healthyProducts = safeProds.filter((p: any) => !lowStockIds.has(p.id))
                    .sort((a: any, b: any) => Number(b.stock) - Number(a.stock))
            }
        } catch (prodErr) {
            console.error("Dashboard: Products Exception", prodErr)
        }

        return {
            totalSales,
            totalOrders,
            recentOrders,
            chartData,
            topSelling,
            cancelledCount,
            lowStockProducts,
            healthyProducts, // New field
            totalProductsCount
        }

    } catch (e: any) {
        console.error("Dashboard Fatal Error:", JSON.stringify(e, null, 2))
        // Return safe default so dashboard never crashes
        return {
            totalSales,
            totalOrders,
            recentOrders,
            chartData,
            topSelling,
            cancelledCount,
            lowStockProducts,
            totalProductsCount
        }
    }
}
