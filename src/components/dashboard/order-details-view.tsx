import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCurrency } from "@/providers/currency-provider"
import { useLanguage } from "@/providers/language-provider"

interface OrderDetailsViewProps {
    order: any
}

export function OrderDetailsView({ order }: OrderDetailsViewProps) {
    const { t } = useLanguage()
    const { formatCurrency } = useCurrency()

    if (!order) return null

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED": return "default" // Black/Primary
            case "PENDING": return "secondary" // Gray
            case "CANCELLED": return "destructive" // Red
            default: return "outline"
        }
    }

    return (
        <div className="space-y-6">
            {/* Status and Meta */}
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
                <div>
                    <p className="text-sm text-muted-foreground">{t.status}</p>
                    <Badge variant={getStatusColor(order.status) as any} className="mt-1">
                        {order.status === 'COMPLETED' ? t.completed :
                            order.status === 'PENDING' ? t.pending :
                                order.status === 'CANCELLED' ? t.cancelled : order.status}
                    </Badge>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t.date}</p>
                    <p className="font-medium">{format(new Date(order.created_at), "PPP p")}</p>
                </div>
            </div>

            {/* Customer Info */}
            <div>
                <h3 className="text-sm font-semibold mb-2">{t.customer}</h3>
                <div className="flex items-center gap-3 p-3 border rounded-md">
                    <div className="bg-primary/10 p-2 rounded-full">
                        {/* Icon or Avatar placeholder */}
                        <span className="font-bold text-primary">
                            {order.customers?.full_name?.charAt(0) || "G"}
                        </span>
                    </div>
                    <div>
                        <p className="font-medium">{order.customers?.full_name || t.guest_customer}</p>
                        <p className="text-xs text-muted-foreground">
                            {order.customers?.cedula || t.no_id} • {order.customers?.phone || t.no_phone}
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Items List */}
            <div>
                <h3 className="text-sm font-semibold mb-3">{t.items} ({order.order_items?.length})</h3>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                        {order.order_items?.map((item: any) => (
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
                                        <p className="text-sm font-medium">{item.products?.name || t.unknown_product}</p>
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
                    <span className="text-muted-foreground">{t.subtotal}</span>
                    <span>{formatCurrency(Number(order.total_amount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.tax}</span>
                    <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span>{t.total}</span>
                    <span>{formatCurrency(Number(order.total_amount))}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{t.payment_method}</span>
                    <span className="uppercase">{order.payment_method === 'cash' ? t.cash :
                        order.payment_method === 'card' ? t.card :
                            order.payment_method === 'transfer' ? t.transfer : order.payment_method}</span>
                </div>
            </div>
        </div>
    )
}
