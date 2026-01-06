"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-checks"

export async function getCustomerByCedula(cedula: string) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Unauthorized" }

    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("cedula", cedula)
        .single()

    if (error) {
        return { error: "Customer not found" }
    }

    return { customer: data }
}

export async function getCustomers() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return []

    const { data } = await supabase
        .from("customers")
        .select("*, orders(total_amount, status)")
        .order("created_at", { ascending: false })

    if (!data) return []

    // Calculate total spent for each customer
    const customersWithStats = data.map((customer: any) => {
        const totalSpent = customer.orders
            ?.filter((o: any) => o.status === 'COMPLETED')
            .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0

        // Clean up orders array from result to avoid payload bloat if not needed
        const { orders, ...customerClean } = customer
        return {
            ...customerClean,
            total_spent: totalSpent
        }
    })

    return customersWithStats
}

export async function createCustomer(formData: FormData) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: "Unauthorized" }
    }

    // Role check
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role === 'cashier') {
        const allowed = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        // Cashiers can create customers, logic is fine. 
        // Logic enforcement is already in RLS policies usually, but explicit check:
        // Actually Cashiers SHOULD be able to create customers.
    }

    const fullName = formData.get("fullName") as string
    const cedula = formData.get("cedula") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const notes = formData.get("notes") as string
    const clientType = formData.get("client_type") as string

    if (!fullName) return { error: "Full Name is required" }

    const customerData: any = {
        full_name: fullName,
        cedula: cedula || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        client_type: clientType || 'Externo'
    }

    const { data, error } = await supabase
        .from("customers")
        .insert(customerData)
        .select()
        .single()

    if (error) {
        console.error("Create customer error:", error)
        return { error: error.message }
    }

    revalidatePath("/dashboard/customers")
    return { success: true, customer: data }
}

export async function updateCustomer(formData: FormData) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: "Unauthorized" }
    }

    const id = formData.get("id") as string
    const fullName = formData.get("fullName") as string
    const cedula = formData.get("cedula") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const notes = formData.get("notes") as string
    const clientType = formData.get("client_type") as string

    if (!id || !fullName) return { error: "ID and Full Name are required" }

    const customerData: any = {
        full_name: fullName,
        cedula: cedula || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        client_type: clientType || 'Externo'
    }

    const { error } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", id)

    if (error) {
        console.error("Update customer error:", error)
        return { error: error.message }
    }

    revalidatePath("/dashboard/customers")
    return { success: true }
}

export async function deleteCustomer(id: string) {
    const supabase = await createClient()

    // Strict Admin Check
    try {
        await requireRole(["admin"])
    } catch (e: any) {
        return { error: "Unauthorized: Admins only" }
    }

    const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id)

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function getCustomerDetails(customerId: string) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Unauthorized" }

    // 1. Fetch Customer Profile
    const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single()

    if (customerError) return { error: "Customer not found" }

    // 2. Fetch Orders & Items (Deep Query)
    // We need completed orders to calculate stats
    const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (
                *,
                products ( name, image_url, category_id )
            )
        `)
        .eq("customer_id", customerId)
        .eq("status", "COMPLETED")
        .order("created_at", { ascending: false })

    if (ordersError) {
        console.error("Error fetching customer orders:", ordersError)
        return { error: "Failed to fetch history" }
    }

    // 3. Aggregate Stats
    const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const orderCount = orders.length
    const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0

    // 4. Calculate Preferred Products
    const productMap = new Map<string, { name: string, count: number, spent: number, image: string }>()

    orders.forEach(order => {
        order.order_items.forEach((item: any) => {
            if (!item.products) return

            const productId = item.product_id
            const existing = productMap.get(productId) || {
                name: item.products.name,
                count: 0,
                spent: 0,
                image: item.products.image_url
            }

            existing.count += item.quantity
            existing.spent += item.subtotal
            productMap.set(productId, existing)
        })
    })

    const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) // Top 5

    return {
        customer,
        stats: {
            totalSpent,
            orderCount,
            averageOrderValue,
        },
        history: orders, // Recent orders
        topProducts
    }
}
