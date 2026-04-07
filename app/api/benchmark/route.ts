import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalPrices, calcBetaAlpha } from '@/lib/yahoo'
import type { BenchmarkResult } from '@/types'

interface PositionInput {
  ticker: string
  shares: number
  buy_date: string
}

// POST /api/benchmark
// Body: { positions: [{ ticker, shares, buy_date }] }
// Returns: { data: [{date, portfolio, sp500}], beta, alpha }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const positions: PositionInput[] = body.positions ?? []
  if (!positions.length) return NextResponse.json({ data: [], beta: null, alpha: null })

  const earliestDate = positions.map((p) => p.buy_date).sort()[0]
  const uniqueTickers = [...new Set(positions.map((p) => p.ticker))]

  // Fetch S&P 500 and all portfolio tickers
  const [sp500Rows, ...tickerRows] = await Promise.all([
    getHistoricalPrices('^GSPC', earliestDate),
    ...uniqueTickers.map((t) => getHistoricalPrices(t, earliestDate)),
  ])

  const sp500Map: Record<string, number> = {}
  sp500Rows.forEach((r) => { sp500Map[r.date] = r.close })

  const priceMap: Record<string, Record<string, number>> = {}
  uniqueTickers.forEach((ticker, i) => {
    priceMap[ticker] = {}
    tickerRows[i].forEach((r) => { priceMap[ticker][r.date] = r.close })
  })

  // Combine on dates where S&P 500 exists
  const dates = Object.keys(sp500Map).sort()
  const rawData = dates.map((date) => {
    let portValue = 0
    for (const pos of positions) {
      const buyDate = pos.buy_date.split('T')[0]
      if (date < buyDate) continue
      const price = priceMap[pos.ticker]?.[date]
      if (price != null) portValue += price * pos.shares
    }
    return { date, portValue, sp500: sp500Map[date] }
  }).filter((d) => d.portValue > 0)

  if (rawData.length < 2) return NextResponse.json({ data: [], beta: null, alpha: null })

  // Normalize to 100 (same as benchmark.py)
  const startPort = rawData[0].portValue
  const startSP = rawData[0].sp500
  const normalized = rawData.map((d) => ({
    date: d.date,
    portfolio: (d.portValue / startPort) * 100,
    sp500: (d.sp500 / startSP) * 100,
    _portValue: d.portValue,
    _sp500: d.sp500,
  }))

  // Beta & Alpha from daily returns
  const portReturns: number[] = []
  const spReturns: number[] = []
  for (let i = 1; i < rawData.length; i++) {
    if (rawData[i - 1].portValue > 0)
      portReturns.push((rawData[i].portValue - rawData[i - 1].portValue) / rawData[i - 1].portValue)
    if (rawData[i - 1].sp500 > 0)
      spReturns.push((rawData[i].sp500 - rawData[i - 1].sp500) / rawData[i - 1].sp500)
  }

  const { beta, alpha } = calcBetaAlpha(portReturns, spReturns)

  const result: BenchmarkResult = {
    data: normalized.map(({ date, portfolio, sp500 }) => ({ date, portfolio, sp500 })),
    beta,
    alpha,
  }
  return NextResponse.json(result)
}
