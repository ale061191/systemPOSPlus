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
            const res = await fetch("/api/bcv-rates")
            const data = await res.json()
            if (data && data.dollar) {
                setExchangeRate(data.dollar)
            }
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
