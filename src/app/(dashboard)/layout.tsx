import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CurrencyProvider } from "@/providers/currency-provider"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    const role = profile?.role || "cashier"

    return (
        <CurrencyProvider>
            <div className="grid h-screen w-full lg:grid-cols-[240px_1fr] overflow-hidden">
                <div className="hidden lg:block border-r bg-muted/40">
                    <Sidebar role={role} />
                </div>
                <div className="flex flex-col h-full overflow-hidden">
                    <Header role={role} />
                    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </CurrencyProvider>
    )
}
