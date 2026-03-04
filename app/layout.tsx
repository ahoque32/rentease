import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RentEase - Property Management Made Simple',
  description: 'Property management SaaS for small landlords. Track rent, manage maintenance, and organize your properties.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="pointer-events-none fixed inset-0 -z-10 glass-gradient" />
          <div className="pointer-events-none fixed -left-24 top-16 -z-10 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />
          <div className="pointer-events-none fixed -right-24 bottom-10 -z-10 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
          {children}
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
