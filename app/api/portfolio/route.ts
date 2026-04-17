import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, createServerClient } from '@/lib/supabase'
import { getCurrentPrice } from '@/lib/yahoo'

async function getUser() {
  const supabase = createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET /api/portfolio — fetch the authenticated user's positions with live prices
export async function GET(_req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .eq('user_id', user.id)
    .order('id', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json([])

  const enriched = await Promise.all(
    data.map(async (row) => {
      const current_price = await getCurrentPrice(row.ticker)
      const invested      = row.shares * row.buy_price
      const current_value = row.shares * current_price
      const pnl           = current_value - invested
      const return_pct    = row.buy_price > 0
        ? ((current_price - row.buy_price) / row.buy_price) * 100
        : 0
      return { ...row, current_price, invested, current_value, pnl, return_pct }
    })
  )

  return NextResponse.json(enriched)
}

// POST /api/portfolio — add a position to the authenticated user's portfolio
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ticker, shares, buy_price, buy_date } = body

  if (!ticker || !shares || !buy_price || !buy_date)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

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
      user_id:   user.id,
      ticker:    ticker.toUpperCase(),
      shares:    Number(shares),
      buy_price: Number(buy_price),
      buy_date:  String(buy_date),
    })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/portfolio — remove a position (ownership verified via user_id)
export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase
    .from('portfolio')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)  // ensures users can only delete their own rows

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
