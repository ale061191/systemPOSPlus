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
import { updateStock } from "@/app/actions/inventory"

export function StockClient({ initialProducts }: { initialProducts: any[] }) {
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
            {/* Helper Dialog for Adjustments */}
            <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Stock: {selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdjustSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Movement Type</Label>
                            <Select name="type" defaultValue="IN">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IN">
                                        <div className="flex items-center text-emerald-600">
                                            <ArrowUp className="mr-2 h-4 w-4" /> Stock IN (Purchase/Return)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="OUT">
                                        <div className="flex items-center text-red-600">
                                            <ArrowDown className="mr-2 h-4 w-4" /> Stock OUT (Damage/Loss)
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input id="quantity" name="quantity" type="number" min="1" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="reason">Reason / Notes</Label>
                            <Input id="reason" name="reason" placeholder="e.g. Broken item, New shipment" />
                        </div>

                        <Button type="submit" className="mt-4 bg-emerald-600" disabled={isLoading}>
                            Confirm Adjustment
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
                            placeholder="Search inventory..."
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
                                <TableHead>Product</TableHead>

                                <TableHead>Current Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.name}</TableCell>

                                    <TableCell className="font-bold text-lg">{p.stock}</TableCell>
                                    <TableCell>
                                        <Badge variant={p.stock > 10 ? "secondary" : p.stock > 0 ? "outline" : "destructive"}>
                                            {p.stock > 10 ? "In Stock" : p.stock > 0 ? "Low Stock" : "Out of Stock"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openAdjust(p)}>
                                            <History className="mr-2 h-4 w-4" />
                                            Adjust
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No products found matching your search.
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
