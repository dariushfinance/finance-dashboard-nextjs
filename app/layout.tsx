import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quantfoli',
  description: 'Quant-grade portfolio analytics for self-directed investors · Sharpe · Frontier · Stress Testing',
  openGraph: {
    title: 'Quantfoli',
    description: 'Quant-grade portfolio analytics for self-directed investors.',
    type: 'website',
    url: 'https://quantfoli.com',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <div style={{ flex: 1 }}>{children}</div>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  )
}
