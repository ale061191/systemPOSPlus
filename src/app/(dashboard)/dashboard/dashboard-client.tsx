"use client"

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

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">{t.dashboard}</h1>
            </div>

            {/* STATS CARDS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Sales */}
                <Card className="cursor-pointer hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.total_sales}</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                        <p className="text-xs text-muted-foreground">+20.1% {t.from_last_month}</p>
                    </CardContent>
                </Card>

                {/* Total Orders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.total_orders}</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                            <ShoppingCart className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">+180.1% {t.from_last_month}</p>
                    </CardContent>
                </Card>

                {/* Sales Return (Dynamically Linked) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.sales_return}</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <RefreshCcw className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.cancelledCount || 0}</div>
                        <p className="text-xs text-muted-foreground">{t.sales_return}</p>
                    </CardContent>
                </Card>

                {/* Low Stock Alerts (Replaces Reservations) */}
                {/* Low Stock Alerts (Traffic Light System) */}
                <StockDetailsDialog
                    lowStockProducts={stats?.lowStockProducts || []}
                    healthyProducts={stats?.healthyProducts || []}
                    totalProductsCount={stats?.totalProductsCount || 0}
                >
                    <Card className={`cursor-pointer hover:shadow-md transition-all ${(stats?.lowStockProducts?.filter((p: any) => p.stock <= 20).length || 0) > 0
                        ? "border-red-500/50 bg-red-50/10"
                        : (stats?.lowStockProducts?.length || 0) > 0
                            ? "border-orange-500/50 bg-orange-50/10"
                            : "border-emerald-500/50 bg-emerald-50/10"
                        }`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t.low_stock}</CardTitle>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${(stats?.lowStockProducts?.filter((p: any) => p.stock <= 20).length || 0) > 0
                                ? "bg-red-100 text-red-600"
                                : (stats?.lowStockProducts?.length || 0) > 0
                                    ? "bg-orange-100 text-orange-600"
                                    : "bg-emerald-100 text-emerald-600"
                                }`}>
                                {
                                    (stats?.lowStockProducts?.filter((p: any) => p.stock <= 20).length || 0) > 0
                                        ? <AlertOctagon className="h-4 w-4" />
                                        : (stats?.lowStockProducts?.length || 0) > 0
                                            ? <AlertTriangle className="h-4 w-4" />
                                            : <CheckCircle className="h-4 w-4" />
                                }
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {(stats?.lowStockProducts?.length || 0) > 0 ? (
                                    <>
                                        {stats.lowStockProducts.slice(0, 3).map((product: any) => (
                                            <div key={product.id} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${product.stock <= 20 ? "bg-red-500" : "bg-orange-500"}`} />
                                                    <span className="font-medium truncate max-w-[120px]" title={product.name}>
                                                        {product.name}
                                                    </span>
                                                </div>
                                                <span className={`font-bold ${product.stock <= 20 ? "text-red-600" : "text-orange-600"}`}>
                                                    {product.stock}
                                                </span>
                                            </div>
                                        ))}
                                        {stats.lowStockProducts.length > 3 && (
                                            <p className="text-xs text-center text-muted-foreground pt-1">
                                                + {stats.lowStockProducts.length - 3} {t.more_items}
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
                    </Card>
                </StockDetailsDialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* CHART SECTION (Now Client Component) */}
                <OverviewChart data={chartData} />

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{t.top_selling}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.topSelling?.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">{t.no_sales_yet}</p>
                            ) : (
                                stats?.topSelling?.map((product: any, idx: number) => (
                                    <div key={idx} className="flex items-center">
                                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold">{product.name.charAt(0)}</span>
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
                    </CardContent>
                </Card>
            </div>

            {/* RECENT ORDERS TABLE */}
            <Card>
                <CardHeader>
                    <CardTitle>{t.recent_orders}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[400px] overflow-y-auto relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                <TableRow>
                                    <TableHead>{t.order_id}</TableHead>
                                    <TableHead>{t.customer}</TableHead>
                                    <TableHead>{t.type}</TableHead>
                                    <TableHead>{t.status}</TableHead>
                                    <TableHead className="text-right">{t.amount}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">{t.recent_orders} {t.error}</TableCell>
                                    </TableRow>
                                ) : (
                                    recentOrders.map((order: any) => (
                                        <TableRow key={order.id}>
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
