import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getCurrentPrice } from '@/lib/yahoo'

// GET /api/portfolio?user_id=xxx — fetch positions with live prices
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')?.toLowerCase()
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json([])

  // Enrich with live prices (same logic as portfolviz.py get_portfolio_data)
  const enriched = await Promise.all(
    data.map(async (row) => {
      const current_price = await getCurrentPrice(row.ticker)
      const invested = row.shares * row.buy_price
      const current_value = row.shares * current_price
      const pnl = current_value - invested
      const return_pct =
        row.buy_price > 0
          ? ((current_price - row.buy_price) / row.buy_price) * 100
          : 0
      return { ...row, current_price, invested, current_value, pnl, return_pct }
    })
  )

  return NextResponse.json(enriched)
}

// POST /api/portfolio — add position
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, ticker, shares, buy_price, buy_date } = body

  if (!user_id || !ticker || !shares || !buy_price || !buy_date)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Validate ticker
  const price = await getCurrentPrice(ticker.toUpperCase())
  if (price === 0)
    return NextResponse.json(
      { error: `Ticker '${ticker}' not found. Use a valid symbol like AAPL, MSFT.` },
      { status: 422 }
    )

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('portfolio')
    .insert({
      user_id: user_id.toLowerCase(),
      ticker: ticker.toUpperCase(),
      shares: Number(shares),
      buy_price: Number(buy_price),
      buy_date: String(buy_date),
    })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/portfolio — remove position
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const { id, user_id } = body

  if (!id || !user_id)
    return NextResponse.json({ error: 'id and user_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase
    .from('portfolio')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id.toLowerCase())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
