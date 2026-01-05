"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, ShoppingCart, Plus, Minus, CreditCard, Banknote, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { createOrder } from "@/app/actions/pos"
import { getCustomerByCedula } from "@/app/actions/customers"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useOffline } from "@/providers/offline-context"
import { useCart } from "@/providers/cart-context"
import { CheckoutSuccess } from "@/components/pos/checkout-success"
import { useCurrency } from "@/providers/currency-provider"
import { useLanguage } from "@/providers/language-provider"

export function POSInterface({ initialProducts, categories }: { initialProducts: any[], categories: any[] }) {
    const { t } = useLanguage()
    const { toast } = useToast()
    const { cart, addToCart, updateQuantity, clearCart, cartTotal } = useCart()
    const { formatCurrency } = useCurrency()

    const [searchTerm, setSearchTerm] = useState("")
    const [activeCategory, setActiveCategory] = useState<string>("all")
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState("CASH")

    // Customer State
    const [cedula, setCedula] = useState("")
    const [customer, setCustomer] = useState<any>(null)
    const [isSearching, setIsSearching] = useState(false)

    async function handleSearchCustomer(term: string) {
        setCedula(term)
        if (term.length < 5) {
            setCustomer(null)
            return
        }

        setIsSearching(true)
        const { customer, error } = await getCustomerByCedula(term)
        setIsSearching(false)

        if (customer) {
            setCustomer(customer)
        } else {
            setCustomer(null)
        }
    }

    // Filter Products
    const filteredProducts = useMemo(() => {
        return initialProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
            const matchesCategory = activeCategory === "all" || p.category_id === activeCategory
            return matchesSearch && matchesCategory
        })
    }, [initialProducts, searchTerm, activeCategory])

    // Load Settings (Tax)
    const [taxRate, setTaxRate] = useState(0)

    useEffect(() => {
        const stored = localStorage.getItem("pos_settings")
        if (stored) {
            try {
                const settings = JSON.parse(stored)
                setTaxRate(Number(settings.taxRate) || 0)
            } catch (e) { console.error(e) }
        }
    }, [])

    const taxAmount = cartTotal * (taxRate / 100)
    const finalTotal = cartTotal + taxAmount

    const { isOnline, addOrderToQueue } = useOffline()

    const [showSuccess, setShowSuccess] = useState(false)
    const [lastOrder, setLastOrder] = useState<{ id: string, total: number } | null>(null)

    const handleCheckout = async () => {
        setIsProcessing(true)

        if (!isOnline) {
            addOrderToQueue({
                items: cart,
                totalAmount: finalTotal,
                paymentMethod,
                customerId: customer?.id
            })
            clearCart() // Use global clearCart
            setIsCheckoutOpen(false)
            setCedula("")
            setCustomer(null)
            setIsProcessing(false)
            return
        }

        const result = await createOrder({
            items: cart,
            total: finalTotal,
            paymentMethod,
            customerId: customer?.id
        })

        setIsProcessing(false)
        if (result.error) {
            toast({ title: t.checkout_failed, description: result.error, variant: "destructive" })
        } else {
            // SUCCESS FLOW
            setLastOrder({ id: result.orderId || "", total: cartTotal })
            setIsCheckoutOpen(false)
            clearCart()
            setCedula("")
            setCustomer(null)
            setShowSuccess(true) // Trigger Success Modal
        }
    }

    // Helper for Stock Color (Traffic Light Logic)
    const getStockColor = (stock: number) => {
        if (stock <= 10) return "destructive" // Red
        if (stock <= 40) return "warning" // Yellow/Orange
        return "secondary" // Greenish/Default
    }

    return (
        <div className="flex h-full gap-4">
            {/* LEFT: Product Grid */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Filters */}
                <div className="flex gap-2 pb-2 overflow-x-auto">
                    <Button
                        variant={activeCategory === "all" ? "default" : "outline"}
                        onClick={() => setActiveCategory("all")}
                        className={activeCategory === "all" ? "bg-emerald-600" : ""}
                    >
                        {t.all}
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat.id}
                            variant={activeCategory === cat.id ? "default" : "outline"}
                            onClick={() => setActiveCategory(cat.id)}
                            className={activeCategory === cat.id ? "bg-emerald-600" : ""}
                            style={activeCategory === cat.id ? { backgroundColor: cat.color } : { borderColor: cat.color, color: cat.color }}
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t.search_placeholder}
                        className="pl-9 h-11"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                        {filteredProducts.map(product => (
                            <Card
                                key={product.id}
                                className="cursor-pointer hover:border-emerald-500 transition-all active:scale-95 flex flex-col"
                                onClick={() => addToCart(product)}
                            >
                                <div className="aspect-square bg-muted relative overflow-hidden rounded-t-lg">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground opacity-20 text-4xl font-bold">
                                            {product.name.charAt(0)}
                                        </div>
                                    )}
                                    {product.stock <= 0 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-white font-bold bg-red-500 px-2 py-1 rounded text-xs">{t.out_of_stock}</span>
                                        </div>
                                    )}
                                    {product.stock > 0 && (
                                        <div className="absolute top-2 right-2">
                                            <Badge
                                                className={cn(
                                                    "shadow-sm opacity-90 text-[10px] h-5 px-1.5",
                                                    product.stock <= 10 ? "bg-red-500 hover:bg-red-600" :
                                                        product.stock <= 40 ? "bg-orange-500 hover:bg-orange-600" :
                                                            "bg-emerald-500 hover:bg-emerald-600"
                                                )}
                                            >
                                                {product.stock}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex flex-col flex-1">
                                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{product.name}</h3>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="font-bold text-emerald-700">{formatCurrency(product.price)}</span>
                                        <span className="text-xs text-muted-foreground">{product.stock} {t.items}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: Cart Sidebar */}
            <div className="w-[350px] md:w-[400px] flex flex-col bg-card border rounded-lg shadow-sm h-full">
                <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                    <h2 className="font-semibold flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        {t.cart}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => clearCart()} disabled={cart.length === 0} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        {t.clear_cart}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center opacity-50 space-y-2">
                            <ShoppingCart className="h-12 w-12" />
                            <p>{t.cart_empty}</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 animate-in slide-in-from-right-2 duration-300">
                                <div className="h-14 w-14 bg-muted rounded overflow-hidden flex-shrink-0">
                                    {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                        <p className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 bg-muted rounded-md border">
                                            <button className="h-6 w-6 flex items-center justify-center hover:bg-white rounded-l-md" onClick={() => updateQuantity(item.id, -1)}>
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                                            <button className="h-6 w-6 flex items-center justify-center hover:bg-white rounded-r-md" onClick={() => updateQuantity(item.id, 1)}>
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <span className="text-xs text-muted-foreground">@ {formatCurrency(item.price)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-muted/20 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{t.subtotal}</span>
                            <span>{formatCurrency(cartTotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>{t.tax} ({taxRate}%)</span>
                            <span>{formatCurrency(taxAmount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>{t.total}</span>
                            <span>{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20"
                        disabled={cart.length === 0}
                        onClick={() => setIsCheckoutOpen(true)}
                    >
                        {t.checkout} ({formatCurrency(finalTotal)})
                    </Button>
                </div>
            </div>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t.complete_payment}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cedula">{t.cedula}</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="cedula"
                                    placeholder={t.enter_cedula}
                                    value={cedula}
                                    onChange={(e) => handleSearchCustomer(e.target.value)}
                                    autoFocus
                                    className={!customer && cedula.length > 4 ? "border-red-500 focus-visible:ring-red-500" : ""}
                                />
                            </div>
                            {isSearching && <p className="text-xs text-muted-foreground">{t.searching}</p>}
                            {customer && (
                                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 p-2 rounded">
                                    <User className="h-4 w-4" />
                                    {customer.full_name}
                                </div>
                            )}
                            {!customer && cedula.length > 4 && !isSearching && (
                                <p className="text-xs text-red-500 font-medium">{t.customer_not_found}</p>
                            )}
                        </div>

                        <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">{t.total}</p>
                                <p className="text-4xl font-bold text-emerald-600">{formatCurrency(finalTotal)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {['CASH', 'CARD', 'TRANSFER', 'OTHER'].map(method => (
                                <div
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={cn(
                                        "cursor-pointer border-2 rounded-lg p-3 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 transition-all",
                                        paymentMethod === method ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-muted"
                                    )}
                                >
                                    {method === 'CASH' && <Banknote className="h-6 w-6" />}
                                    {method === 'CARD' && <CreditCard className="h-6 w-6" />}
                                    {method === 'TRANSFER' && <CreditCard className="h-6 w-6" />}
                                    <span className="text-xs font-bold">{method === 'CASH' ? t.cash :
                                        method === 'CARD' ? t.card :
                                            method === 'TRANSFER' ? t.transfer : method}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>{t.cancel}</Button>
                        <Button
                            className="bg-emerald-600 w-full md:w-auto"
                            onClick={handleCheckout}
                            disabled={isProcessing || !customer}
                        >
                            {isProcessing ? t.processing : t.pay_print}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Success Modal */}
            <CheckoutSuccess
                open={showSuccess}
                onOpenChange={setShowSuccess}
                orderId={lastOrder?.id}
                total={lastOrder?.total}
            />
        </div>
    )
}
