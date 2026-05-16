import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import Footer from '@/components/Footer'
import './globals.css'

const SITE_URL = 'https://quantfoli.com'
const SITE_NAME = 'Quantfoli'
const SITE_DESCRIPTION =
  'Swiss portfolio analytics for self-directed investors. Markowitz efficient frontier, historical stress testing, Sharpe/Sortino/Beta/Alpha, FX-aware ZKB · Yuh · Neon CSV import.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Quant-grade portfolio analytics`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'portfolio analytics',
    'Markowitz efficient frontier',
    'Sharpe ratio',
    'Sortino ratio',
    'stress testing',
    'ZKB CSV import',
    'Yuh CSV import',
    'Neon CSV import',
    'Swiss investor',
    'multi-currency portfolio',
  ],
  authors: [{ name: 'Dariush Tahajomi', url: SITE_URL }],
  creator: 'Dariush Tahajomi',
  publisher: 'Quantfoli',
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Quant-grade portfolio analytics`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_CH',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Quant-grade portfolio analytics`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/icon.svg' },
  category: 'finance',
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
