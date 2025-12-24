"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
    Download,
    TrendingUp,
    Users,
    CreditCard,
    Loader2,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts"
import { getSalesReport, ReportRange } from "@/app/actions/reports"
import * as XLSX from "xlsx"

import { useLanguage } from "@/providers/language-provider"
import { useCurrency } from "@/providers/currency-provider"

export function ReportsClient() {
    const { t } = useLanguage()
    const { formatCurrency } = useCurrency()
    const [range, setRange] = useState<ReportRange>("today")
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [chartData, setChartData] = useState<any[]>([])
    const [cashierData, setCashierData] = useState<any[]>([])

    useEffect(() => {
        fetchReport()
    }, [range])
    // Re-process data on client to align with User's Timezone
    useEffect(() => {
        if (!data?.rawOrders) return

        const processedChart = new Map<string, number>()
        const processedCashier = new Map<string, number>()
        const now = new Date()

        data.rawOrders.forEach((order: any) => {
            const date = new Date(order.created_at)

            // Filter Logic based on Local Time
            // The server sends a bit of extra buffer due to UTC differences
            let include = false
            if (range === 'today') {
                include = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
            } else if (range === 'week') {
                // Approximate check
                include = true
            } else {
                include = true
            }

            if (include && order.status === 'COMPLETED') {
                // Chart Aggregation
                let label = ""
                if (range === "today") {
                    label = format(date, "HH:00")
                } else if (range === "week") {
                    label = format(date, "EEE")
                } else {
                    label = format(date, "dd MMM")
                }

                processedChart.set(label, (processedChart.get(label) || 0) + order.total_amount)

                // Cashier Aggregation
                const cashier = order.profiles?.full_name || "Unknown"
                processedCashier.set(cashier, (processedCashier.get(cashier) || 0) + order.total_amount)
            }
        })

        // Convert Map to Array
        const trend = Array.from(processedChart.entries())
            .map(([name, sales]) => ({ name, sales }))
            // Sort by time if today
            .sort((a, b) => {
                if (range === 'today') return parseInt(a.name) - parseInt(b.name)
                return 0 // Keep order for others or improve sort logic
            })

        // Cashier Array
        const cashiers = Array.from(processedCashier.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)

        setChartData(trend)
        setCashierData(cashiers)

    }, [data, range])


    async function fetchReport() {
        setLoading(true)
        setError(null)
        try {
            const result = await getSalesReport(range)
            if (result.error) {
                console.error("Report Fetch Error:", result.error)
                setError(result.error)
                setData(null)
            } else {
                setData(result)
            }
        } catch (e) {
            console.error("Unexpected error:", e)
            setError("An unexpected error occurred while loading the report.")
        }
        setLoading(false)
    }

    function downloadExcel() {
        if (!data?.rawOrders) return

        // Map data to clean object structure for Excel
        const excelData = data.rawOrders.map((o: any) => ({
            "ID Orden": o.id,
            "Fecha": format(new Date(o.created_at), "yyyy-MM-dd"),
            "Hora": format(new Date(o.created_at), "HH:mm:ss"),
            "Cajero": o.profiles?.full_name || "Desconocido",
            "Método Pago": o.payment_method,
            "Estado": o.status === "COMPLETED" ? "Completo" : "Cancelado",
            "Total": Number(o.total_amount.toFixed(2)) // Ensure it's a number for Excel math
        }))

        // Create Worksheet
        const ws = XLSX.utils.json_to_sheet(excelData)

        // Create Workbook
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Ventas")

        // Generate Filename
        const fileName = `Reporte_Ventas_${range}_${format(new Date(), "yyyy-MM-dd")}.xlsx`

        // Save File
        XLSX.writeFile(wb, fileName)
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t.sales_analytics}</h1>
                    <p className="text-muted-foreground">{t.dashboard}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadExcel} disabled={!data || loading}>
                        <Download className="mr-2 h-4 w-4" />
                        {t.export_excel}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <div className="flex-1">
                        <p className="font-bold">{t.error}</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={fetchReport} className="text-red-700 hover:bg-red-100 hover:text-red-900">
                        {t.try_again}
                    </Button>
                </div>
            )}

            <Tabs defaultValue="today" value={range} onValueChange={(v: string) => setRange(v as ReportRange)} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="today">{t.today}</TabsTrigger>
                    <TabsTrigger value="week">{t.week}</TabsTrigger>
                    <TabsTrigger value="month">{t.month}</TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                ) : data ? (
                    <div className="space-y-4">
                        {/* KPI Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t.total_sales}</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-600">
                                        {formatCurrency(data.metrics.totalSales)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {range === 'today' ? t.today : range === 'week' ? t.week : t.month}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t.total_orders}</CardTitle>
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {data.metrics.orderCount}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Completed transactions
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t.avg_ticket}</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(data.metrics.averageTicket)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Revenue per order
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Sales Trend</CardTitle>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value)}`} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="sales" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Cashier Performance</CardTitle>
                                    <CardDescription>
                                        Revenue by staff member
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={data.charts.salesByCashier} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detailed Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t.recent_orders} (Detailed)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-[400px] overflow-y-auto relative">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                            <TableRow>
                                                <TableHead>{t.order_id}</TableHead>
                                                <TableHead>Time</TableHead>
                                                <TableHead>Cashier</TableHead>
                                                <TableHead>Payment</TableHead>
                                                <TableHead>{t.status}</TableHead>
                                                <TableHead className="text-right">{t.amount}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.rawOrders.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center h-24">No orders found.</TableCell>
                                                </TableRow>
                                            ) : (
                                                data.rawOrders.map((order: any) => (
                                                    <TableRow key={order.id}>
                                                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                                                        <TableCell>{format(new Date(order.created_at), "HH:mm")}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                                                                    {order.profiles?.full_name?.charAt(0) || "U"}
                                                                </div>
                                                                <span className="text-sm">{order.profiles?.full_name || "Unknown"}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{order.payment_method}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={
                                                                order.status === "COMPLETED" ? "bg-emerald-500 hover:bg-emerald-600" :
                                                                    "bg-red-500 hover:bg-red-600"
                                                            }>
                                                                {order.status === "COMPLETED" ? t.completed : t.cancelled}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-emerald-600">
                                                            {formatCurrency(order.total_amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground w-full bg-slate-50 border rounded-lg">
                        <p>No data available for this period.</p>
                        <Button variant="link" onClick={() => setRange("today")}>Reset to Today</Button>
                    </div>
                )}
            </Tabs>
        </div>
    )
}
