import { NextRequest, NextResponse } from 'next/server'
import { getFundamentals } from '@/lib/yahoo'

// POST /api/fundamentals
// Body: { tickers: ['AAPL', 'MSFT'] }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const tickers: string[] = body.tickers ?? []
  if (!tickers.length) return NextResponse.json([])

  const results = await Promise.all(tickers.map((t) => getFundamentals(t.toUpperCase())))
  console.log('[fundamentals]', JSON.stringify(results))
  return NextResponse.json(results)
}
