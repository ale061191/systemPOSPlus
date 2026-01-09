"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Code, Mail, Copyright } from "lucide-react"

export function DeveloperCredits() {
    const [isOpen, setIsOpen] = useState(false)
    const [keyBuffer, setKeyBuffer] = useState("")
    const SECRET_CODE = "kaizen"

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input or textarea
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return
            }

            setKeyBuffer((prev) => {
                const newBuffer = (prev + e.key).slice(-SECRET_CODE.length)
                if (newBuffer.toLowerCase() === SECRET_CODE) {
                    setIsOpen(true)
                    return "" // Reset buffer after success
                }
                return newBuffer
            })
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md border-emerald-500/20 shadow-2xl">
                <DialogHeader>
                    <div className="mx-auto bg-emerald-100 p-3 rounded-full mb-4 dark:bg-emerald-900/20">
                        <Code className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                        System Architecture & Development
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Technical Authoring & Intellectual Property
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center space-x-4 rounded-md border p-4 bg-muted/50">
                        <ShieldCheck className="h-10 w-10 text-emerald-500" />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                                Ezequiel Alejandro Rodríguez Bracho
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Lead Information Systems Engineer
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 rounded-md border p-4 bg-muted/50">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                                Contact & Support
                            </p>
                            <p className="text-xs text-muted-foreground select-all">
                                ezequielrodriguez1991@gmail.com
                            </p>
                        </div>
                    </div>

                    <div className="rounded-md bg-red-50 p-4 border border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
                        <div className="flex gap-2">
                            <Copyright className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                            <div className="text-xs text-red-800 dark:text-red-300 text-justify">
                                <span className="font-semibold block mb-1">Legal Notice of Authorship</span>
                                This system was architected and developed exclusively by <strong>Ezequiel Alejandro Rodríguez Bracho</strong>.
                                Any claim of authorship, distribution, or modification by unauthorized third parties is illegal and constitutes a violation of intellectual property rights.
                                For verification or licensing inquiries, please contact the developer directly.
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                        Build: KAIZEN-DEV-2026.1
                    </Badge>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
