"use server"

import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-checks"

// Lazy Init Admin Client
function getAdminDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}

export async function getStaffUsers() {
    const supabaseAdmin = getAdminDb()

    // 1. Get all profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*")

    if (profileError) throw profileError

    // 2. Get all auth users to get their emails
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
        console.error("Auth list users error:", authError)
        // If auth fetch fails, just return profiles without email to avoid crashing the page
        return profiles
    }

    // 3. Merge email and created_at into profiles
    return profiles.map(profile => {
        const authUser = users.find(u => u.id === profile.id)
        return {
            ...profile,
            email: authUser?.email || "",
            // Profile table doesn't have created_at, so we take it from Auth
            created_at: authUser?.created_at || profile.updated_at
        }
    })
}

export async function createStaffUser(formData: FormData) {
    await requireRole(["admin", "manager"])
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const role = formData.get("role") as string

    if (!email || !password || !fullName || !role) {
        return { error: "All fields are required" }
    }

    try {
        const supabaseAdmin = getAdminDb()

        // 1. Create User in Supabase Auth
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm
            user_metadata: {
                full_name: fullName,
            },
        })

        if (userError) throw userError

        // 2. Update Profile with Role
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({ role: role })
            .eq("id", userData.user.id)

        if (profileError) throw profileError

        revalidatePath("/dashboard/staff")
        return { success: true }

    } catch (error: any) {
        console.error("Error creating staff:", error)
        return { error: error.message }
    }
}

export async function deleteStaffUser(userId: string) {
    await requireRole(["admin"])

    try {
        const supabaseAdmin = getAdminDb()

        // 1. Delete from Auth (This cascades to profile usually if set up, 
        // but often we need to delete profile manualy or let cascade handle it)
        // Check cascade. Usually profile references auth.users. 
        // Deleting auth user is the root action.

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) throw error

        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch (e: any) {
        console.error("Delete Staff Error:", e)
        return { error: e.message }
    }
}

// PERFORMANCE METRICS

export async function getStaffPerformance(userId: string) {
    const supabase = await createServerClient()

    // Authorization Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Unauthorized" }

    // Maybe check if user is allowed to view performance? Managers/Admin only?
    // For now, allow view.

    // 1. Verify Profile exists
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

    if (!profile) return { error: "Staff not found" }

    // 2. Fetch Sales History (Orders)
    // We assume 'user_id' in orders table links to the staff who made the sale
    const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
            id, total_amount, created_at, status, payment_method,
            order_items (
                quantity, subtotal,
                products ( name )
            )
        `)
        .eq("user_id", userId)
        .eq("status", "COMPLETED") // Only count completed sales
        .order("created_at", { ascending: false })

    if (ordersError) {
        console.error("Performance Query Error:", ordersError)
        // If error is "column does not exist", we handle it gracefully?
        // return { error: "Tracking not available" }
        // Let's return empty stats rather than crash
        return {
            profile,
            stats: { totalSales: 0, orderCount: 0, averageTicket: 0, topProducts: [] },
            history: [] // No history available yet
        }
    }

    // 3. Calculate Metrics
    const totalSales = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const orderCount = orders.length
    const averageTicket = orderCount > 0 ? totalSales / orderCount : 0

    // 4. Calculate Top Products
    const productMap = new Map<string, { name: string, count: number, sales: number }>()

    orders.forEach(order => {
        order.order_items.forEach((item: any) => {
            if (!item.products) return
            const name = item.products.name

            const existing = productMap.get(name) || { name, count: 0, sales: 0 }
            existing.count += item.quantity
            existing.sales += item.subtotal
            productMap.set(name, existing)
        })
    })

    const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    // 5. Daily Sales (Last 7 days?) - Logic for charts if needed, but list is fine for now.

    return {
        profile,
        stats: {
            totalSales,
            orderCount,
            averageTicket,
            topProducts
        },
        history: orders
    }
}
