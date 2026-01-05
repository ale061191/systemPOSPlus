"use client"

import { useState } from "react"
import { Plus, Trash, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createCategory, deleteCategory } from "@/app/actions/inventory"
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

export function CategoriesClient({ initialCategories }: { initialCategories: any[] }) {
    const { t } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget)

        try {
            const result = await createCategory(formData)

            if (result.error) {
                alert("Error: " + result.error) // Keep error alert for safety
            } else {
                setIsOpen(false)
                // revalidatePath in Server Action handles the data refresh
            }
        } catch (e: any) {
            alert("Error: " + e.message)
        } finally {
            setIsLoading(false)
        }
    }

    async function confirmDelete() {
        if (!deleteId) return
        await deleteCategory(deleteId)
        setDeleteId(null)
    }

    return (
        <>
            <div className="flex justify-end">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="mr-2 h-4 w-4" /> {t.add_category}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t.new_category}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t.name}</Label>
                                <Input id="name" name="name" placeholder={t.search_placeholder} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="color">{t.color}</Label>
                                <div className="flex gap-2">
                                    <Input id="color" name="color" type="color" className="w-12 h-10 p-1" defaultValue="#10b981" />
                                    <Input disabled value={t.pick_color} className="flex-1 bg-muted" />
                                </div>
                            </div>
                            <Button type="submit" className="mt-4 bg-emerald-600" disabled={isLoading}>
                                {isLoading ? t.saving : t.save_category}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t.are_you_sure}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t.delete_category_confirm_desc}
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {initialCategories.map((cat) => (
                    <Card key={cat.id} className="relative group hover:border-emerald-500 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{cat.name}</CardTitle>
                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center justify-center py-4">
                                <Tag className="h-10 w-10 opacity-20" style={{ color: cat.color }} />
                            </div>
                        </CardContent>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setDeleteId(cat.id)}
                        >
                            <Trash className="h-3 w-3" />
                        </Button>
                    </Card>
                ))}
                {initialCategories.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                        {t.no_categories_found}
                    </div>
                )}
            </div>
        </>
    )
}
