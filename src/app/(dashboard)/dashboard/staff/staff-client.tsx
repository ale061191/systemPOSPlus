"use client"

import { useState } from "react"
import { Plus, Users, Shield, Loader2, MoreHorizontal, Trash } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { createStaffUser, deleteStaffUser, getStaffPerformance } from "@/app/actions/staff"
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
import { useLanguage } from "@/providers/language-provider"

export function StaffClient({ initialStaff, currentUserRole }: { initialStaff: any[], currentUserRole: string | null }) {
    const { t } = useLanguage()
    const { formatCurrency } = useCurrency()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Performance Sheet State
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<any>(null)
    const [staffStats, setStaffStats] = useState<any>(null)
    const [loadingStats, setLoadingStats] = useState(false)

    async function handleRowClick(staff: any) {
        setSelectedStaff(staff)
        setDetailsOpen(true)
        setLoadingStats(true)

        const { stats, history, error } = await getStaffPerformance(staff.id)

        if (!error) {
            setStaffStats({ stats, history })
        }
        setLoadingStats(false)
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget)

        const result = await createStaffUser(formData)

        setIsLoading(false)
        if (result.error) {
            alert("Error: " + result.error)
        } else {
            alert("Staff user created successfully!")
            setIsOpen(false)
        }
    }

    async function confirmDelete() {
        if (!deleteId) return

        const result = await deleteStaffUser(deleteId)
        if (result.error) {
            alert("Error deleting staff: " + result.error)
        } else {
            // refresh happens automatically via server action revalidatePath
        }
        setDeleteId(null)
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">{t.staff_management}</h1>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="mr-2 h-4 w-4" /> {t.add_staff}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t.add_staff}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">{t.full_name}</Label>
                                <Input id="fullName" name="fullName" placeholder="John Doe" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t.email}</Label>
                                <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">{t.role}</Label>
                                <Select name="role" defaultValue="cashier">
                                    <SelectTrigger>
                                        <SelectValue placeholder={t.select_role} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cashier">{t.cashier}</SelectItem>
                                        <SelectItem value="manager">{t.manager}</SelectItem>
                                        <SelectItem value="admin">{t.admin}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">{t.password}</Label>
                                <Input id="password" name="password" type="password" required placeholder="Min 6 chars" />
                            </div>

                            <Button type="submit" className="mt-4 bg-emerald-600" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t.create_account}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t.staff_list}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.name}</TableHead>
                                <TableHead>{t.email}</TableHead>
                                <TableHead>{t.role}</TableHead>
                                <TableHead>{t.date}</TableHead>
                                <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialStaff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        {t.no_staff_found}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                initialStaff.map((staff) => (
                                    <TableRow
                                        key={staff.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleRowClick(staff)}
                                    >
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {staff.full_name ? staff.full_name.substring(0, 2).toUpperCase() : '??'}
                                            </div>
                                            {staff.full_name || t.unknown}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {staff.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={staff.role === 'admin' ? "destructive" : "secondary"}>
                                                {staff.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(staff.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                    {currentUserRole === 'admin' ? (
                                                        <DropdownMenuItem onSelect={() => setDeleteId(staff.id)} className="text-red-500">
                                                            <Trash className="mr-2 h-4 w-4" /> {t.delete_user}
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem className="text-muted-foreground" disabled>
                                                            <Shield className="mr-2 h-4 w-4" /> {t.admin_only}
                                                        </DropdownMenuItem>
                                                    )}
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

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.delete_staff_confirm_title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.delete_staff_confirm_desc}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            {t.delete_account}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-2xl font-bold">
                            {selectedStaff?.full_name}
                        </SheetTitle>
                        <SheetDescription>
                            {t.performance_history}
                        </SheetDescription>
                    </SheetHeader>

                    {loadingStats ? (
                        <div className="flex items-center justify-center h-48">
                            <p className="text-muted-foreground animate-pulse">{t.calculating}</p>
                        </div>
                    ) : staffStats ? (
                        <div className="space-y-6">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">{t.total_sales}</p>
                                    <p className="text-2xl font-bold text-emerald-700">
                                        {formatCurrency(staffStats.stats?.totalSales)}
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">{t.tickets_orders}</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {staffStats.stats?.orderCount}
                                    </p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 col-span-2">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">{t.avg_ticket_value}</p>
                                    <p className="text-2xl font-bold text-purple-700">
                                        {formatCurrency(staffStats.stats?.averageTicket)}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Top Products */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">{t.top_selling_products}</h3>
                                <div className="space-y-2">
                                    {staffStats.stats?.topProducts?.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">{t.no_sales_data}</p>
                                    ) : (
                                        staffStats.stats?.topProducts?.map((p: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center p-2 rounded bg-muted/30">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 rounded-full">{i + 1}</Badge>
                                                    <span className="font-medium text-sm">{p.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-muted-foreground block">{p.count} {t.units}</span>
                                                    <span className="font-bold text-sm text-emerald-600">{formatCurrency(p.sales)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Recent Sales History */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">{t.recent_transactions}</h3>
                                <ScrollArea className="h-[250px] rounded-md border p-2">
                                    <div className="space-y-2">
                                        {staffStats.history?.length === 0 ? (
                                            <p className="text-sm text-center py-4 text-muted-foreground">{t.no_recent_transactions}</p>
                                        ) : (
                                            staffStats.history?.map((order: any) => (
                                                <div key={order.id} className="flex items-center justify-between p-2 border-b last:border-0 hover:bg-muted/50">
                                                    <div>
                                                        <p className="text-sm font-bold">Order #{order.id.slice(0, 8)}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-emerald-600">{formatCurrency(order.total_amount)}</p>
                                                        <Badge variant="outline" className="text-[10px] h-5">{order.payment_method}</Badge>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    )
}
