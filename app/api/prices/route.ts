import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPrice } from '@/lib/yahoo'
import { getAuthUser } from '@/lib/supabase'

// GET /api/prices?ticker=AAPL
export async function GET(req: NextRequest) {
  if (!await getAuthUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  const price = await getCurrentPrice(ticker)
  return NextResponse.json({ ticker, price })
}
