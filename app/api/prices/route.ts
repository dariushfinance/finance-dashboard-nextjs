import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPrice } from '@/lib/yahoo'

// GET /api/prices?ticker=AAPL
export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  const price = await getCurrentPrice(ticker)
  return NextResponse.json({ ticker, price })
}
