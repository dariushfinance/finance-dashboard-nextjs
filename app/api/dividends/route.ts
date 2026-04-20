import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
}

export interface DividendInfo {
  ticker: string
  annualDPS: number        // annual dividend per share (USD)
  yield: number            // decimal (0.015 = 1.5%)
  currentPrice: number
  lastExDate: string | null
  frequency: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual' | 'None'
  payments: { date: string; amount: number }[]
}

// Infer frequency from payment gaps
function inferFrequency(payments: { date: string; amount: number }[]): DividendInfo['frequency'] {
  if (payments.length < 2) return 'None'
  const dates = payments.map(p => new Date(p.date).getTime()).sort((a, b) => a - b)
  const gaps  = []
  for (let i = 1; i < dates.length; i++) gaps.push((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24))
  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length
  if (avgGap <= 35)  return 'Monthly'
  if (avgGap <= 100) return 'Quarterly'
  if (avgGap <= 200) return 'Semi-Annual'
  return 'Annual'
}

async function fetchDividends(ticker: string): Promise<DividendInfo> {
  const empty: DividendInfo = { ticker, annualDPS: 0, yield: 0, currentPrice: 0, lastExDate: null, frequency: 'None', payments: [] }
  if (ticker === 'CASH' || ticker === 'USD') return empty

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1mo&range=2y&events=dividends`
    const res  = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(6000) })
    const data = await res.json()
    const result = data?.chart?.result?.[0]

    const currentPrice: number = (() => {
      const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? []
      return closes.filter(v => v != null).pop() ?? 0
    })()

    const divEvents: Record<string, { amount: number; date: number }> = result?.events?.dividends ?? {}
    const payments = Object.values(divEvents)
      .map(d => ({ date: new Date(d.date * 1000).toISOString().split('T')[0], amount: d.amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    if (!payments.length) return { ...empty, currentPrice }

    // Sum last 12 months
    const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 1)
    const last12 = payments.filter(p => new Date(p.date) >= cutoff)
    const annualDPS = last12.length > 0
      ? last12.reduce((s, p) => s + p.amount, 0)
      : payments.slice(-4).reduce((s, p) => s + p.amount, 0) // fallback: last 4

    const dividendYield = currentPrice > 0 ? annualDPS / currentPrice : 0
    const lastExDate    = payments[payments.length - 1]?.date ?? null
    const frequency     = inferFrequency(payments)

    return { ticker, annualDPS, yield: dividendYield, currentPrice, lastExDate, frequency, payments }
  } catch {
    return empty
  }
}

// Module-level cache — dividend info changes rarely; 6-hour TTL
const _cache = new Map<string, { data: DividendInfo; expiry: number }>()

export async function POST(req: NextRequest) {
  if (!await getAuthUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tickers }: { tickers: string[] } = await req.json()
  if (!tickers?.length) return NextResponse.json([])

  const uniq = [...new Set(tickers)].slice(0, 15)
  const results: DividendInfo[] = []

  for (let i = 0; i < uniq.length; i += 3) {
    const batch = uniq.slice(i, i + 3)
    const fetched = await Promise.all(
      batch.map(async t => {
        const c = _cache.get(t)
        if (c && Date.now() < c.expiry) return c.data
        const data = await fetchDividends(t)
        _cache.set(t, { data, expiry: Date.now() + 6 * 3_600_000 })
        return data
      })
    )
    results.push(...fetched)
    if (i + 3 < uniq.length) await new Promise(r => setTimeout(r, 100))
  }

  return NextResponse.json(results)
}
