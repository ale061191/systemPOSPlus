import { getCategories } from "@/app/actions/inventory"
import { CategoriesClient } from "./categories-client"

export default async function CategoriesPage() {
    const categories = await getCategories()

    return (
        <div className="flex flex-col gap-4">
            <CategoriesClient initialCategories={categories || []} />
        </div>
    )
}
