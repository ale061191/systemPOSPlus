
import { createClient } from "@supabase/supabase-js"
import { headers } from "next/headers"

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
    // Ensure we are not caching
    const headersList = await headers()

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Obfuscate keys for display
    const showKey = (key: string | undefined) => key
        ? `${key.substring(0, 5)}...${key.substring(key.length - 5)} (Length: ${key.length})`
        : "MISSING"

    const results = {
        url: showKey(sbUrl),
        serviceKey: showKey(sbServiceKey),
        connection: "PENDING",
        error: null as string | null
    }

    try {
        if (!sbUrl || !sbServiceKey) {
            throw new Error("Missing Environment Variables")
        }

        const adminDb = createClient(sbUrl, sbServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        const { data, error } = await adminDb.from("products").select("count").limit(1).single()

        if (error) throw error

        results.connection = "SUCCESS"
    } catch (e: any) {
        results.connection = "FAILED"
        results.error = e.message
    }

    return (
        <div className="p-8 max-w-2xl mx-auto font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">Vercel Diagnostic</h1>

            <div className="space-y-4 bg-slate-100 p-4 rounded border">
                <div>
                    <strong>NEXT_PUBLIC_SUPABASE_URL:</strong><br />
                    {results.url}
                </div>
                <div>
                    <strong>SUPABASE_SERVICE_ROLE_KEY:</strong><br />
                    {results.serviceKey}
                </div>
                <div>
                    <strong>DB Connection (Admin):</strong><br />
                    <span className={results.connection === "SUCCESS" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {results.connection}
                    </span>
                </div>

                {results.error && (
                    <div className="bg-red-50 p-4 border border-red-200 text-red-700">
                        <strong>Error Details:</strong><br />
                        {results.error}
                    </div>
                )}
            </div>

            <p className="mt-4 text-gray-500">
                After checking, please delete this page or revert the code.
            </p>
        </div>
    )
}
