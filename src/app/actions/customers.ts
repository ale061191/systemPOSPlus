"use server"

import { createClient } from "@/lib/supabase/server"

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
        .select("*")
        .order("created_at", { ascending: false })

    return data || []
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

    if (!fullName) return { error: "Full Name is required" }

    const customerData: any = {
        full_name: fullName,
        cedula: cedula || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null
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

    return { success: true, customer: data }
}

export async function deleteCustomer(id: string) {
    const supabase = await createClient()

    // Check permission - maybe only managers/admins?
    // For now let's reuse the requireRole logic or just check user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id)

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
