import { ReportsClient } from "./reports-client"
import { getCurrentRole } from "@/lib/auth-checks"
import { redirect } from "next/navigation"

export default async function ReportsPage() {
    const role = await getCurrentRole()
    if (role !== "admin") {
        redirect("/dashboard/pos")
    }

    return (
        <div className="p-6">
            <ReportsClient />
        </div>
    )
}
