"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Bell, Moon, Sun, Menu, DollarSign } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DateTimeDisplay } from "@/components/dashboard/date-time-display"
import { GlobalSearch } from "@/components/dashboard/global-search"
import { Sidebar } from "@/components/dashboard/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getStoreSettings } from "@/app/actions/settings"
import { useCurrency } from "@/providers/currency-provider"
import { Badge } from "@/components/ui/badge"

export function Header({ role }: { role?: string }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const router = useRouter()

    // Global Currency Context
    const { currency, exchangeRate, toggleCurrency } = useCurrency()

    useEffect(() => {
        async function loadLogo() {
            const { settings } = await getStoreSettings()
            if (settings?.logo_url) {
                setLogoUrl(settings.logo_url)
            }
        }
        loadLogo()
    }, [])

    async function handleLogout() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
    }

    return (
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <div className="sr-only">
                        <SheetTitle>Navigation Menu</SheetTitle>
                    </div>
                    <Sidebar role={role} className="border-r-0" onNavigate={() => setIsMobileMenuOpen(false)} />
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-4">
                {/* Currency Toggle */}
                <Button
                    variant={currency === "USD" ? "outline" : "default"}
                    onClick={toggleCurrency}
                    className={`gap-2 h-9 px-3 transition-colors ${currency === "VES" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                >
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold text-xs">{currency}</span>
                    {currency === "VES" && exchangeRate > 0 && (
                        <span className="ml-1 text-[10px] opacity-80 border-l pl-2 border-white/20">
                            ~{exchangeRate.toFixed(2)}
                        </span>
                    )}
                </Button>

                <DateTimeDisplay />
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Moon className="h-5 w-5" />
                    <span className="sr-only">Toggle theme</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full overflow-hidden border border-gray-200">
                            <Avatar>
                                <AvatarImage src={logoUrl || "https://github.com/shadcn.png"} className="object-cover" />
                                <AvatarFallback>POS</AvatarFallback>
                            </Avatar>
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Only Admin sees Settings */}
                        {role === 'admin' && (
                            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                                Settings
                            </DropdownMenuItem>
                        )}

                        {/* Support removed as requested */}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500 cursor-pointer" onSelect={handleLogout}>
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
