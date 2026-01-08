"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Currency = "USD" | "VES"

interface CurrencyContextType {
    currency: Currency
    exchangeRate: number
    euroRate: number
    toggleCurrency: () => void
    formatCurrency: (amount: number) => string
    convertPrice: (amountInUsd: number) => number
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<Currency>("USD")
    const [exchangeRate, setExchangeRate] = useState<number>(1)
    const [euroRate, setEuroRate] = useState<number>(1)

    const fetchRate = async () => {
        try {
            console.log("Fetching exchange rate...")
            // Try local API first
            const res = await fetch("/api/bcv-rates")
            if (res.ok) {
                const data = await res.json()
                if (data) {
                    if (typeof data.dollar === 'number') {
                        console.log("Dollar Rate from API:", data.dollar)
                        setExchangeRate(data.dollar)
                        localStorage.setItem("last_exchange_rate", data.dollar.toString())
                    }
                    if (typeof data.euro === 'number') {
                        console.log("Euro Rate from API:", data.euro)
                        setEuroRate(data.euro)
                        localStorage.setItem("last_euro_rate", data.euro.toString())
                    }
                    return
                }
            }

            // Fallback: Try direct fetch if API route fails (handling CORS if possible)
            // Note: Direct fetch to rafnixg for EUR might not work as verified, so this fallback is mostly for USD or if API recovers
            console.warn("Local API failed, trying direct fetch...")
            const directRes = await fetch("https://bcv-api.rafnixg.dev/rates/")
            if (directRes.ok) {
                const directData = await directRes.json()
                if (directData && typeof directData.dollar === 'number') {
                    setExchangeRate(directData.dollar)
                    localStorage.setItem("last_exchange_rate", directData.dollar.toString())
                    // No euro fallback here currently
                    return
                }
            }

            console.warn("All fetches failed. Checking cache...")
            throw new Error("All fetches failed")
        } catch (error) {
            console.error("Failed to fetch exchange rate:", error)

            // Try to recover from localStorage
            const cachedRate = localStorage.getItem("last_exchange_rate")
            if (cachedRate) {
                const parsedRate = parseFloat(cachedRate)
                if (!isNaN(parsedRate)) {
                    setExchangeRate(parsedRate)
                }
            }
            const cachedEuro = localStorage.getItem("last_euro_rate")
            if (cachedEuro) {
                const parsedEuro = parseFloat(cachedEuro)
                if (!isNaN(parsedEuro)) {
                    setEuroRate(parsedEuro)
                }
            }

            if (!cachedRate) {
                console.warn("No cache found, using hardcoded fallback.")
                setExchangeRate(60)
            }
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
        <CurrencyContext.Provider value={{ currency, exchangeRate, euroRate, toggleCurrency, formatCurrency, convertPrice }}>
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
