"use client"

import { useEffect, useState } from "react"
import { Save, Building2, Receipt, Percent, Upload, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { LanguageSwitcher } from "@/components/dashboard/language-switcher"
import { getStoreSettings, updateStoreSettings } from "@/app/actions/settings"
import { createClient } from "@/lib/supabase/client"

export function SettingsClient() {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    // Form State
    const [settings, setSettings] = useState({
        storeName: "",
        address: "",
        phone: "",
        taxRate: "0",
        footerMessage: "",
        logoUrl: ""
    })

    // Load from DB on mount
    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        const result = await getStoreSettings()
        if (result.settings) {
            setSettings({
                storeName: result.settings.store_name || "",
                address: result.settings.address || "",
                phone: result.settings.phone || "",
                taxRate: String(result.settings.tax_rate || "0"),
                footerMessage: result.settings.footer_message || "",
                logoUrl: result.settings.logo_url || ""
            })
            if (result.settings.logo_url) {
                setLogoPreview(result.settings.logo_url)
            }
        }
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setLogoFile(file)
            setLogoPreview(URL.createObjectURL(file))
        }
    }

    const handleSave = async () => {
        setIsLoading(true)

        try {
            const formData = new FormData()
            formData.append("storeName", settings.storeName)
            formData.append("address", settings.address)
            formData.append("phone", settings.phone)
            formData.append("taxRate", settings.taxRate)
            formData.append("footerMessage", settings.footerMessage)

            // Handle Logo Upload
            if (logoFile) {
                const supabase = createClient()
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `business-logo-${Date.now()}.${fileExt}`

                // Assuming 'products' bucket is public/available, or 'avatars'
                // Let's use 'products' for now as we know it works, or 'public'
                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(fileName, logoFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName)

                formData.append("logo_url", publicUrl)
            } else if (settings.logoUrl) {
                formData.append("logo_url", settings.logoUrl) // Keep existing
            }

            const result = await updateStoreSettings(formData)

            if (result.error) {
                toast({ variant: "destructive", title: "Error", description: result.error })
            } else {
                toast({ title: "Settings Saved", description: "Global configuration updated successfully." })
                // Reload to reflect changes globally if needed
                window.location.reload()
            }

        } catch (e: any) {
            console.error(e)
            toast({ variant: "destructive", title: "Error", description: e.message })
        }

        setIsLoading(false)
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {/* Logo Section */}
                <Card className="col-span-1 md:col-span-3 lg:col-span-1 lg:row-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-indigo-600" />
                            Business Logo
                        </CardTitle>
                        <CardDescription>
                            Displayed in the header and receipts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Upload className="h-8 w-8 text-gray-400" />
                            )}
                            {/* Use native input for overlay to avoid shadcn styles interfering with absolute positioning */}
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleLogoChange}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Click to upload. PNG or JPG recommended.
                        </p>
                    </CardContent>
                </Card>

                {/* Store Information */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-emerald-600" />
                            Store Information
                        </CardTitle>
                        <CardDescription>
                            General business details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="storeName">Store Name</Label>
                            <Input
                                id="storeName"
                                placeholder="e.g. HotPOS Café"
                                value={settings.storeName}
                                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    placeholder="City, Country"
                                    value={settings.address}
                                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="+1 234 567"
                                    value={settings.phone}
                                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Configuration */}
                <div className="space-y-4 col-span-1 md:col-span-2 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Percent className="h-5 w-5 text-blue-600" />
                                Tax Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tax">Default Tax Rate (%)</Label>
                                <Input
                                    id="tax"
                                    type="number"
                                    placeholder="0"
                                    value={settings.taxRate}
                                    onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Language Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-purple-600" />
                                Language Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Interface Language</Label>
                                <LanguageSwitcher />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Select your preferred language for the interface.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-orange-600" />
                                Receipt Footer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="footer">Message</Label>
                                <Textarea
                                    id="footer"
                                    placeholder="Thank you for visiting!"
                                    className="resize-none h-24"
                                    value={settings.footerMessage}
                                    onChange={(e) => setSettings({ ...settings, footerMessage: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto"
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? "Saving..." : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Configuration
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
