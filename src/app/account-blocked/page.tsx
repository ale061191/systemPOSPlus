import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth"

export default function AccountBlockedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="max-w-md w-full shadow-lg border-red-200">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AlertCircle className="h-16 w-16 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-red-600">Acceso Bloqueado</CardTitle>
                    <CardDescription className="text-lg mt-2 font-medium text-gray-800">
                        Este usuario (bambudeliciascafe2025@gmail.com) está temporalmente bloqueado del sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <p className="text-sm text-gray-700">
                            Usuario temporalmente bloqueado por falta de pago. El sistema lo admitirá una vez cancelado el total pendiente.
                        </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-500">
                        Gracias por usar System POS+
                    </p>
                    <div className="pt-4">
                        <form action={logout}>
                            <Button variant="outline" className="w-full">
                                Volver al Inicio de Sesión
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
