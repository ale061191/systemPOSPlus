"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getOrders() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Unauthorized" }

    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            customers ( full_name, email ),
            order_items ( count )
        `)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching orders:", error)
        return { error: "Failed to fetch orders" }
    }

    return { orders: data }
}

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Unauthorized" }

    // Optional: Check if user is manager/admin? For now let's allow all staff.

    const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)

    if (error) {
        return { error: "Failed to update status" }
    }

    revalidatePath("/dashboard/orders")
    return { success: true }
}

export async function getOrderDetails(orderId: string) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Unauthorized" }

    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            customers ( full_name, email, phone, cedula ),
            order_items (
                *,
                products ( name, image_url, sku )
            )
        `)
        .eq("id", orderId)
        .single()

    if (error) {
        return { error: "Order not found" }
    }

    return { order: data }
}
