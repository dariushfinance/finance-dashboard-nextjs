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

  // Consolidate multiple lots of the same ticker into one row
  const consolidated = new Map<string, typeof enriched[0] & { lot_count: number; lot_ids: number[] }>()
  for (const row of enriched) {
    const existing = consolidated.get(row.ticker)
    if (!existing) {
      consolidated.set(row.ticker, { ...row, lot_count: 1, lot_ids: [row.id] })
    } else {
      const newShares   = existing.shares + row.shares
      const newInvested = (existing.invested ?? 0) + (row.invested ?? 0)
      const price       = existing.current_price ?? row.current_price
      const hasError    = existing.price_error || row.price_error
      const newValue    = hasError || price == null ? null : newShares * price
      const newPnl      = newValue !== null ? newValue - newInvested : null
      consolidated.set(row.ticker, {
        ...existing,
        shares:        newShares,
        buy_price:     newInvested / newShares,
        buy_date:      existing.buy_date < row.buy_date ? existing.buy_date : row.buy_date,
        invested:      newInvested,
        current_price: price,
        current_value: newValue,
        pnl:           newPnl,
        return_pct:    newInvested > 0 && newPnl !== null ? (newPnl / newInvested) * 100 : null,
        price_error:   hasError,
        lot_count:     existing.lot_count + 1,
        lot_ids:       [...existing.lot_ids, row.id],
      })
    }
  }

  return NextResponse.json([...consolidated.values()])
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

// DELETE /api/portfolio — remove all lots for a ticker (ownership verified via user_id)
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const ticker = body.ticker as string | undefined
  const id     = body.id     as number | undefined

  if (!ticker && !id) return NextResponse.json({ error: 'ticker or id required' }, { status: 400 })

  const supabase = createServerClient()
  const query    = supabase.from('portfolio').delete().eq('user_id', user.id)
  const { error } = ticker
    ? await query.eq('ticker', ticker.toUpperCase())
    : await query.eq('id', id!)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
