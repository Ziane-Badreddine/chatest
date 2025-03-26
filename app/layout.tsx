import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import VerticalNav from "./_components/vertical-nav"
import MobileNav from "./_components/mobile-nav"
import {
  ClerkLoaded,
  ClerkLoading,
  ClerkProvider,
} from '@clerk/nextjs'
import { Send } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "WhatsApp Clone",
  description: "A WhatsApp clone built with Next.js and shadcn/ui",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={jetbrainsMono.variable}>
        <body>
          <ClerkLoading>
            <div className="w-screen h-screen overflow-hidden flex items-center justify-center bg-accent">
              <Send className="w-40 h-40 animate-ping text-primary " />
            </div>
          </ClerkLoading>
          <ClerkLoaded>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              <main className="h-screen bg-background flex flex-col md:flex-row">
                <VerticalNav />
                <div className="flex-1 md:pb-0 ">
                  {children}
                </div>
                <MobileNav />
              </main>
            </ThemeProvider>
          </ClerkLoaded>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}

