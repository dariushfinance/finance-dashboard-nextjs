import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
}

export interface IsinResult {
  isin:    string
  ticker:  string | null
  name:    string
  options: { symbol: string; name: string; exchange: string }[]
}

// GET /api/isin?isin=IE00B4K48X80
// Resolves ISIN to ticker via Yahoo Finance search.
// Returns best match + all alternatives (for different exchange listings).
export async function GET(req: NextRequest) {
  if (!await getAuthUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isin = req.nextUrl.searchParams.get('isin')?.trim().toUpperCase()
  if (!isin) return NextResponse.json({ error: 'isin required' }, { status: 400 })

  try {
    const url =
      `https://query1.finance.yahoo.com/v1/finance/search` +
      `?q=${encodeURIComponent(isin)}&quotesCount=10&newsCount=0`

    const res  = await fetch(url, { headers: HEADERS, cache: 'no-store' })
    const data = await res.json()

    const quotes = (data?.quotes ?? []).filter(
      (q: { quoteType?: string }) =>
        ['EQUITY', 'ETF', 'MUTUALFUND'].includes(q.quoteType ?? '')
    )

    if (!quotes.length) {
      return NextResponse.json({ isin, ticker: null, name: '', options: [] })
    }

    const options = quotes.map((q: {
      symbol?: string; shortname?: string; longname?: string; exchange?: string
    }) => ({
      symbol:   q.symbol   ?? '',
      name:     q.shortname ?? q.longname ?? '',
      exchange: q.exchange  ?? '',
    }))

    // Best pick: prefer main exchanges (XETRA, LSE, SIX, NASDAQ, NYSE) over grey markets
    const PREFERRED = ['GER', 'LSE', 'SWX', 'NMS', 'NYQ', 'PCX', 'AMS', 'EPA']
    const best =
      options.find((o: { exchange: string }) => PREFERRED.includes(o.exchange)) ?? options[0]

    return NextResponse.json({
      isin,
      ticker: best.symbol,
      name:   best.name,
      options,
    } satisfies IsinResult)
  } catch {
    return NextResponse.json({ isin, ticker: null, name: '', options: [] })
  }
}
