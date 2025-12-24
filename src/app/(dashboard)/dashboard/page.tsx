import { getDashboardStats } from "@/app/actions/dashboard"
import { DashboardClient } from "./dashboard-client"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const stats = await getDashboardStats()

    return <DashboardClient stats={stats} />
}
