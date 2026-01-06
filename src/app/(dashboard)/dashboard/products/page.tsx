import { getProducts, getCategories } from "@/app/actions/inventory"
import { ProductsClient } from "./products-client"

export default async function ProductsPage() {
    const products = await getProducts()
    const categories = await getCategories()

    return (
        <div className="flex flex-col gap-4">
            <ProductsClient initialProducts={products || []} categories={categories || []} />
        </div>
    )
}
