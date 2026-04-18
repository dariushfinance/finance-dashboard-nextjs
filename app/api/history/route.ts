import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalPrices, calcSharpeAndVol, calcTWRReturns, calcMaxDrawdown, calcSortino, calcVaR, calcCVaR } from '@/lib/yahoo'
import { getAuthUser } from '@/lib/supabase'
import type { HistoryResult } from '@/types'

interface PositionInput {
  ticker: string
  shares: number
  buy_date: string
}

// POST /api/history
// Body: { positions: [{ ticker, shares, buy_date }] }
// Returns: { history: [{date, value}], twrReturns: [{date, ret}], sharpe, volatility }
export async function POST(req: NextRequest) {
  if (!await getAuthUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const positions: PositionInput[] = body.positions ?? []
  if (!positions.length) return NextResponse.json({ history: [], twrReturns: [], sharpe: null, volatility: null, sortino: null, maxDrawdown: null, var95: null, cvar95: null })

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

  // Absolute dollar value series — for chart display only
  const history = sortedDates.map((date) => {
    let value = 0
    for (const pos of positions) {
      const buyDate = pos.buy_date.split('T')[0]
      if (date < buyDate) continue
      const price = priceMap[pos.ticker]?.[date]
      if (price != null) value += price * pos.shares
    }
    return { date, value }
  }).filter((d) => d.value > 0)

  // TWR daily returns — capital injections excluded from return series
  const twrReturns = calcTWRReturns(positions, priceMap, sortedDates)
  const retValues  = twrReturns.map((d) => d.ret)

  const { sharpe, vol: volatility } = calcSharpeAndVol(retValues)
  const sortino    = calcSortino(retValues)
  const maxDrawdown = calcMaxDrawdown(twrReturns)
  const var95      = calcVaR(retValues)
  const cvar95     = calcCVaR(retValues)

  const result: HistoryResult = { history, twrReturns, sharpe, volatility, sortino, maxDrawdown, var95, cvar95 }
  return NextResponse.json(result)
}
