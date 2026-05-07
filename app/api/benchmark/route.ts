import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalPrices, calcBetaAlpha, calcTWRReturns, calcRollingBeta } from '@/lib/yahoo'
import { getAuthUser, createServerClient } from '@/lib/supabase'
import type { BenchmarkResult } from '@/types'

// POST /api/benchmark — fetches raw lots from DB, same reason as /api/history:
// consolidated positions assign all shares to the earliest buy_date, distorting TWR.
export async function POST(_req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: lots, error: dbError } = await supabase
    .from('portfolio')
    .select('ticker, shares, buy_date')
    .eq('user_id', user.id)
    .order('buy_date', { ascending: true })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const positions = (lots ?? []) as { ticker: string; shares: number; buy_date: string }[]
  if (!positions.length) return NextResponse.json({ data: [], beta: null, alpha: null, informationRatio: null, rollingBeta: [] })

  const earliestDate = positions.map((p) => p.buy_date).sort()[0]
  const uniqueTickers = [...new Set(positions.map((p) => p.ticker))]

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

  // Restrict to S&P 500 trading days; only keep dates after first position is active
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

  if (rawData.length < 2) return NextResponse.json({ data: [], beta: null, alpha: null, informationRatio: null, rollingBeta: [] })

  // TWR portfolio returns: each day's return uses only positions already held,
  // so capital injections (new buys) are excluded from the return series.
  const twrData = calcTWRReturns(positions, priceMap, rawData.map((d) => d.date))
  const twrRetMap = new Map(twrData.map((d) => [d.date, d.ret]))

  // Build TWR index (starts at 100) for chart — this is true investment performance
  let portTWRIndex = 100
  const startSP = rawData[0].sp500
  const normalized = rawData.map((d, i) => {
    if (i > 0) {
      const r = twrRetMap.get(d.date)
      if (r !== undefined) portTWRIndex *= (1 + r)
    }
    return {
      date: d.date,
      portfolio: parseFloat(portTWRIndex.toFixed(4)),
      sp500: parseFloat(((d.sp500 / startSP) * 100).toFixed(4)),
    }
  })

  // Align TWR portfolio returns with S&P 500 returns by date for Beta/Alpha
  const spReturnMap = new Map<string, number>()
  for (let i = 1; i < rawData.length; i++) {
    if (rawData[i - 1].sp500 > 0)
      spReturnMap.set(rawData[i].date, (rawData[i].sp500 - rawData[i - 1].sp500) / rawData[i - 1].sp500)
  }
  const alignedPort: number[] = []
  const alignedSP: number[] = []
  for (const { date, ret } of twrData) {
    const spRet = spReturnMap.get(date)
    if (spRet !== undefined) { alignedPort.push(ret); alignedSP.push(spRet) }
  }

  const { beta, alpha } = calcBetaAlpha(alignedPort, alignedSP)

  // Information Ratio = annualised mean active return / tracking error
  const activeReturns = alignedPort.map((r, i) => r - alignedSP[i])
  const meanActive = activeReturns.length
    ? activeReturns.reduce((a, b) => a + b, 0) / activeReturns.length
    : 0
  const trackingError = activeReturns.length > 1
    ? Math.sqrt(activeReturns.reduce((a, r) => a + (r - meanActive) ** 2, 0) / (activeReturns.length - 1))
    : 0
  const informationRatio = trackingError > 0 ? (meanActive / trackingError) * Math.sqrt(252) : null

  // Rolling Beta with 63-day window (≈ 3 months)
  const rollingBeta = calcRollingBeta(twrData, spReturnMap)

  const result: BenchmarkResult = { data: normalized, beta, alpha, informationRatio, rollingBeta }
  return NextResponse.json(result)
}
