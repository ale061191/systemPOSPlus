"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, Package, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { searchGlobal, SearchResult } from "@/app/actions/global-search"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/providers/language-provider"

export function GlobalSearch() {
    const { t } = useLanguage()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true)
                const data = await searchGlobal(query)
                setResults(data)
                setLoading(false)
                setOpen(true)
            } else {
                setResults([])
                setOpen(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (url: string) => {
        setOpen(false)
        setQuery("") // Clear search on select? Optional.
        router.push(url)
    }

    return (
        <div className="w-full flex-1 relative" ref={containerRef}>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={t.global_search_placeholder}
                    className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (results.length > 0) setOpen(true) }}
                />
            </div>

            {open && (
                <div className="absolute top-full mt-2 w-full max-w-sm bg-popover text-popover-foreground shadow-md rounded-md border p-1 z-50">
                    {loading ? (
                        <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.searching}
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {t.no_results_found}
                        </div>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto">
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {t.suggestions}
                            </div>
                            {results.map((result) => (
                                <div
                                    key={`${result.type}-${result.id}`}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                    )}
                                    onClick={() => handleSelect(result.url)}
                                >
                                    {result.type === "product" ? (
                                        <Package className="mr-2 h-4 w-4 text-blue-500" />
                                    ) : (
                                        <Users className="mr-2 h-4 w-4 text-emerald-500" />
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-medium">{result.title}</span>
                                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
