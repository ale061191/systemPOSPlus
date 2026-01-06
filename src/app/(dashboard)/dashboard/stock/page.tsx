import { getProducts } from "@/app/actions/inventory"
import { StockClient } from "./stock-client"

export default async function StockPage() {
    const products = await getProducts()

    return (
        <div className="flex flex-col gap-4">
            <StockClient initialProducts={products || []} />
        </div>
    )
}
