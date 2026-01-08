"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
    const supabase = await createClient()

    // Initialize result with zeros to safely return partial data
    let totalSales = 0
    let totalOrders = 0
    let recentOrders: any[] = []
    let chartData: any[] = []
    let topSelling: any = { day: [], week: [], month: [] }
    let cancelledCount = 0
    let lowStockProducts: any[] = []
    let healthyProducts: any[] = []
    let totalProductsCount = 0
    const today = new Date()

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
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

                // Initialize last 7 days
                const chartDataArray: any[] = []
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today)
                    d.setDate(d.getDate() - i)
                    chartDataArray.push({
                        name: days[d.getDay()],
                        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), // e.g. "Jan 7, 2026"
                        rawDate: d.toISOString().split('T')[0], // YYYY-MM-DD for matching
                        total: 0,
                        ordersCount: 0,
                        cancelledCount: 0
                    })
                }

                // Fill with data by iterating COMPLETED orders
                safeOrders.forEach(order => {
                    const orderDate = order.created_at.split('T')[0] // YYYY-MM-DD
                    const dayEntry = chartDataArray.find(d => d.rawDate === orderDate)
                    if (dayEntry) {
                        dayEntry.total += Number(order.total_amount)
                        dayEntry.ordersCount += 1
                    }
                })

                chartData = chartDataArray
            }
        } catch (err) {
            console.error("Dashboard: Orders Exception", err)
        }

        // 2. Recent Orders (Last 7 Days to match chart)
        try {
            const startDate = new Date(today)
            startDate.setDate(startDate.getDate() - 6)
            const startDateStr = startDate.toISOString().split('T')[0]

            const { data: recent, error: recentError } = await supabase
                .from("orders")
                .select("*, customers(full_name)")
                .gte("created_at", `${startDateStr}T00:00:00`)
                .order("created_at", { ascending: false })

            if (recentError) console.error("Dashboard: Recent Orders Error", JSON.stringify(recentError, null, 2))
            else recentOrders = recent || []
        } catch (err) {
            console.error("Dashboard: Recent Orders Exception", err)
        }

        // 4. Top Selling Logic
        try {
            // Fetch items from the last 30 days
            const monthAgo = new Date(today)
            monthAgo.setDate(monthAgo.getDate() - 30)

            const { data: items, error: itemsError } = await supabase
                .from("order_items")
                .select("quantity, product_id, products(name, price, image_url), orders!inner(created_at, status)")
                .eq("orders.status", "COMPLETED")
                .gte("orders.created_at", monthAgo.toISOString())

            if (itemsError) {
                console.error("Dashboard: Top Selling Error", itemsError)
            } else {
                const safeItems = items || []

                const aggregate = (filterFn: (item: any) => boolean) => {
                    const counts: Record<string, any> = {}
                    safeItems.filter(filterFn).forEach((item: any) => {
                        const pid = item.product_id
                        if (!counts[pid]) {
                            counts[pid] = {
                                product_id: pid,
                                name: item.products?.name,
                                image: item.products?.image_url,
                                count: 0,
                                revenue: 0
                            }
                        }
                        counts[pid].count += item.quantity
                        counts[pid].revenue += Number(item.quantity) * Number(item.products?.price || 0)
                    })
                    return Object.values(counts)
                        .sort((a: any, b: any) => b.count - a.count)
                        .slice(0, 5)
                }

                const todayStr = today.toISOString().split('T')[0]
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)

                topSelling = {
                    day: aggregate((i: any) => i.orders.created_at.startsWith(todayStr)),
                    week: aggregate((i: any) => new Date(i.orders.created_at) >= weekAgo),
                    month: aggregate(() => true) // Already filtered to 30 days
                }
            }
        } catch (err) {
            console.error("Dashboard: Top Selling Exception", err)
        }

        // 5. Cancelled (Modified to fetch data for chart distribution)
        try {
            const { data: cancelledOrders, error: cnclError } = await supabase
                .from("orders")
                .select("created_at")
                .eq("status", "CANCELLED")

            if (!cnclError && cancelledOrders) {
                cancelledCount = cancelledOrders.length

                // Distribute cancelled count to chartData
                cancelledOrders.forEach(order => {
                    const orderDate = order.created_at.split('T')[0]
                    const dayEntry = chartData.find(d => d.rawDate === orderDate)
                    if (dayEntry) {
                        dayEntry.cancelledCount += 1
                    }
                })
            }
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
