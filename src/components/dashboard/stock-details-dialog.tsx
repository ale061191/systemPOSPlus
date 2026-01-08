"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertOctagon, AlertTriangle, CheckCircle, Package, Store, Warehouse } from "lucide-react"
import { useCurrency } from "@/providers/currency-provider"
import { useLanguage } from "@/providers/language-provider"

interface StockDetailsDialogProps {
    children: React.ReactNode
    lowStockProducts: any[]
    healthyProducts: any[]
    totalProductsCount: number
}

// Entry type for our list
interface StockEntry {
    id: string
    product: any
    type: 'combined' | 'store' | 'warehouse'
    status: 'critical' | 'warning' | 'healthy'
}

export function StockDetailsDialog({ children, lowStockProducts, healthyProducts, totalProductsCount }: StockDetailsDialogProps) {
    const { t } = useLanguage()
    const { formatCurrency } = useCurrency()

    // 1. Status Helper
    const getSingleStatus = (current: number, initial: number) => {
        if (current === 0) return "critical"
        const max = initial || current || 1
        const pct = (current / max) * 100
        if (pct <= 20) return "critical"
        if (pct <= 50) return "warning"
        return "healthy"
    }

    // 2. Badge Renderers
    const renderStoreBadge = (product: any) => {
        const initial = product.initial_stock || product.stock || 0
        const current = product.stock
        const status = getSingleStatus(current, initial)
        const pct = (current / (initial || 1)) * 100

        let className = "text-[10px] h-5 px-1 justify-between w-full "
        if (status === 'critical') className += "bg-red-100 text-red-800 border-red-200"
        else if (status === 'warning') className += "bg-yellow-100 text-yellow-800 border-yellow-200"
        else className += "bg-emerald-100 text-emerald-800 border-emerald-200"

        return (
            <Badge variant="outline" className={className}>
                <span className="mr-1">{t.store}:</span>
                <span className="font-bold">{current}</span>
                {pct < 100 && <span className="ml-1 opacity-80 text-[9px]">({Math.round(pct)}%)</span>}
            </Badge>
        )
    }

    const renderWarehouseBadge = (product: any) => {
        const current = product.stock_warehouse || 0
        const initial = product.initial_stock_warehouse || current || 0
        const status = getSingleStatus(current, initial)
        const pct = (current / (initial || 1)) * 100

        let className = "text-[10px] h-5 px-1 "
        if (status === 'critical') className += "bg-red-100 text-red-800 border-red-200"
        else if (status === 'warning') className += "bg-yellow-100 text-yellow-800 border-yellow-200"
        else className += "bg-emerald-100 text-emerald-800 border-emerald-200"

        return (
            <Badge variant="outline" className={className}>
                <span className="mr-1">{t.whse}:</span>
                <span className="font-bold">{current}</span>
                {pct < 100 && <span className="ml-1 opacity-80 text-[9px]">({Math.round(pct)}%)</span>}
            </Badge>
        )
    }

    // 3. Process Data
    const allProducts = [...lowStockProducts, ...healthyProducts]
    const uniqueProducts = Array.from(new Map(allProducts.map(item => [item.id, item])).values())

    const allEntries: StockEntry[] = []

    uniqueProducts.forEach(product => {
        const storeInitial = product.initial_stock || product.stock || 0
        const storeStatus = getSingleStatus(product.stock, storeInitial)

        const whseStock = product.stock_warehouse || 0
        const whseInitial = product.initial_stock_warehouse || whseStock || 0
        const whseStatus = getSingleStatus(whseStock, whseInitial)

        if (storeStatus === whseStatus) {
            // MATCH: Single combined entry
            allEntries.push({
                id: `${product.id}-combined`,
                product: product,
                type: 'combined',
                status: storeStatus // both are the same
            })
        } else {
            // MISMATCH: Separate entries
            allEntries.push({
                id: `${product.id}-store`,
                product: product,
                type: 'store',
                status: storeStatus
            })
            allEntries.push({
                id: `${product.id}-warehouse`,
                product: product,
                type: 'warehouse',
                status: whseStatus
            })
        }
    })

    // 4. Tab Collections
    const criticalEntries = allEntries.filter(e => e.status === "critical")
    const warningEntries = allEntries.filter(e => e.status === "warning")
    const healthyEntries = allEntries.filter(e => e.status === "healthy")

    // 5. Default Tab
    const defaultTab = criticalEntries.length > 0 ? "critical" : (warningEntries.length > 0 ? "warning" : "healthy")

    // 6. List Renderer
    const renderEntryList = (entries: StockEntry[], emptyMessage: string, emptyIconColor: string) => {
        if (entries.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <CheckCircle className={`h-10 w-10 mb-2 ${emptyIconColor}`} />
                    <p>{emptyMessage}</p>
                </div>
            )
        }

        return (
            <div className="space-y-4">
                {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                                {entry.product.image_url ? (
                                    <img src={entry.product.image_url} alt={entry.product.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-sm">{entry.product.name}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(entry.product.price || entry.product.selling_price)}</p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col gap-1 min-w-[100px]">
                            {entry.type === 'combined' && (
                                <>
                                    {renderStoreBadge(entry.product)}
                                    {renderWarehouseBadge(entry.product)}
                                </>
                            )}
                            {entry.type === 'store' && renderStoreBadge(entry.product)}
                            {entry.type === 'warehouse' && renderWarehouseBadge(entry.product)}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{t.stock_status_details}</DialogTitle>
                    <DialogDescription>
                        {t.inventory_health_overview}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="critical" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                            <AlertOctagon className="mr-2 h-4 w-4" />
                            {t.critical} ({criticalEntries.length})
                        </TabsTrigger>
                        <TabsTrigger value="warning" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            {t.warning} ({warningEntries.length})
                        </TabsTrigger>
                        <TabsTrigger value="healthy" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t.healthy} ({healthyEntries.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="critical">
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                            {renderEntryList(criticalEntries, t.no_critical_items, "text-emerald-500")}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="warning">
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                            {renderEntryList(warningEntries, t.no_warning_items, "text-emerald-500")}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="healthy">
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                            {renderEntryList(healthyEntries, t.no_healthy_items, "text-yellow-500")}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
