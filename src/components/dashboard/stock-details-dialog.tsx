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
import { Button } from "@/components/ui/button"
import { AlertOctagon, AlertTriangle, CheckCircle, Package } from "lucide-react"
import Link from "next/link"
import { useCurrency } from "@/providers/currency-provider"
import { useLanguage } from "@/providers/language-provider"

interface StockDetailsDialogProps {
    children: React.ReactNode
    lowStockProducts: any[]
    healthyProducts: any[]
    totalProductsCount: number
}

export function StockDetailsDialog({ children, lowStockProducts, healthyProducts, totalProductsCount }: StockDetailsDialogProps) {
    const { t } = useLanguage()
    const { formatCurrency } = useCurrency()

    // 1. Filter Logic
    const getSingleStatus = (current: number, initial: number) => {
        if (current === 0) return "critical"
        const max = initial || current || 1
        const pct = (current / max) * 100
        if (pct <= 20) return "critical"
        if (pct <= 50) return "warning"
        return "healthy"
    }

    const getProductStatus = (product: any) => {
        // Evaluate Store Status
        const storeStatus = getSingleStatus(product.stock, product.initial_stock || product.stock)

        // Evaluate Warehouse Status
        const whseStatus = getSingleStatus(product.stock_warehouse || 0, product.initial_stock_warehouse || product.stock_warehouse || 0)

        // Return the "worst" status
        if (storeStatus === "critical" || whseStatus === "critical") return "critical"
        if (storeStatus === "warning" || whseStatus === "warning") return "warning"
        return "healthy"
    }

    const renderStockBadges = (product: any) => {
        return (
            <div className="text-right flex flex-col gap-1">
                {/* Store Stock Badge */}
                {(() => {
                    const initial = product.initial_stock || product.stock || 1
                    const percentage = (product.stock / initial) * 100
                    let className = "text-[10px] h-5 px-1 justify-between w-full "

                    if (product.stock === 0) className += "bg-red-100 text-red-800 border-red-200"
                    else if (percentage <= 20) className += "bg-red-100 text-red-800 border-red-200"
                    else if (percentage <= 50) className += "bg-yellow-100 text-yellow-800 border-yellow-200"
                    else className += "bg-emerald-100 text-emerald-800 border-emerald-200"

                    return (
                        <Badge variant="outline" className={className}>
                            <span className="mr-1">{t.store}:</span>
                            <span className="font-bold">{product.stock}</span>
                            {percentage < 100 && <span className="ml-1 opacity-80 text-[9px]">({Math.round(percentage)}%)</span>}
                        </Badge>
                    )
                })()}

                {/* Warehouse Stock Badge */}
                {(() => {
                    const current = product.stock_warehouse || 0
                    const initial = product.initial_stock_warehouse || current || 1
                    const percentage = (current / initial) * 100
                    let className = "text-[10px] h-5 px-1 "

                    if (current === 0) className += "bg-red-100 text-red-800 border-red-200"
                    else if (percentage <= 20) className += "bg-red-100 text-red-800 border-red-200"
                    else if (percentage <= 50) className += "bg-yellow-100 text-yellow-800 border-yellow-200"
                    else className += "bg-emerald-100 text-emerald-800 border-emerald-200"

                    return (
                        <Badge variant="outline" className={className}>
                            <span className="mr-1">{t.whse}:</span>
                            <span className="font-bold">{current}</span>
                            {percentage < 100 && <span className="ml-1 opacity-80 text-[9px]">({Math.round(percentage)}%)</span>}
                        </Badge>
                    )
                })()}
            </div>
        )
    }

    // Combine all products to re-filter based on strict client side logic
    // This handles the case where server-side logic might be outdated or less strict
    const allProducts = [...lowStockProducts, ...healthyProducts]

    // De-duplicate products just in case (though highly unlikely from server)
    const uniqueProducts = Array.from(new Map(allProducts.map(item => [item.id, item])).values())

    const finalCritical = uniqueProducts.filter(p => getProductStatus(p) === "critical")
    const finalWarning = uniqueProducts.filter(p => getProductStatus(p) === "warning")
    const finalHealthy = uniqueProducts.filter(p => getProductStatus(p) === "healthy")

    // Determine default tab (Prioritize worst status)
    const defaultTab = finalCritical.length > 0 ? "critical" : (finalWarning.length > 0 ? "warning" : "healthy")

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
                            {t.critical} ({finalCritical.length})
                        </TabsTrigger>
                        <TabsTrigger value="warning" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            {t.warning} ({finalWarning.length})
                        </TabsTrigger>
                        <TabsTrigger value="healthy" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t.healthy} ({finalHealthy.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* CRITICAL TAB */}
                    <TabsContent value="critical">
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                            {finalCritical.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <CheckCircle className="h-10 w-10 mb-2 text-emerald-500" />
                                    <p>{t.no_critical_items}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {finalCritical.map((product: any) => (
                                        <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatCurrency(product.price || product.selling_price)}</p>
                                                </div>
                                            </div>
                                            {renderStockBadges(product)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    {/* WARNING TAB */}
                    <TabsContent value="warning">
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                            {finalWarning.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <CheckCircle className="h-10 w-10 mb-2 text-emerald-500" />
                                    <p>{t.no_warning_items}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {finalWarning.map((product: any) => (
                                        <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatCurrency(product.price || product.selling_price)}</p>
                                                </div>
                                            </div>
                                            {renderStockBadges(product)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    {/* HEALTHY TAB */}
                    <TabsContent value="healthy">
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                            {finalHealthy.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <AlertTriangle className="h-10 w-10 mb-2 text-yellow-500" />
                                    <p>{t.no_healthy_items}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {finalHealthy.map((product: any) => (
                                        <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatCurrency(product.price || product.selling_price)}</p>
                                                </div>
                                            </div>
                                            {renderStockBadges(product)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
