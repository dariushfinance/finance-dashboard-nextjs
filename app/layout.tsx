import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Portfolio Intelligence',
  description: 'Professional portfolio tracking · Real-time P&L · S&P 500 Benchmark · Fundamentals',
  openGraph: {
    title: 'Portfolio Intelligence Tool',
    description: 'Track your portfolio with professional finance analytics.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
