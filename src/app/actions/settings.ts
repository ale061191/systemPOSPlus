"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth-checks"

export async function getStoreSettings() {
    const supabase = await createClient()

    // Auth check (any authenticated user can view)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Unauthorized" }

    const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .single()

    if (error) {
        console.error("Fetch settings error:", error)
        return { error: "Failed to fetch settings" }
    }

    return { settings: data }
}

export async function updateStoreSettings(formData: FormData) {
    const supabase = await createClient()

    // 1. Strict Admin Check
    try {
        await requireRole(["admin"])
    } catch (e: any) {
        return { error: "Unauthorized: Admins only" }
    }

    // 2. Extract Data
    const store_name = formData.get("storeName") as string
    const address = formData.get("address") as string
    const phone = formData.get("phone") as string
    const tax_rate = parseFloat(formData.get("taxRate") as string || "0")
    const footer_message = formData.get("footerMessage") as string
    const logo_url = formData.get("logo_url") as string | null

    const updates: any = {
        store_name,
        address,
        phone,
        tax_rate,
        footer_message,
        updated_at: new Date().toISOString()
    }

    if (logo_url) {
        updates.logo_url = logo_url
    }

    // 3. Update DB (Singleton Row ID 1)
    const { error } = await supabase
        .from("store_settings")
        .update(updates)
        .eq("id", 1)

    if (error) {
        console.error("Update settings error:", error)
        return { error: error.message }
    }

    revalidatePath("/dashboard") // Revalidate everything as logo is global
    return { success: true }
}

export async function deleteStoreLogo() {
    const supabase = await createClient()

    try {
        await requireRole(["admin"])
    } catch (e: any) {
        return { error: "Unauthorized: Admins only" }
    }

    const { error } = await supabase
        .from("store_settings")
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq("id", 1)

    if (error) {
        console.error("Delete logo error:", error)
        return { error: error.message }
    }

    revalidatePath("/dashboard")
    return { success: true }
}
