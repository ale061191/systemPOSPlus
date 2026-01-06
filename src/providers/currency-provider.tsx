"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Currency = "USD" | "VES"

interface CurrencyContextType {
    currency: Currency
    exchangeRate: number
    toggleCurrency: () => void
    formatCurrency: (amount: number) => string
    convertPrice: (amountInUsd: number) => number
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<Currency>("USD")
    const [exchangeRate, setExchangeRate] = useState<number>(0)

    const fetchRate = async () => {
        try {
            console.log("Fetching exchange rate...")
            // Try local API first
            const res = await fetch("/api/bcv-rates")
            if (res.ok) {
                const data = await res.json()
                if (data && typeof data.dollar === 'number') {
                    console.log("Rate from API:", data.dollar)
                    setExchangeRate(data.dollar)
                    return
                }
            }

            // Fallback: Try direct fetch if API route fails (handling CORS if possible)
            console.warn("Local API failed, trying direct fetch...")
            const directRes = await fetch("https://bcv-api.rafnixg.dev/rates/")
            if (directRes.ok) {
                const directData = await directRes.json()
                if (directData && typeof directData.dollar === 'number') {
                    console.log("Rate from Direct API:", directData.dollar)
                    setExchangeRate(directData.dollar)
                    return
                }
            }

            console.warn("All fetches failed.")
        } catch (error) {
            console.error("Failed to fetch exchange rate:", error)
        }
    }

    useEffect(() => {
        fetchRate()
    }, [])

    const toggleCurrency = () => {
        if (currency === "USD") {
            // About to switch to VES, refresh rate
            fetchRate()
        }
        setCurrency(prev => (prev === "USD" ? "VES" : "USD"))
    }

    const convertPrice = (amountInUsd: number) => {
        if (currency === "USD") return amountInUsd
        return amountInUsd * exchangeRate
    }

    const formatCurrency = (amount: number | undefined | null) => {
        const safeAmount = amount || 0
        const value = convertPrice(safeAmount)
        if (currency === "USD") {
            return `$${value.toFixed(2)}`
        }
        return `Bs. ${value.toFixed(2)}`
    }

    return (
        <CurrencyContext.Provider value={{ currency, exchangeRate, toggleCurrency, formatCurrency, convertPrice }}>
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider")
    }
    return context
}
