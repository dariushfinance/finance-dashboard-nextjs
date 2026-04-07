import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalPrices, calcSharpeAndVol } from '@/lib/yahoo'
import type { HistoryResult } from '@/types'

interface PositionInput {
  ticker: string
  shares: number
  buy_date: string
}

// POST /api/history
// Body: { positions: [{ ticker, shares, buy_date }] }
// Returns: { history: [{date, value}], sharpe, volatility }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const positions: PositionInput[] = body.positions ?? []
  if (!positions.length) return NextResponse.json({ history: [], sharpe: null, volatility: null })

  const earliestDate = positions
    .map((p) => p.buy_date)
    .sort()[0]

  // Fetch historical prices for each unique ticker
  const uniqueTickers = [...new Set(positions.map((p) => p.ticker))]
  const priceMap: Record<string, Record<string, number>> = {}

  await Promise.all(
    uniqueTickers.map(async (ticker) => {
      const rows = await getHistoricalPrices(ticker, earliestDate)
      priceMap[ticker] = {}
      rows.forEach((r) => { priceMap[ticker][r.date] = r.close })
    })
  )

  // Build daily total portfolio value (same logic as plot_portfolio_history_accurate)
  const allDates = new Set<string>()
  Object.values(priceMap).forEach((m) => Object.keys(m).forEach((d) => allDates.add(d)))
  const sortedDates = [...allDates].sort()

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

  const { sharpe, vol: volatility } = calcSharpeAndVol(history.map((h) => h.value))

  const result: HistoryResult = { history, sharpe, volatility }
  return NextResponse.json(result)
}
