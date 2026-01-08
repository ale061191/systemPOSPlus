import { getDashboardStats } from "@/app/actions/dashboard"
import { DashboardClient } from "./dashboard-client"

import { getCurrentRole } from "@/lib/auth-checks"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const role = await getCurrentRole()
    if (role !== "admin") {
        redirect("/dashboard/pos")
    }

    const stats = await getDashboardStats()

    return <DashboardClient stats={stats} />
}
