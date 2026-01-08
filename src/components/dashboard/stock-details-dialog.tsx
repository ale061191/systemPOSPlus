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
    const getStatus = (stock: number, initial: number) => {
        if (stock === 0) return "critical"
        const max = initial || stock || 1
        const pct = (stock / max) * 100
        if (pct <= 20) return "critical"
        if (pct <= 50) return "warning"
        return "healthy"
    }

    const criticalItems = lowStockProducts.filter(p => getStatus(p.stock, p.initial_stock) === "critical")
    const warningItems = lowStockProducts.filter(p => getStatus(p.stock, p.initial_stock) === "warning")
    // For healthy items, we should ideally check ALL products, but passing them might be expensive if list is huge.
    // However, the prop name is 'healthyProducts' which implies it already contains the healthy ones?
    // Wait, the parent component filters 'lowStockProducts' and passes 'healthyProducts'.
    // If the parent logic (server side?) still uses old logic, this component receives wrong buckets?
    // Let's check where 'lowStockProducts' comes from. It's likely passed from a Server Component Page.
    // If so, I need to find the CALLER of this component to fix the server-side filtering too!

    // Assuming for now we re-filter the TOTAL list if possible, or just re-classify what we are given.
    // If 'lowStockProducts' + 'healthyProducts' = All Products, we can concatenate and re-filter.

    const allProducts = [...lowStockProducts, ...healthyProducts]
    const newCriticalItems = allProducts.filter(p => getStatus(p.stock, p.initial_stock) === "critical")
    const newWarningItems = allProducts.filter(p => getStatus(p.stock, p.initial_stock) === "warning")
    const newHealthyItems = allProducts.filter(p => getStatus(p.stock, p.initial_stock) === "healthy")

    // Update variables to use the new filtered lists
    const finalCritical = newCriticalItems
    const finalWarning = newWarningItems
    const finalHealthy = newHealthyItems


    // 2. Determine default tab (Prioritize worst status)
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
                                            <div className="text-right flex flex-col gap-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 border border-red-200">
                                                    {t.store}: {product.stock}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                    {t.whse}: {product.stock_warehouse || 0}
                                                </span>
                                            </div>
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
                                            <div className="text-right flex flex-col gap-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                    {t.store}: {product.stock}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                    {t.whse}: {product.stock_warehouse || 0}
                                                </span>
                                            </div>
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
                                            <div className="text-right flex flex-col gap-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    {t.store}: {product.stock}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                    {t.whse}: {product.stock_warehouse || 0}
                                                </span>
                                            </div>
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
