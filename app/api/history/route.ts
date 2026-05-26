import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalPrices, calcSharpeAndVol, calcTWRReturns, calcMaxDrawdown, calcSortino, calcVaR, calcCVaR } from '@/lib/yahoo'
import { forwardFillPriceMap, toChfPriceMap, type FxFilled } from '@/lib/history-fill'
import { tickerCurrency } from '@/lib/ticker-currency'
import { getCHFperUSD, getCHFperEUR } from '@/lib/fx'
import { getAuthUser, createServerClient } from '@/lib/supabase'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import type { HistoryResult } from '@/types'

// POST /api/history
// Fetches raw lots directly from DB — never uses consolidated client positions.
// Consolidated positions assign ALL shares to the earliest buy_date, which
// inflates TWR whenever a second (larger) lot is added later.
export async function POST(_req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = rateLimit(`history:${user.id}`, 20, 60_000)
  if (!limit.allowed) return rateLimitResponse(limit)

  const supabase = createServerClient()
  const { data: lots, error: dbError } = await supabase
    .from('portfolio')
    .select('ticker, shares, buy_date')
    .eq('user_id', user.id)
    .order('buy_date', { ascending: true })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const positions = (lots ?? []) as { ticker: string; shares: number; buy_date: string }[]
  if (!positions.length) return NextResponse.json({ history: [], twrReturns: [], sharpe: null, volatility: null, sortino: null, maxDrawdown: null, var95: null, cvar95: null, dataGaps: [] })

  const earliestDate = positions.map((p) => p.buy_date).sort()[0]
  const uniqueTickers = [...new Set(positions.map((p) => p.ticker))]
  const priceMap: Record<string, Record<string, number>> = {}

  await Promise.all(
    uniqueTickers.map(async (ticker) => {
      const rows = await getHistoricalPrices(ticker, earliestDate)
      priceMap[ticker] = {}
      rows.forEach((r) => { priceMap[ticker][r.date] = r.close })
    })
  )

  const allDates = new Set<string>()
  Object.values(priceMap).forEach((m) => Object.keys(m).forEach((d) => allDates.add(d)))
  const sortedDates = [...allDates].sort()

  // Forward-fill each ticker's last-known close onto the union date grid.
  // Prevents the phantom single-day cliff that occurred when one exchange was
  // closed (e.g. Easter Monday) but another was open — the closed-exchange
  // positions used to be valued at 0. See docs/HISTORY_BUG_AUDIT.md.
  const filledNative = forwardFillPriceMap(priceMap, sortedDates)

  // Convert every position to CHF before summing. Without this, USD/EUR/CHF
  // prices were added as if 1:1, mis-stating the CHF axis for mixed portfolios.
  // Historical FX is fetched per day (forward-filled across FX holidays); spot
  // is the last-resort fallback so we never default to a 1.0 rate.
  const currencies = new Set(uniqueTickers.map(tickerCurrency))
  const [usdRows, eurRows, spotUsd, spotEur] = await Promise.all([
    currencies.has('USD') ? getHistoricalPrices('USDCHF=X', earliestDate) : Promise.resolve([]),
    currencies.has('EUR') ? getHistoricalPrices('EURCHF=X', earliestDate) : Promise.resolve([]),
    currencies.has('USD') ? getCHFperUSD() : Promise.resolve(0),
    currencies.has('EUR') ? getCHFperEUR() : Promise.resolve(0),
  ])

  const fxRaw: FxFilled = { USD: {}, EUR: {} }
  usdRows.forEach((r) => { fxRaw.USD![r.date] = r.close })
  eurRows.forEach((r) => { fxRaw.EUR![r.date] = r.close })
  const fxFilled: FxFilled = {
    USD: forwardFillPriceMap({ USD: fxRaw.USD! }, sortedDates).USD,
    EUR: forwardFillPriceMap({ EUR: fxRaw.EUR! }, sortedDates).EUR,
  }

  const filledMap = toChfPriceMap(filledNative, fxFilled, { USD: spotUsd, EUR: spotEur }, tickerCurrency, sortedDates)

  // Absolute CHF value series — for chart display only.
  // A held position with no CHF price (missing price OR no usable FX rate) is a
  // genuine data gap, flagged for the UI rather than valued at 0.
  const dataGaps: string[] = []
  const history = sortedDates.map((date) => {
    let value = 0
    let gap = false
    for (const pos of positions) {
      const buyDate = pos.buy_date.split('T')[0]
      if (date < buyDate) continue
      const price = filledMap[pos.ticker]?.[date]
      if (price != null) value += price * pos.shares
      else gap = true
    }
    return gap ? { date, value, gap } : { date, value }
  }).filter((d) => d.value > 0)

  history.forEach((d) => { if (d.gap) dataGaps.push(d.date) })

  // TWR daily returns — capital injections excluded from return series.
  // Uses the CHF-converted, forward-filled map so returns reflect a CHF-based
  // investor (including FX moves) and holiday gaps don't drop positions.
  const twrReturns = calcTWRReturns(positions, filledMap, sortedDates)
  const retValues  = twrReturns.map((d) => d.ret)

  const { sharpe, vol: volatility } = calcSharpeAndVol(retValues)
  const sortino    = calcSortino(retValues)
  const maxDrawdown = calcMaxDrawdown(twrReturns)
  const var95      = calcVaR(retValues)
  const cvar95     = calcCVaR(retValues)

  const result: HistoryResult = { history, twrReturns, sharpe, volatility, sortino, maxDrawdown, var95, cvar95, dataGaps }
  return NextResponse.json(result)
}
