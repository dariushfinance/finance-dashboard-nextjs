import { NextRequest, NextResponse } from 'next/server'
import { getFundamentals } from '@/lib/yahoo'

// POST /api/fundamentals
// Body: { tickers: ['AAPL', 'MSFT'] }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const tickers: string[] = body.tickers ?? []
  if (!tickers.length) return NextResponse.json([])

  // Alpha Vantage free: max 5 req/min → sequential with 13s delay between calls
  const results = []
  for (const ticker of tickers) {
    results.push(await getFundamentals(ticker.toUpperCase()))
    if (tickers.indexOf(ticker) < tickers.length - 1) {
      await new Promise((r) => setTimeout(r, 13_000))
    }
  }
  return NextResponse.json(results)
}
