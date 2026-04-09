import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalPrices } from '@/lib/yahoo'

// ── Math ──────────────────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 5) return 0
  const ap = a.slice(0, n)
  const bp = b.slice(0, n)
  const ma = mean(ap)
  const mb = mean(bp)
  let cov = 0, varA = 0, varB = 0
  for (let i = 0; i < n; i++) {
    const da = ap[i] - ma
    const db = bp[i] - mb
    cov  += da * db
    varA += da * da
    varB += db * db
  }
  const denom = Math.sqrt(varA * varB)
  return denom === 0 ? 0 : cov / denom
}

// ── Route ─────────────────────────────────────────────────────────────────────

// POST /api/correlation
// Body: { tickers: string[], days?: number }
// Returns: { tickers, matrix, avgOffDiagonal }
export async function POST(req: NextRequest) {
  const { tickers, days = 252 }: { tickers: string[]; days?: number } = await req.json()

  if (!tickers?.length) {
    return NextResponse.json({ tickers: [], matrix: [], avgOffDiagonal: null })
  }

  // ~1 calendar year back (trading days * 1.4 to account for weekends/holidays)
  const startDate = new Date(Date.now() - days * 1.4 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const priceArrays = await Promise.all(
    tickers.map((t) => getHistoricalPrices(t, startDate))
  )

  // Log returns per ticker, keyed by date
  const returnMaps: Map<string, number>[] = priceArrays.map((prices) => {
    const m = new Map<string, number>()
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1].close > 0 && prices[i].close > 0) {
        m.set(prices[i].date, Math.log(prices[i].close / prices[i - 1].close))
      }
    }
    return m
  })

  // Align: only dates present in ALL tickers
  const dateSets = returnMaps.map((m) => new Set(m.keys()))
  const commonDates = [...dateSets[0]]
    .filter((d) => dateSets.every((s) => s.has(d)))
    .sort()

  const aligned: number[][] = tickers.map((_, ti) =>
    commonDates.map((d) => returnMaps[ti].get(d) ?? 0)
  )

  const n = tickers.length
  const matrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1
      const r = parseFloat(pearson(aligned[i], aligned[j]).toFixed(4))
      return r
    })
  )

  // Average off-diagonal (diversification score)
  let sum = 0, count = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) { sum += matrix[i][j]; count++ }
    }
  }
  const avgOffDiagonal = count > 0 ? parseFloat((sum / count).toFixed(4)) : null

  return NextResponse.json({ tickers, matrix, avgOffDiagonal })
}
