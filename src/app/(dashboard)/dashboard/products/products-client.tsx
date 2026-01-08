"use client"

import { useState, useEffect } from "react"
import { Plus, MoreHorizontal, Pencil, Trash, FileImage } from "lucide-react"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createProduct, deleteProduct, updateProduct } from "@/app/actions/inventory"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/providers/language-provider"
import { useCurrency } from "@/providers/currency-provider"

export function ProductsClient({ initialProducts, categories }: { initialProducts: any[], categories: any[] }) {
    const { t } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // New state for currency conversion
    const [exchangeRate, setExchangeRate] = useState<number>(0)
    const [price, setPrice] = useState<number>(0)

    const { formatCurrency } = useCurrency()

    // Fetch exchange rate on mount
    useEffect(() => {
        fetch("/api/bcv-rates")
            .then(res => res.json())
            .then(data => {
                // The API returns an object like { dollar: 45.50, date: "..." }
                if (data && data.dollar) {
                    setExchangeRate(data.dollar)
                }
            })
            .catch(err => console.error("Failed to fetch exchange rate:", err))
    }, [])

    function handleEdit(product: any) {
        setEditingProduct(product)
        setPrice(product.price) // Initialize price state for editing
        setIsOpen(true)
    }

    function openNew() {
        setEditingProduct(null)
        setPrice(0)
        setIsOpen(true)
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget)
        const imageFile = formData.get("image") as File

        // Client-Side Upload Logic
        if (imageFile && imageFile.size > 0) {
            try {
                const supabase = createClient()
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                const { data, error } = await supabase.storage
                    .from('products')
                    .upload(fileName, imageFile)

                if (error) throw error

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName)

                // Add URL to formData and REMOVE the huge file to avoid 413 Error
                formData.set("image_url", publicUrl)
                formData.delete("image") // Critical: Don't send the file to server action

            } catch (error: any) {
                console.error("Client Upload Error:", error)
                alert("Image upload failed: " + error.message)
                setIsLoading(false)
                return
            }
        }

        const result = editingProduct
            ? await updateProduct(formData)
            : await createProduct(formData)

        setIsLoading(false)
        if (result.error) {
            alert("Error: " + result.error)
        } else {
            setIsOpen(false)
        }
    }

    async function confirmDelete() {
        if (!deleteId) return

        const result = await deleteProduct(deleteId)
        if (result.error) {
            alert("Error deleting product: " + result.error)
        }
        setDeleteId(null)
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">{t.product_catalog}</h1>
            </div>
            <div className="flex justify-end">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openNew}>
                            <Plus className="mr-2 h-4 w-4" /> {t.add_product}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? t.edit_product : t.add_product}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4" key={editingProduct?.id || 'new'}>
                            <input type="hidden" name="id" value={editingProduct?.id || ""} />
                            <input type="hidden" name="current_image_url" value={editingProduct?.image_url || ""} />
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t.name}</Label>
                                <Input id="name" name="name" placeholder="Classic Burger" required defaultValue={editingProduct?.name} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="stock">{t.store_stock}</Label>
                                    <Input id="stock" name="stock" type="number" placeholder="20" defaultValue={editingProduct?.stock} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="stock_warehouse">{t.warehouse_stock}</Label>
                                    <Input id="stock_warehouse" name="stock_warehouse" type="number" placeholder="80" defaultValue={editingProduct?.stock_warehouse} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price">{t.price} ($)</Label>
                                <Input id="price" name="price" type="number" step="0.01" placeholder="10.00" required defaultValue={editingProduct?.price} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">{t.category}</Label>
                                <Select name="category_id" defaultValue={editingProduct?.category_id || "none"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                                                    {c.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="image">{t.image}</Label>
                                <Input id="image" name="image" type="file" accept="image/*" className="cursor-pointer" />
                            </div>

                            <Button type="submit" className="mt-4 bg-emerald-600" disabled={isLoading}>
                                {t.save}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t.are_you_sure}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t.delete_confirmation}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                {t.delete}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.products}</TableHead>
                                <TableHead>{t.category}</TableHead>
                                <TableHead>{t.price}</TableHead>

                                <TableHead className="text-center">{t.store}</TableHead>
                                <TableHead className="text-center">{t.whse}</TableHead>
                                <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialProducts.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                                            {p.image_url ? (
                                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <FileImage className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        {p.name}
                                    </TableCell>
                                    <TableCell>
                                        {p.categories ? (
                                            <Badge variant="outline" style={{ borderColor: p.categories.color, color: p.categories.color }}>
                                                {p.categories.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{formatCurrency(p.price)}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-lg">{p.stock}</span>
                                            {(() => {
                                                const initial = p.initial_stock || p.stock || 1
                                                const percentage = (p.stock / initial) * 100
                                                let label = t.good

                                                if (p.stock === 0) label = t.empty
                                                else if (percentage <= 20) label = t.critical
                                                else if (percentage <= 50) label = t.low

                                                let className = "text-[10px] h-5 px-1 "
                                                if (percentage > 50) className += "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                else if (percentage > 20) className += "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                else className += "bg-red-100 text-red-800 border-red-200"

                                                return (
                                                    <Badge variant="outline" className={className}>
                                                        {label} {percentage < 100 && `(${Math.round(percentage)}%)`}
                                                    </Badge>
                                                )
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="font-bold text-lg">{p.stock_warehouse || 0}</span>
                                            {(() => {
                                                const current = p.stock_warehouse || 0
                                                const initial = p.initial_stock_warehouse || current || 1
                                                const percentage = (current / initial) * 100
                                                let label = t.good

                                                if (current === 0) label = t.empty
                                                else if (percentage <= 20) label = t.critical
                                                else if (percentage <= 50) label = t.low

                                                let className = "text-[10px] h-5 px-1 "
                                                if (percentage > 50) className += "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                else if (percentage > 20) className += "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                else className += "bg-red-100 text-red-800 border-red-200"

                                                return (
                                                    <Badge variant="outline" className={className}>
                                                        {label} {percentage < 100 && `(${Math.round(percentage)}%)`}
                                                    </Badge>
                                                )
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => handleEdit(p)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => setDeleteId(p.id)} className="text-red-600">
                                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {initialProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No products found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
