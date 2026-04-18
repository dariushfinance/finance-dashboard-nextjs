import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalPrices, RISK_FREE_ANNUAL } from '@/lib/yahoo'
import { getAuthUser } from '@/lib/supabase'

const N_PORTFOLIOS = 2000
const LOOKBACK_MS  = Math.round(504 * 1.4 * 24 * 60 * 60 * 1000)  // ~2 trading years

interface PositionInput {
  ticker: string
  shares: number
  current_price: number
}

// Uniform distribution on the simplex via Dirichlet (exponential trick)
function randomWeights(n: number): number[] {
  const raw = Array.from({ length: n }, () => -Math.log(Math.random()))
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => v / sum)
}

// POST /api/frontier
// Body: { positions: [{ ticker, shares, current_price }] }
export async function POST(req: NextRequest) {
  if (!await getAuthUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const positions: PositionInput[] = (body.positions ?? []).filter(
    (p: PositionInput) => p.current_price > 0
  )

  const uniqueTickers = [...new Set(positions.map((p) => p.ticker))]
  if (uniqueTickers.length < 2) {
    return NextResponse.json(
      { error: 'Need at least 2 different tickers for frontier analysis' },
      { status: 422 }
    )
  }

  const startDate = new Date(Date.now() - LOOKBACK_MS).toISOString().split('T')[0]
  const priceArrays = await Promise.all(uniqueTickers.map((t) => getHistoricalPrices(t, startDate)))

  // Simple daily return maps per ticker
  const returnMaps = priceArrays.map((prices) => {
    const m = new Map<string, number>()
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1].close > 0 && prices[i].close > 0)
        m.set(prices[i].date, (prices[i].close - prices[i - 1].close) / prices[i - 1].close)
    }
    return m
  })

  // Align on dates present in ALL tickers
  const dateSets = returnMaps.map((m) => new Set(m.keys()))
  const commonDates = [...dateSets[0]]
    .filter((d) => dateSets.every((s) => s.has(d)))
    .sort()

  if (commonDates.length < 60) {
    return NextResponse.json(
      { error: 'Not enough shared price history (need 60+ common trading days)' },
      { status: 422 }
    )
  }

  const n = uniqueTickers.length
  const T = commonDates.length

  // Returns matrix: rets[asset][time]
  const rets: number[][] = uniqueTickers.map((_, i) =>
    commonDates.map((d) => returnMaps[i].get(d) ?? 0)
  )

  // Annualized expected returns
  const mu = rets.map((r) => (r.reduce((a, b) => a + b, 0) / T) * 252)

  // Annualized sample covariance matrix
  const means = rets.map((r) => r.reduce((a, b) => a + b, 0) / T)
  const cov: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      let s = 0
      for (let t = 0; t < T; t++) s += (rets[i][t] - means[i]) * (rets[j][t] - means[j])
      return (s / (T - 1)) * 252  // annualised
    })
  )

  const portReturn = (w: number[]) => w.reduce((s, wi, i) => s + wi * mu[i], 0)
  const portVol    = (w: number[]) => {
    let v = 0
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) v += w[i] * w[j] * cov[i][j]
    return Math.sqrt(Math.max(v, 0))
  }
  const portSharpe = (w: number[]) => {
    const vol = portVol(w)
    return vol > 0 ? (portReturn(w) - RISK_FREE_ANNUAL) / vol : 0
  }

  // Monte Carlo
  const mc = Array.from({ length: N_PORTFOLIOS }, () => {
    const w = randomWeights(n)
    return { w, er: portReturn(w), vol: portVol(w), sharpe: portSharpe(w) }
  })

  const minVolEntry    = mc.reduce((b, p) => p.vol    < b.vol    ? p : b)
  const maxSharpeEntry = mc.reduce((b, p) => p.sharpe > b.sharpe ? p : b)

  const toPoint = (entry: (typeof mc)[0]) => ({
    weights:        Object.fromEntries(uniqueTickers.map((t, i) => [t, +entry.w[i].toFixed(4)])),
    expectedReturn: +entry.er.toFixed(6),
    volatility:     +entry.vol.toFixed(6),
    sharpe:         +entry.sharpe.toFixed(4),
  })

  // Current portfolio weights by market value
  const totalValue = positions.reduce((s, p) => s + p.shares * p.current_price, 0)
  const currentW   = uniqueTickers.map((ticker) => {
    const v = positions
      .filter((p) => p.ticker === ticker)
      .reduce((s, p) => s + p.shares * p.current_price, 0)
    return v / totalValue
  })

  return NextResponse.json({
    tickers: uniqueTickers,
    // Send every 4th portfolio (500 points) for chart rendering
    portfolios: mc
      .filter((_, i) => i % 4 === 0)
      .map((p) => ({ expectedReturn: +p.er.toFixed(4), volatility: +p.vol.toFixed(4), sharpe: +p.sharpe.toFixed(3) })),
    minVol:    toPoint(minVolEntry),
    maxSharpe: toPoint(maxSharpeEntry),
    current: {
      weights:        Object.fromEntries(uniqueTickers.map((t, i) => [t, +currentW[i].toFixed(4)])),
      expectedReturn: +portReturn(currentW).toFixed(6),
      volatility:     +portVol(currentW).toFixed(6),
      sharpe:         +portSharpe(currentW).toFixed(4),
    },
  })
}
