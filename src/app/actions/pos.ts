"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Lazy Init Admin Client
function getAdminDb() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function createOrder({ items, total, paymentMethod, customerId }: {
    items: any[],
    total: number,
    paymentMethod: string,
    customerId?: string
}) {
    // 0. Get Current User (Cashier)
    const supabase = await createClient() // Standard client for auth
    const { data: { user } } = await supabase.auth.getUser()

    try {
        const adminDb = getAdminDb()

        // 1. Create Order
        const { data: orderData, error: orderError } = await adminDb
            .from("orders")
            .insert({
                total_amount: total,
                payment_method: paymentMethod,
                status: "COMPLETED",
                customer_id: customerId || null,
                user_id: user?.id || null // Track the cashier
            })
            .select()
            .single()

        if (orderError) throw orderError

        const orderId = orderData.id

        // 2. Create Order Items
        const orderItemsData = items.map((item: any) => ({
            order_id: orderId,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity
        }))

        const { error: itemsError } = await adminDb
            .from("order_items")
            .insert(orderItemsData)

        if (itemsError) throw itemsError

        // 3. Update Stock & Record Movement
        for (const item of items) {
            // Manual Decrement (Robust & Simple with Admin)
            const { data: prod } = await adminDb.from('products').select('stock').eq('id', item.id).single()

            if (prod) {
                const newStock = prod.stock - item.quantity

                await adminDb.from('products').update({ stock: newStock }).eq('id', item.id)

                // Record Movement
                await adminDb.from('stock_movements').insert({
                    product_id: item.id,
                    type: 'SALE',
                    quantity: item.quantity,
                    reason: `Order #${orderId.slice(0, 8)}`,
                    // user_id: we don't have it since we bypassed auth, usually optional or system
                })
            }
        }

        revalidatePath("/dashboard/pos")
        revalidatePath("/dashboard/stock")
        revalidatePath("/dashboard")

        return { success: true, orderId }

    } catch (e: any) {
        console.error("Checkout Error:", e)
        return { error: e.message }
    }
}
