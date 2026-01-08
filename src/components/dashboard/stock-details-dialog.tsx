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

// Helper interface for our flattened list
interface StockEntry {
    id: string // composite id: productId-type
    product: any
    type: 'store' | 'warehouse'
    status: 'critical' | 'warning' | 'healthy'
    currentStock: number
    initialStock: number
}

export function StockDetailsDialog({ children, lowStockProducts, healthyProducts, totalProductsCount }: StockDetailsDialogProps) {
    const { t } = useLanguage()
    const { formatCurrency } = useCurrency()

    // 1. Filter Logic Helpers
    const getSingleStatus = (current: number, initial: number) => {
        if (current === 0) return "critical"
        const max = initial || current || 1
        const pct = (current / max) * 100
        if (pct <= 20) return "critical"
        if (pct <= 50) return "warning"
        return "healthy"
    }

    // Combine all products to process them uniformly
    const allProducts = [...lowStockProducts, ...healthyProducts]
    const uniqueProducts = Array.from(new Map(allProducts.map(item => [item.id, item])).values())

    // Flatten into StockEntries
    const allEntries: StockEntry[] = []

    uniqueProducts.forEach(product => {
        // Store Entry
        const storeInitial = product.initial_stock || product.stock || 0
        const storeStatus = getSingleStatus(product.stock, storeInitial)
        allEntries.push({
            id: `${product.id}-store`,
            product: product,
            type: 'store',
            status: storeStatus,
            currentStock: product.stock,
            initialStock: storeInitial
        })

        // Warehouse Entry
        // Ensure we handle current/initial correctly for warehouse (defaults to 0 if missing)
        const whseStock = product.stock_warehouse || 0
        const whseInitial = product.initial_stock_warehouse || whseStock || 0
        const whseStatus = getSingleStatus(whseStock, whseInitial)
        allEntries.push({
            id: `${product.id}-warehouse`,
            product: product,
            type: 'warehouse',
            status: whseStatus,
            currentStock: whseStock,
            initialStock: whseInitial
        })
    })

    // Filter by status for tabs
    const criticalEntries = allEntries.filter(e => e.status === "critical")
    const warningEntries = allEntries.filter(e => e.status === "warning")
    const healthyEntries = allEntries.filter(e => e.status === "healthy")

    // Determine default tab (Prioritize worst status)
    const defaultTab = criticalEntries.length > 0 ? "critical" : (warningEntries.length > 0 ? "warning" : "healthy")

    // Helper to render a specific entry's badge
    const renderEntryBadge = (entry: StockEntry) => {
        const { currentStock, initialStock, type } = entry
        const percentage = (currentStock / (initialStock || 1)) * 100 // avoid div by zero

        // Define styles
        let className = "text-[10px] h-5 px-1 "
        if (entry.status === 'critical') className += "bg-red-100 text-red-800 border-red-200"
        else if (entry.status === 'warning') className += "bg-yellow-100 text-yellow-800 border-yellow-200"
        else className += "bg-emerald-100 text-emerald-800 border-emerald-200"

        return (
            <Badge variant="outline" className={className}>
                {/* Icon based on type for extra clarity */}
                {type === 'store' ? <Store className="w-3 h-3 mr-1" /> : <Warehouse className="w-3 h-3 mr-1" />}
                <span className="mr-1">{type === 'store' ? t.store : t.whse}:</span>
                <span className="font-bold">{currentStock}</span>
                {percentage < 100 && <span className="ml-1 opacity-80 text-[9px]">({Math.round(percentage)}%)</span>}
            </Badge>
        )
    }

    // Helper to render the list
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
                        <div className="text-right">
                            {renderEntryBadge(entry)}
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
