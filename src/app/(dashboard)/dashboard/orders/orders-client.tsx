"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Search, Filter, MoreHorizontal, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateOrderStatus, getOrderDetails } from "@/app/actions/orders"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { useCurrency } from "@/providers/currency-provider"

export function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
    const { toast } = useToast()
    const { formatCurrency } = useCurrency()
    const [orders, setOrders] = useState(initialOrders)
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [searchTerm, setSearchTerm] = useState("")

    // Details Sheet State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === "ALL" || order.status === statusFilter
        const matchesSearch =
            order.id.includes(searchTerm) ||
            order.customers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesStatus && matchesSearch
    })

    const handleStatusChange = async (id: string, newStatus: string) => {
        const result = await updateOrderStatus(id, newStatus)
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" })
        } else {
            toast({ title: "Status Updated", description: `Order marked as ${newStatus}` })
            // Optimistic update
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
        }
    }

    const onViewDetails = async (order: any) => {
        setSelectedOrder(null)
        setIsDetailsOpen(true)
        setIsLoadingDetails(true)

        const { order: fullOrder, error } = await getOrderDetails(order.id)

        if (error) {
            toast({ title: "Error", description: "Failed to load details", variant: "destructive" })
            setIsDetailsOpen(false)
        } else {
            setSelectedOrder(fullOrder)
        }
        setIsLoadingDetails(false)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED": return "default" // Black/Primary
            case "PENDING": return "secondary" // Gray
            case "CANCELLED": return "destructive" // Red
            default: return "outline"
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Orders Management</h1>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                        {/* Filter Tabs */}
                        <div className="flex p-1 bg-muted rounded-md">
                            {["ALL", "PENDING", "COMPLETED", "CANCELLED"].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${statusFilter === status
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search order ID or customer..."
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
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                                        <TableCell>{format(new Date(order.created_at), "MMM d, HH:mm")}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {order.customers?.full_name || "Guest"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{order.customers?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(order.status) as any}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold">{formatCurrency(Number(order.total_amount))}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => onViewDetails(order)}>
                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                    <DropdownMenuRadioGroup value={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                                                        <DropdownMenuRadioItem value="PENDING">
                                                            <Clock className="mr-2 h-4 w-4 text-gray-500" /> Pending
                                                        </DropdownMenuRadioItem>
                                                        <DropdownMenuRadioItem value="COMPLETED">
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Completed
                                                        </DropdownMenuRadioItem>
                                                        <DropdownMenuRadioItem value="CANCELLED">
                                                            <XCircle className="mr-2 h-4 w-4 text-red-500" /> Cancelled
                                                        </DropdownMenuRadioItem>
                                                    </DropdownMenuRadioGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Order Details Sheet */}
            <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Order Details</SheetTitle>
                        <SheetDescription>
                            Transaction ID: {selectedOrder?.id}
                        </SheetDescription>
                    </SheetHeader>

                    {isLoadingDetails ? (
                        <div className="flex justify-center h-24 items-center">Loading...</div>
                    ) : selectedOrder ? (
                        <div className="space-y-6">
                            {/* Status and Meta */}
                            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge variant={getStatusColor(selectedOrder.status) as any} className="mt-1">
                                        {selectedOrder.status}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Date</p>
                                    <p className="font-medium">{format(new Date(selectedOrder.created_at), "PPP p")}</p>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Customer</h3>
                                <div className="flex items-center gap-3 p-3 border rounded-md">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        {/* Icon or Avatar placeholder */}
                                        <span className="font-bold text-primary">
                                            {selectedOrder.customers?.full_name?.charAt(0) || "G"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{selectedOrder.customers?.full_name || "Guest User"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedOrder.customers?.cedula || "No ID"} • {selectedOrder.customers?.phone || "No Phone"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Items List */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">Items ({selectedOrder.order_items?.length})</h3>
                                <ScrollArea className="h-[300px] pr-4">
                                    <div className="space-y-3">
                                        {selectedOrder.order_items?.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-start">
                                                <div className="flex gap-3">
                                                    <div className="h-10 w-10 bg-muted rounded overflow-hidden flex-shrink-0">
                                                        {item.products?.image_url ? (
                                                            <img src={item.products.image_url} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                                📦
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{item.products?.name || "Unknown Product"}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.quantity} x {formatCurrency(item.unit_price)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold">
                                                    {formatCurrency(item.quantity * item.unit_price)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <Separator />

                            {/* Totals */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(Number(selectedOrder.total_amount))}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{formatCurrency(0)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                    <span>Total</span>
                                    <span>{formatCurrency(Number(selectedOrder.total_amount))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>Payment Method</span>
                                    <span className="uppercase">{selectedOrder.payment_method}</span>
                                </div>
                            </div>

                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    )
}
