"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/providers/language-provider"

interface CheckoutSuccessProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orderId?: string
    total?: number
    change?: number
}

export function CheckoutSuccess({ open, onOpenChange, orderId, total, change }: CheckoutSuccessProps) {
    const { t } = useLanguage()
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        if (open) {
            setAnimate(true)
        } else {
            setAnimate(false)
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl p-0 overflow-hidden">
                <div className="flex flex-col items-center justify-center p-8 bg-emerald-600 text-white relative">
                    {/* Animated Check Circle */}
                    <div className={`
                        h-24 w-24 bg-white rounded-full flex items-center justify-center mb-4 transition-all duration-700 ease-out
                        ${animate ? "scale-100 opacity-100" : "scale-50 opacity-0"}
                    `}>
                        <Check className={`
                            h-12 w-12 text-emerald-600 transition-all duration-700 delay-300
                            ${animate ? "scale-100 opacity-100" : "scale-0 opacity-0"}
                        `} strokeWidth={4} />
                    </div>

                    <DialogTitle className="text-3xl font-bold mb-2">{t.payment_successful}</DialogTitle>
                    <p className="text-emerald-100 text-center">{t.transaction_processed}</p>

                    {/* Confeti decoration (CSS circles) */}
                    <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-yellow-400 opacity-50"></div>
                    <div className="absolute bottom-10 right-10 w-3 h-3 rounded-full bg-white opacity-40"></div>
                    <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-sky-300 opacity-60"></div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-2 text-center">
                        <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">{t.total_amount}</p>
                        <p className="text-4xl font-bold text-slate-800">${total?.toFixed(2)}</p>
                    </div>

                    {orderId && (
                        <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center text-sm border">
                            <span className="text-muted-foreground">{t.order_ref}</span>
                            <span className="font-mono font-bold">#{orderId.slice(0, 8)}</span>
                        </div>
                    )}

                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-bold shadow-lg shadow-emerald-200"
                        onClick={() => onOpenChange(false)}
                    >
                        {t.start_new_order}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
