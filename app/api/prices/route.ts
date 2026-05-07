import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPrice, getHistoricalPrices } from '@/lib/yahoo'
import { getAuthUser } from '@/lib/supabase'

// GET /api/prices?ticker=AAPL
// GET /api/prices?ticker=AAPL&date=2023-06-15  → closing price on/after that date
export async function GET(req: NextRequest) {
  if (!await getAuthUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()
  const date   = req.nextUrl.searchParams.get('date') // optional YYYY-MM-DD

  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  if (date) {
    const rows = await getHistoricalPrices(ticker, date)
    const row  = rows.find(r => r.date >= date)
    if (!row) return NextResponse.json({ error: 'No price data for that date' }, { status: 404 })
    return NextResponse.json({ ticker, price: row.close, date: row.date })
  }

  const price = await getCurrentPrice(ticker)
  return NextResponse.json({ ticker, price })
}
