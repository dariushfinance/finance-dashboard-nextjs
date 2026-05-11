import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServerClient } from '@/lib/supabase'
import { getCurrentPrice } from '@/lib/yahoo'
import { getCHFperUSD } from '@/lib/fx'

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

  // Fetch current CHF/USD once for all FX-aware positions (cached 15 min)
  const currentChfPerUsd = await getCHFperUSD()

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
        return { ...row, current_price: null, invested, current_value: null, pnl: null, return_pct: null, price_error: true }
      }
      const current_value = row.shares * current_price
      const pnl           = current_value - invested

      // If buy_fx_rate is set (ZKB import), compute return in CHF so currency drag is included.
      // buy_price is in original currency (USD); buy_fx_rate is CHF/USD at purchase time.
      // return = (current_usd × current_chf_rate − buy_usd × historical_chf_rate) / (buy_usd × historical_chf_rate)
      const return_pct =
        row.buy_fx_rate && currentChfPerUsd > 0
          ? ((current_price * currentChfPerUsd - row.buy_price * row.buy_fx_rate) / (row.buy_price * row.buy_fx_rate)) * 100
          : row.buy_price > 0
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
  const { ticker, shares, buy_price, buy_date, buy_fx_rate } = body

  const sharesNum  = Number(shares)
  const priceNum   = Number(buy_price)
  const fxRateNum  = buy_fx_rate != null ? Number(buy_fx_rate) : null
  const dateStr    = String(buy_date ?? '')
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

  const insertRow: Record<string, unknown> = {
    user_id:   user.id,
    ticker:    ticker.toUpperCase(),
    shares:    sharesNum,
    buy_price: priceNum,
    buy_date:  dateStr,
  }
  if (fxRateNum != null && Number.isFinite(fxRateNum) && fxRateNum > 0)
    insertRow.buy_fx_rate = fxRateNum

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('portfolio')
    .insert(insertRow)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/portfolio — remove all lots for a ticker (ownership verified via user_id)
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body     = await req.json()
  const ticker   = body.ticker   as string | undefined
  const id       = body.id       as number | undefined
  const clearAll = body.clearAll as boolean | undefined

  if (!ticker && !id && !clearAll) return NextResponse.json({ error: 'ticker, id, or clearAll required' }, { status: 400 })

  const supabase = createServerClient()
  const query    = supabase.from('portfolio').delete().eq('user_id', user.id)
  const { error } = clearAll
    ? await query.gte('id', 0)
    : ticker
    ? await query.eq('ticker', ticker.toUpperCase())
    : await query.eq('id', id!)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
