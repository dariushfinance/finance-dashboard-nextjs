import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalPrices } from '@/lib/yahoo'
import { getAuthUser } from '@/lib/supabase'

// ── Math ──────────────────────────────────────────────────────────────────────

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 10) return 0                          // too few points → treat as uncorrelated
  const ap = a.slice(0, n), bp = b.slice(0, n)
  const ma = ap.reduce((s, v) => s + v, 0) / n
  const mb = bp.reduce((s, v) => s + v, 0) / n
  let cov = 0, varA = 0, varB = 0
  for (let i = 0; i < n; i++) {
    const da = ap[i] - ma, db = bp[i] - mb
    cov += da * db; varA += da * da; varB += db * db
  }
  const denom = Math.sqrt(varA * varB)
  return denom === 0 ? 0 : Math.max(-1, Math.min(1, cov / denom))
}

// Fetch tickers in batches to avoid Yahoo rate-limiting.
// A batch of 3 concurrent requests with 150 ms between batches keeps us
// well within Yahoo's unofficial ~5 req/s limit per IP.
async function fetchBatched(
  tickers: string[],
  startDate: string,
  batchSize = 3,
  delayMs = 150,
): Promise<{ ticker: string; data: { date: string; close: number }[] }[]> {
  const results: { ticker: string; data: { date: string; close: number }[] }[] = []
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize)
    const fetched = await Promise.all(
      batch.map(async t => ({ ticker: t, data: await getHistoricalPrices(t, startDate) }))
    )
    results.push(...fetched)
    if (i + batchSize < tickers.length) {
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  return results
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!await getAuthUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tickers: raw, days = 252 }: { tickers: string[]; days?: number } = await req.json()
  if (!raw?.length) return NextResponse.json({ tickers: [], matrix: [], avgOffDiagonal: null })

  // De-duplicate and hard-cap at 12 to stay within serverless time budget.
  // 12 tickers × 8 s timeout = worst case 32 s with 3-at-a-time batching;
  // with the module-level cache warm instances finish in < 2 s.
  const tickers = [...new Set(raw)].slice(0, 12)

  const startDate = new Date(Date.now() - days * 1.4 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const fetched = await fetchBatched(tickers, startDate)

  // Build return maps; drop tickers with < 30 trading days of data
  const valid: { ticker: string; returns: Map<string, number> }[] = []
  for (const { ticker, data } of fetched) {
    if (data.length < 30) continue                // not enough history
    const m = new Map<string, number>()
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1].close > 0 && data[i].close > 0) {
        m.set(data[i].date, Math.log(data[i].close / data[i - 1].close))
      }
    }
    if (m.size >= 30) valid.push({ ticker, returns: m })
  }

  if (valid.length < 2) {
    return NextResponse.json({
      tickers: valid.map(v => v.ticker),
      matrix: [],
      avgOffDiagonal: null,
      warning: 'Not enough historical data for correlation (need ≥ 2 tickers with ≥ 30 trading days)',
    })
  }

  // Intersect dates across all valid tickers
  const allSets = valid.map(v => new Set(v.returns.keys()))
  const commonDates = [...allSets[0]]
    .filter(d => allSets.every(s => s.has(d)))
    .sort()

  // If the intersection is thin (< 30), fall back to per-pair intersections below
  const usePairwise = commonDates.length < 30

  const n = valid.length
  const validTickers = valid.map(v => v.ticker)

  const matrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1
      if (!usePairwise) {
        // Use globally aligned dates for efficiency
        const ai = commonDates.map(d => valid[i].returns.get(d) ?? 0)
        const aj = commonDates.map(d => valid[j].returns.get(d) ?? 0)
        return parseFloat(pearson(ai, aj).toFixed(4))
      } else {
        // Per-pair intersection — more resilient when tickers have different listing dates
        const pairDates = [...valid[i].returns.keys()]
          .filter(d => valid[j].returns.has(d))
          .sort()
        const ai = pairDates.map(d => valid[i].returns.get(d)!)
        const aj = pairDates.map(d => valid[j].returns.get(d)!)
        return parseFloat(pearson(ai, aj).toFixed(4))
      }
    })
  )

  let sum = 0, count = 0
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (i !== j) { sum += matrix[i][j]; count++ }

  return NextResponse.json({
    tickers:         validTickers,
    matrix,
    avgOffDiagonal:  count > 0 ? parseFloat((sum / count).toFixed(4)) : null,
    commonDays:      usePairwise ? 'pairwise' : commonDates.length,
  })
}
