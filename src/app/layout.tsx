import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OfflineProvider } from "@/providers/offline-context";
import { LanguageProvider } from "@/providers/language-provider";
import { CartProvider } from "@/providers/cart-context";
import { Toaster } from "@/components/ui/toaster";
import { ConnectionIndicator } from "@/components/dashboard/connection-indicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SystemPOS+",
  description: "Sistema de Punto de Venta Profesional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <OfflineProvider>
            <CartProvider>
              {children}
              <ConnectionIndicator />
              <Toaster />
            </CartProvider>
          </OfflineProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
