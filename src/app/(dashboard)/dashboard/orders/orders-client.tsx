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
import { OrderDetailsView } from "@/components/dashboard/order-details-view"
import { useLanguage } from "@/providers/language-provider"

export function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
    const { t } = useLanguage()
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
                <h1 className="text-lg font-semibold md:text-2xl">{t.orders_management}</h1>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                        {/* Filter Tabs */}
                        <div className="flex p-1 bg-muted rounded-md">
                            {["ALL", "PENDING", "COMPLETED", "CANCELLED"].map(status => {
                                let label = t.all
                                if (status === "PENDING") label = t.pending
                                if (status === "COMPLETED") label = t.completed
                                if (status === "CANCELLED") label = t.cancelled

                                return (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${statusFilter === status
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={t.search_orders_placeholder}
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
                                <TableHead>{t.order_id}</TableHead>
                                <TableHead>{t.date}</TableHead>
                                <TableHead>{t.customer}</TableHead>
                                <TableHead>{t.status}</TableHead>
                                <TableHead>{t.total}</TableHead>
                                <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        {t.no_orders_found}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => onViewDetails(order)}
                                    >
                                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                                        <TableCell>{format(new Date(order.created_at), "MMM d, HH:mm")}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {order.customers?.full_name || t.guest}
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
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => onViewDetails(order)}>
                                                        <Eye className="mr-2 h-4 w-4" /> {t.view_details}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>{t.update_status}</DropdownMenuLabel>
                                                    <DropdownMenuRadioGroup value={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                                                        <DropdownMenuRadioItem value="PENDING">
                                                            <Clock className="mr-2 h-4 w-4 text-gray-500" /> {t.pending}
                                                        </DropdownMenuRadioItem>
                                                        <DropdownMenuRadioItem value="COMPLETED">
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> {t.completed}
                                                        </DropdownMenuRadioItem>
                                                        <DropdownMenuRadioItem value="CANCELLED">
                                                            <XCircle className="mr-2 h-4 w-4 text-red-500" /> {t.cancelled}
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
                        <SheetTitle>{t.view_details}</SheetTitle>
                        <SheetDescription>
                            {t.transaction_id}: {selectedOrder?.id}
                        </SheetDescription>
                    </SheetHeader>

                    {isLoadingDetails ? (
                        <div className="flex justify-center h-24 items-center">{t.loading}</div>
                    ) : selectedOrder ? (
                        <div className="space-y-6">
                            <OrderDetailsView order={selectedOrder} />
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    )
}
