"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, History, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { updateStock, moveStockToStore } from "@/app/actions/inventory"
import { PackagePlus } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useLanguage } from "@/providers/language-provider"

function RestockButton({ product }: { product: any }) {
    const { t } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleRestock(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const quantity = parseInt(formData.get("quantity") as string)

        const result = await moveStockToStore(product.id, quantity)
        setIsLoading(false)

        if (result.error) {
            alert(result.error)
        } else {
            setIsOpen(false)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                    <PackagePlus className="mr-2 h-4 w-4" />
                    {t.restock}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">{t.restock_from_warehouse}</h4>
                        <p className="text-sm text-muted-foreground">
                            {t.move_items_warehouse_store} (Warehouse: {product.stock_warehouse || 0})
                        </p>
                    </div>
                    <form onSubmit={handleRestock} className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="quantity">{t.qty}</Label>
                            <Input
                                id="quantity"
                                name="quantity"
                                type="number"
                                className="col-span-2 h-8"
                                max={product.stock_warehouse || 0}
                                min={1}
                                required
                            />
                        </div>
                        <Button type="submit" size="sm" disabled={isLoading || (product.stock_warehouse || 0) <= 0}>
                            {t.move_to_store}
                        </Button>
                    </form>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function StockClient({ initialProducts }: { initialProducts: any[] }) {
    const { t } = useLanguage()
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [isAdjustOpen, setIsAdjustOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const filteredProducts = initialProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    async function handleAdjustSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget)
        formData.append("productId", selectedProduct.id)

        // Logic inside action handles the sign based on type

        const result = await updateStock(formData)

        setIsLoading(false)
        if (result.error) {
            alert("Error: " + result.error)
        } else {
            setIsAdjustOpen(false)
            setSelectedProduct(null)
        }
    }

    const openAdjust = (product: any) => {
        setSelectedProduct(product)
        setIsAdjustOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">{t.inventory_management}</h1>
            </div>
            {/* Helper Dialog for Adjustments */}
            <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.adjust_stock_title}: {selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdjustSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="target">{t.target_limit}</Label>
                            <Select name="target" defaultValue="store">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="store">{t.store_sales_floor}</SelectItem>
                                    <SelectItem value="warehouse">{t.warehouse_reserve}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">{t.movement_type}</Label>
                            <Select name="type" defaultValue="IN">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IN">
                                        <div className="flex items-center text-emerald-600">
                                            <ArrowUp className="mr-2 h-4 w-4" /> {t.stock_in}
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="OUT">
                                        <div className="flex items-center text-red-600">
                                            <ArrowDown className="mr-2 h-4 w-4" /> {t.stock_out}
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quantity">{t.quantity}</Label>
                            <Input id="quantity" name="quantity" type="number" min="1" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="reason">{t.reason}</Label>
                            <Input id="reason" name="reason" placeholder="e.g. Broken item, New shipment" />
                        </div>

                        <Button type="submit" className="mt-4 bg-emerald-600" disabled={isLoading}>
                            {t.confirm_adjustment}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={t.search_inventory}
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.product_name}</TableHead>
                                <TableHead className="text-center">{t.store_stock}</TableHead>
                                <TableHead className="text-center">{t.warehouse_stock}</TableHead>
                                <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.name}</TableCell>

                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-lg">{p.stock}</span>
                                            <Badge variant={p.stock > 10 ? "secondary" : p.stock > 0 ? "outline" : "destructive"} className="text-[10px] h-5 px-1">
                                                {p.stock > 10 ? t.good : p.stock > 0 ? t.low : t.empty}
                                            </Badge>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="font-bold text-lg text-muted-foreground">{p.stock_warehouse || 0}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <RestockButton product={p} />
                                            <Button variant="outline" size="sm" onClick={() => openAdjust(p)}>
                                                <History className="mr-2 h-4 w-4" />
                                                {t.adjust}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        {t.no_products_found}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
