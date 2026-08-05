import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'
import { PWARegister } from '@/components/PWARegister'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0fb5b0',
}

export const metadata: Metadata = {
  title: 'Lavadero',
  description: 'Gestión de órdenes de trabajo, caja y stock para lavaderos de autos',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lavadero',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Lavadero',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* Meta tags adicionales para PWA */}
        <meta name="application-name" content="Lavadero" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lavadero" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0fb5b0" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icon (iPhone: 180px, sin recorte) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <SessionProvider>
          <QueryProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </QueryProvider>
        </SessionProvider>
        <Toaster richColors position="top-right" closeButton />
        <PWARegister />
      </body>
    </html>
  )
}

