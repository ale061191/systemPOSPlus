"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    ShoppingBasket,
    Package,
    ClipboardList,
    CalendarDays,
    Users,
    Settings,
    LifeBuoy,
    BarChart3,
    LogOut
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { logout } from "@/app/actions/auth"
import { useLanguage } from "@/providers/language-provider"

export function Sidebar({ role = "cashier", className, onNavigate }: { role?: string, className?: string, onNavigate?: () => void }) {
    const pathname = usePathname()
    const { t } = useLanguage()

    // Dynamic Sidebar Items using translation
    const sidebarItems = [
        { icon: LayoutDashboard, label: t.dashboard, href: "/dashboard" },
        { icon: ShoppingBasket, label: t.pos, href: "/dashboard/pos" },
        { icon: Package, label: t.products, href: "/dashboard/products" },
        { icon: Package, label: t.categories, href: "/dashboard/categories" },
        { icon: ClipboardList, label: t.stock, href: "/dashboard/stock" },
        { icon: ClipboardList, label: t.orders, href: "/dashboard/orders" },
        // { icon: CalendarDays, label: t.reservation, href: "/dashboard/reservation" }, 
        { icon: Users, label: t.staff, href: "/dashboard/staff" },
        { icon: Users, label: t.customers, href: "/dashboard/customers" },
        { icon: BarChart3, label: t.reports, href: "/dashboard/reports" },
        { icon: Settings, label: t.settings, href: "/dashboard/settings" },
    ]

    const filteredItems = sidebarItems.filter(item => {
        // Explicitly hide settings for non-admins
        if (item.href === "/dashboard/settings" && role !== "admin") {
            return false
        }

        // Explicitly hide Dashboard (Main Panel) for non-admins
        if (item.href === "/dashboard" && role !== "admin") {
            return false
        }

        // Explicitly hide Reports for non-admins village
        if (item.href === "/dashboard/reports" && role !== "admin") {
            return false
        }

        // Cashiers only see specific items village
        if (role === "cashier") {
            const allowed = ["/dashboard", "/dashboard/pos", "/dashboard/orders", "/dashboard/reservation", "/dashboard/customers", "/dashboard/reports"]
            return allowed.includes(item.href)
        }

        // Managers/Admins see everything else by default
        return true
    })

    return (
        <div className={cn("flex h-full max-h-screen flex-col gap-2 border-r bg-background", className)}>
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold">
                    <div className="bg-emerald-600 text-white rounded-full p-1">
                        <ShoppingBasket className="h-5 w-5" />
                    </div>
                    <span className="text-xl tracking-tight">SystemPOS+</span>
                </Link>
            </div>

            <div className="flex-1 overflow-auto py-4 px-3">
                <nav className="grid items-start gap-2 px-2 text-sm font-medium">
                    {filteredItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600",
                                pathname === item.href && "bg-emerald-50 text-emerald-600 font-semibold"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t">
                <div className="mb-2 px-2 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    Role: {role}
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    onClick={() => logout()}
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
