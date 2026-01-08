"use client"

import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, ShoppingCart, RefreshCcw, CalendarCheck, AlertTriangle, AlertOctagon, CheckCircle } from "lucide-react"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { useLanguage } from "@/providers/language-provider"
import { useCurrency } from "@/providers/currency-provider"
import { StockDetailsDialog } from "@/components/dashboard/stock-details-dialog"

export function DashboardClient({ stats }: { stats: any }) {
    const { t } = useLanguage()
    const { formatCurrency } = useCurrency()

    // Safety checks
    const chartData = stats?.chartData || []
    const recentOrders = stats?.recentOrders || []
    const totalSales = stats?.totalSales || 0
    const totalOrders = stats?.totalOrders || 0

    // --- DYNAMIC SALES STATE ---
    // Find today's data using ISO date (YYYY-MM-DD) for robustness
    const todayRaw = new Date().toISOString().split('T')[0]
    // Fallback to last entry if exact match not found (e.g. timezone diffs)
    const todayData = chartData.find((d: any) => d.rawDate === todayRaw) || chartData[chartData.length - 1] || { total: 0, date: todayRaw, rawDate: todayRaw }

    const [selectedDateData, setSelectedDateData] = useState<any>(null)

    // Debugging interaction
    const handleDateSelect = (data: any) => {
        setSelectedDateData(data)
    }

    // Display Logic
    const displaySales = selectedDateData ? selectedDateData.total : todayData.total
    const displayLabel = selectedDateData ? `${selectedDateData.date}` : t.today || "Today"
    const isToday = !selectedDateData || selectedDateData.rawDate === todayData.rawDate

    // Percentage Logic Helper
    const calculateGrowth = (metricKey: string, invertColor: boolean = false) => {
        // Match by rawDate
        const targetRaw = selectedDateData?.rawDate || todayData.rawDate
        const currentIndex = chartData.findIndex((d: any) => d.rawDate === targetRaw)
        const prevData = currentIndex > 0 ? chartData[currentIndex - 1] : null

        const currentVal = selectedDateData ? selectedDateData[metricKey] : todayData[metricKey]

        let change = 0
        let label = t.no_data || "No Data"
        let color = "text-muted-foreground"

        if (prevData) {
            const prevVal = prevData[metricKey] || 0

            if (prevVal === 0) {
                change = currentVal > 0 ? 100 : 0
            } else {
                change = ((currentVal - prevVal) / prevVal) * 100
            }

            label = `${change > 0 ? "+" : ""}${change.toFixed(1)}% ${t.vs_yesterday || "vs previous day"}`

            if (change > 0) color = invertColor ? "text-red-600" : "text-emerald-600"
            else if (change < 0) color = invertColor ? "text-emerald-600" : "text-red-600"
        } else {
            label = t.no_prior_data || "No prior data"
        }

        return { val: currentVal, label, color }
    }

    const salesStats = calculateGrowth('total', false)
    const ordersStats = calculateGrowth('ordersCount', false)
    const returnsStats = calculateGrowth('cancelledCount', true) // Invert: Less returns is better (green)

    // --- ALERTS LOGIC START ---
    // 1. Calculate Critical vs Warning items for the Alert Card summary
    const criticalItems = (stats?.lowStockProducts || []).filter((p: any) => {
        const sInit = p.initial_stock || p.stock || 1
        const wInit = p.initial_stock_warehouse || p.stock_warehouse || 1
        return ((p.stock / sInit) * 100 <= 20) || ((p.stock_warehouse / wInit) * 100 <= 20)
    })
    const criticalCount = criticalItems.length
    const warningCount = (stats?.lowStockProducts?.length || 0) - criticalCount

    const hasCritical = criticalCount > 0
    const hasWarning = warningCount > 0
    const hasAlerts = hasCritical || hasWarning

    // 2. Helper to determine display for a single row in the card
    const getRowAlertDisplay = (p: any) => {
        const sInit = p.initial_stock || p.stock || 1
        const wInit = p.initial_stock_warehouse || p.stock_warehouse || 1

        const sPct = (p.stock / sInit) * 100
        const wPct = (p.stock_warehouse / wInit) * 100

        // Prioritize showing Critical
        if (wPct <= 20) return { val: p.stock_warehouse, label: `(${t.whse})`, color: "text-red-600", dot: "bg-red-500" }
        if (sPct <= 20) return { val: p.stock, label: "", color: "text-red-600", dot: "bg-red-500" }

        // Then Warning
        if (wPct <= 50) return { val: p.stock_warehouse, label: `(${t.whse})`, color: "text-orange-600", dot: "bg-orange-500" }
        return { val: p.stock, label: "", color: "text-orange-600", dot: "bg-orange-500" }
    }
    // --- ALERTS LOGIC END ---


    // --- RECENT ORDERS LOGIC ---
    const targetDateStr = selectedDateData ? selectedDateData.rawDate : todayData.rawDate // YYYY-MM-DD

    // Fallback: If for some reason rawDate is missing from todayData (e.g. init), calculate it
    const safeTargetDateStr = targetDateStr || new Date().toISOString().split('T')[0]

    const filteredOrders = recentOrders.filter((order: any) => {
        if (!order.created_at) return false
        return order.created_at.startsWith(safeTargetDateStr)
    })

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">{t.dashboard}</h1>
            </div>

            {/* STATS CARDS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Sales */}
                {/* Total Sales (DYNAMIC) */}
                <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${!isToday ? 'border-violet-500/50 bg-violet-50/10' : ''}`}
                    onClick={() => setSelectedDateData(null)} // Click to reset
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {isToday ? t.total_sales : displayLabel}
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(salesStats.val)}</div>
                        <p className={`text-xs ${salesStats.color}`}>
                            {salesStats.label}
                        </p>
                    </CardContent>
                </Card>

                {/* Total Orders */}
                <Card
                    className={`transition-all hover:shadow-md ${!isToday ? 'border-violet-500/50 bg-violet-50/10' : ''}`}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.total_orders}</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                            <ShoppingCart className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ordersStats.val}</div>
                        <p className={`text-xs ${ordersStats.color}`}>
                            {ordersStats.label}
                        </p>
                    </CardContent>
                </Card>

                {/* Sales Return (Dynamically Linked) */}
                <Card
                    className={`transition-all hover:shadow-md ${!isToday ? 'border-violet-500/50 bg-violet-50/10' : ''}`}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.sales_return}</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <RefreshCcw className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{returnsStats.val}</div>
                        <p className={`text-xs ${returnsStats.color}`}>
                            {returnsStats.label}
                        </p>
                    </CardContent>
                </Card>

                {/* Low Stock Alerts (Replaces Reservations) */}
                {/* Low Stock Alerts (Traffic Light System) */}
                {/* Low Stock Alerts (Traffic Light System) */}
                <StockDetailsDialog
                    lowStockProducts={stats?.lowStockProducts || []}
                    healthyProducts={stats?.healthyProducts || []}
                    totalProductsCount={stats?.totalProductsCount || 0}
                >
                    <div className={`cursor-pointer hover:shadow-md transition-all rounded-lg border bg-card text-card-foreground shadow-sm ${hasCritical ? "border-red-500/50 bg-red-50/10" :
                        hasWarning ? "border-orange-500/50 bg-orange-50/10" :
                            "border-emerald-500/50 bg-emerald-50/10"
                        }`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="text-sm font-medium">{t.low_stock}</CardTitle>
                                {hasAlerts && (
                                    <div className="flex gap-2 text-[10px] mt-1 font-semibold">
                                        {criticalCount > 0 && <span className="text-red-600">{criticalCount} {t.critical}</span>}
                                        {warningCount > 0 && <span className="text-orange-600">{warningCount} {t.warning}</span>}
                                    </div>
                                )}
                            </div>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${hasCritical ? "bg-red-100 text-red-600" :
                                hasWarning ? "bg-orange-100 text-orange-600" :
                                    "bg-emerald-100 text-emerald-600"
                                }`}>
                                {hasCritical ? <AlertOctagon className="h-4 w-4" /> :
                                    hasWarning ? <AlertTriangle className="h-4 w-4" /> :
                                        <CheckCircle className="h-4 w-4" />}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {hasAlerts ? (
                                    <>
                                        {(stats?.lowStockProducts || []).slice(0, 3).map((product: any) => {
                                            const disp = getRowAlertDisplay(product)
                                            return (
                                                <div key={product.id} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full ${disp.dot}`} />
                                                        <span className="font-medium truncate max-w-[120px]" title={product.name}>
                                                            {product.name}
                                                        </span>
                                                    </div>
                                                    <span className={`font-bold text-xs ${disp.color}`}>
                                                        {disp.val} {disp.label}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                        {(stats?.lowStockProducts?.length || 0) > 3 && (
                                            <p className="text-xs text-center text-muted-foreground pt-1">
                                                + {(stats?.lowStockProducts?.length || 0) - 3} {t.more_items}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-2 text-emerald-600">
                                        <span className="text-2xl font-bold">{t.ok}</span>
                                        <p className="text-xs text-muted-foreground">{t.inventory_healthy}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </div>
                </StockDetailsDialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* CHART SECTION (Now Client Component) */}
                <OverviewChart
                    data={chartData}
                    onDataSelect={handleDateSelect}
                />

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{t.top_selling}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="day" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="day">Día</TabsTrigger>
                                <TabsTrigger value="week">Semana</TabsTrigger>
                                <TabsTrigger value="month">Mes</TabsTrigger>
                            </TabsList>
                            {["day", "week", "month"].map((period) => (
                                <TabsContent key={period} value={period}>
                                    <div className="space-y-4">
                                        {!stats?.topSelling?.[period] || stats.topSelling[period].length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-8">{t.no_sales_yet}</p>
                                        ) : (
                                            stats.topSelling[period].map((product: any, idx: number) => (
                                                <div key={idx} className="flex items-center">
                                                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                                                        {product.image ? (
                                                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs font-bold">{product.name?.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div className="ml-4 space-y-1">
                                                        <p className="text-sm font-medium leading-none">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {product.count} {t.sales_count}
                                                        </p>
                                                    </div>
                                                    <div className="ml-auto font-medium text-sm">
                                                        +{formatCurrency(product.revenue)}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {/* RECENT ORDERS TABLE */}
            <Card>
                <CardHeader>
                    <CardTitle>{t.recent_orders} {safeTargetDateStr ? `(${safeTargetDateStr})` : ''}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[400px] overflow-y-auto relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                <TableRow>
                                    <TableHead>{t.date}</TableHead>
                                    <TableHead>{t.order_id}</TableHead>
                                    <TableHead>{t.customer}</TableHead>
                                    <TableHead>{t.type}</TableHead>
                                    <TableHead>{t.status}</TableHead>
                                    <TableHead className="text-right">{t.amount}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            {t.no_orders_found || "No orders for this date"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order: any) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </TableCell>
                                            <TableCell className="font-medium">#{order.id.slice(0, 7)}</TableCell>
                                            <TableCell>{order.customers?.full_name || t.walk_in}</TableCell>
                                            <TableCell>{order.payment_method}</TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    order.status === "CANCELLED" ? "bg-red-500 hover:bg-red-600" :
                                                        order.status === "PENDING" ? "bg-yellow-500 hover:bg-yellow-600" :
                                                            "bg-emerald-500 hover:bg-emerald-600"
                                                }>
                                                    {order.status === "COMPLETED" ? t.completed :
                                                        order.status === "CANCELLED" ? t.cancelled : t.pending}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(Number(order.total_amount))}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
