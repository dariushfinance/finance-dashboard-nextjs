import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServerClient } from '@/lib/supabase'
import { getCurrentPrice } from '@/lib/yahoo'

// GET /api/portfolio — fetch the authenticated user's positions with live prices
export async function GET(_req: NextRequest) {
  const user = await getAuthUser()
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
      const invested = row.shares * row.buy_price

      // Cash positions: price is always the face value — no API call needed
      if (row.ticker === 'CASH' || row.ticker === 'USD') {
        return {
          ...row,
          current_price: row.buy_price,
          invested,
          current_value: invested,
          pnl: 0,
          return_pct: 0,
          price_error: false,
        }
      }

      const current_price = await getCurrentPrice(row.ticker)
      if (current_price === 0) {
        // Price fetch failed — flag the row so the UI can warn the user
        // rather than silently showing a 100% loss
        return { ...row, current_price: null, invested, current_value: null, pnl: null, return_pct: null, price_error: true }
      }
      const current_value = row.shares * current_price
      const pnl           = current_value - invested
      const return_pct    = row.buy_price > 0
        ? ((current_price - row.buy_price) / row.buy_price) * 100
        : 0
      return { ...row, current_price, invested, current_value, pnl, return_pct, price_error: false }
    })
  )

  return NextResponse.json(enriched)
}

// POST /api/portfolio — add a position to the authenticated user's portfolio
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ticker, shares, buy_price, buy_date } = body

  const sharesNum = Number(shares)
  const priceNum  = Number(buy_price)
  const dateStr   = String(buy_date ?? '')
  const errors: string[] = []
  if (!ticker || typeof ticker !== 'string' || !ticker.trim())
    errors.push('ticker is required')
  if (!Number.isFinite(sharesNum) || sharesNum <= 0)
    errors.push('shares must be a positive number')
  if (!Number.isFinite(priceNum) || priceNum <= 0)
    errors.push('buy_price must be a positive number')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || new Date(dateStr) > new Date())
    errors.push('buy_date must be a valid past date (YYYY-MM-DD)')
  if (errors.length)
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })

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
  const user = await getAuthUser()
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
