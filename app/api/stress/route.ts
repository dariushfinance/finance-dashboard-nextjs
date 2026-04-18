import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalPrices } from '@/lib/yahoo'
import { getAuthUser } from '@/lib/supabase'

const SCENARIOS = [
  { name: 'Dot-com Bust', start: '2000-03-10', end: '2002-10-09' },
  { name: 'GFC 2008–09',  start: '2007-10-09', end: '2009-03-09' },
  { name: 'COVID Crash',  start: '2020-02-19', end: '2020-04-07' },
  { name: '2022 Bear',    start: '2022-01-03', end: '2022-10-12' },
]

interface PositionInput {
  ticker: string
  shares: number
  current_price: number
}

function calcMaxDD(values: number[]): number {
  let peak = values[0], maxDD = 0
  for (const v of values) {
    if (v > peak) peak = v
    const dd = (peak - v) / peak
    if (dd > maxDD) maxDD = dd
  }
  return maxDD
}

// POST /api/stress
// Body: { positions: [{ ticker, shares, current_price }] }
export async function POST(req: NextRequest) {
  if (!await getAuthUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const positions: PositionInput[] = (body.positions ?? []).filter(
    (p: PositionInput) => p.current_price > 0
  )
  if (!positions.length) return NextResponse.json({ scenarios: [] })

  const uniqueTickers = [...new Set(positions.map((p) => p.ticker))]

  // Current portfolio weights by market value
  const totalValue = positions.reduce((s, p) => s + p.shares * p.current_price, 0)
  const weights: Record<string, number> = {}
  for (const pos of positions) {
    weights[pos.ticker] = (weights[pos.ticker] ?? 0) + (pos.shares * pos.current_price) / totalValue
  }

  // Fetch full history from earliest scenario start — one request per ticker,
  // then slice per scenario (avoids 4× the fetches)
  const EARLIEST = SCENARIOS[0].start
  const [spRows, ...tickerRows] = await Promise.all([
    getHistoricalPrices('^GSPC', EARLIEST),
    ...uniqueTickers.map((t) => getHistoricalPrices(t, EARLIEST)),
  ])

  const sp500Full: Record<string, number> = {}
  spRows.forEach((r) => { sp500Full[r.date] = r.close })

  const pricesFull: Record<string, Record<string, number>> = {}
  uniqueTickers.forEach((ticker, i) => {
    pricesFull[ticker] = {}
    tickerRows[i].forEach((r) => { pricesFull[ticker][r.date] = r.close })
  })

  const scenarios = SCENARIOS.map((scenario) => {
    const dates = Object.keys(sp500Full)
      .filter((d) => d >= scenario.start && d <= scenario.end)
      .sort()

    if (dates.length < 5) return null

    const missingTickers = uniqueTickers.filter(
      (t) => !Object.keys(pricesFull[t]).some((d) => d >= scenario.start && d <= scenario.end)
    )

    const portReturns: number[] = []
    const spReturns: number[]   = []

    for (let i = 1; i < dates.length; i++) {
      const prev = dates[i - 1]
      const curr = dates[i]

      let portDay = 0
      for (const ticker of uniqueTickers) {
        const p0 = pricesFull[ticker][prev]
        const p1 = pricesFull[ticker][curr]
        // Tickers with no data for this period contribute 0 return (treated as cash)
        if (p0 && p1) portDay += weights[ticker] * (p1 - p0) / p0
      }
      portReturns.push(portDay)

      const sp0 = sp500Full[prev], sp1 = sp500Full[curr]
      spReturns.push(sp0 && sp1 ? (sp1 - sp0) / sp0 : 0)
    }

    // Build cumulative index (both start at 100)
    let portIdx = 100, spIdx = 100
    const all = [{ date: dates[0], portfolio: 100, sp500: 100 }]
    for (let i = 0; i < portReturns.length; i++) {
      portIdx *= (1 + portReturns[i])
      spIdx   *= (1 + spReturns[i])
      all.push({ date: dates[i + 1], portfolio: +portIdx.toFixed(3), sp500: +spIdx.toFixed(3) })
    }

    // Downsample to ~80 points for chart payload
    const step = Math.max(1, Math.floor(all.length / 80))
    const data  = all.filter((_, i) => i % step === 0 || i === all.length - 1)

    return {
      name:       scenario.name,
      start:      scenario.start,
      end:        scenario.end,
      portReturn: (all[all.length - 1].portfolio - 100) / 100,
      spReturn:   (all[all.length - 1].sp500 - 100) / 100,
      portMaxDD:  calcMaxDD(all.map((d) => d.portfolio)),
      spMaxDD:    calcMaxDD(all.map((d) => d.sp500)),
      data,
      missingTickers,
    }
  })

  return NextResponse.json({ scenarios: scenarios.filter(Boolean) })
}
