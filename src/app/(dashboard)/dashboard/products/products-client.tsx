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
import { useCurrency } from "@/providers/currency-provider"

export function ProductsClient({ initialProducts, categories }: { initialProducts: any[], categories: any[] }) {
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
            <div className="flex justify-end">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openNew}>
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? "Edit Product" : "New Product"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4" key={editingProduct?.id || 'new'}>
                            <input type="hidden" name="id" value={editingProduct?.id || ""} />
                            <input type="hidden" name="current_image_url" value={editingProduct?.image_url || ""} />
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" placeholder="Classic Burger" required defaultValue={editingProduct?.name} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price ($)</Label>
                                    <Input id="price" name="price" type="number" step="0.01" placeholder="10.00" required defaultValue={editingProduct?.price} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="stock">Stock</Label>
                                    <Input id="stock" name="stock" type="number" placeholder="100" defaultValue={editingProduct?.stock} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
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
                                <Label htmlFor="image">Product Image</Label>
                                <Input id="image" name="image" type="file" accept="image/*" className="cursor-pointer" />
                            </div>

                            <Button type="submit" className="mt-4 bg-emerald-600" disabled={isLoading}>
                                Save Product
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the product.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                Delete
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
                                <TableHead>Product</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                    <TableCell>
                                        <Badge variant={p.stock > 10 ? "secondary" : "destructive"}>
                                            {p.stock}
                                        </Badge>
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
                                    <TableCell colSpan={5} className="h-24 text-center">
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
