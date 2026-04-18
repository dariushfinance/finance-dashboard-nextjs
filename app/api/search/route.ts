import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
}

export interface SearchQuote {
  symbol: string
  shortname: string
  exchange: string
  quoteType: string
}

// GET /api/search?q=apple
// Returns: { quotes: SearchQuote[] }
export async function GET(req: NextRequest) {
  if (!await getAuthUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 1) return NextResponse.json({ quotes: [] })

  try {
    const url =
      `https://query1.finance.yahoo.com/v1/finance/search` +
      `?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0` +
      `&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`

    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 60 } })
    const data = await res.json()

    const quotes: SearchQuote[] = (data?.quotes ?? [])
      .filter((q: { quoteType?: string }) =>
        ['EQUITY', 'ETF', 'MUTUALFUND', 'INDEX'].includes(q.quoteType ?? '')
      )
      .slice(0, 8)
      .map((q: { symbol?: string; shortname?: string; longname?: string; exchange?: string; quoteType?: string }) => ({
        symbol:    q.symbol    ?? '',
        shortname: q.shortname ?? q.longname ?? q.symbol ?? '',
        exchange:  q.exchange  ?? '',
        quoteType: q.quoteType ?? '',
      }))

    return NextResponse.json({ quotes })
  } catch {
    return NextResponse.json({ quotes: [] })
  }
}
