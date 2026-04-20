import { NextResponse } from 'next/server'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
}

export interface MarketQuote {
  symbol: string
  name: string
  price: number
  change: number      // absolute $
  changePct: number   // %
  volume?: number
  category: string
}

const MARKET_TICKERS = {
  indices:    ['SPY', 'QQQ', 'DIA', 'IWM', 'VT'],
  sectors:    ['XLK', 'XLF', 'XLV', 'XLE', 'XLI', 'XLP', 'XLU', 'XLC', 'XLRE', 'XLB'],
  bonds:      ['TLT', 'IEF', 'LQD', 'HYG', 'BND'],
  commodities:['GLD', 'SLV', 'USO', 'DJP'],
  crypto:     ['BTC-USD', 'ETH-USD'],
  global:     ['EFA', 'EEM', 'EWL', 'EWG', 'EWJ'],
}

const ALL_SYMBOLS = Object.values(MARKET_TICKERS).flat()

let _cache: { data: Record<string, MarketQuote[]>; expiry: number } | null = null

export async function GET() {
  if (_cache && Date.now() < _cache.expiry) return NextResponse.json(_cache.data)

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ALL_SYMBOLS.join(',')}&fields=regularMarketPrice,regularMarketPreviousClose,regularMarketChange,regularMarketChangePercent,regularMarketVolume,shortName,longName`
    const res  = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    const json = await res.json()
    const quotes: Record<string, {
      symbol: string; shortName?: string; longName?: string
      regularMarketPrice?: number; regularMarketPreviousClose?: number
      regularMarketChange?: number; regularMarketChangePercent?: number
      regularMarketVolume?: number
    }> = {}

    for (const q of json?.quoteResponse?.result ?? []) {
      quotes[q.symbol] = q
    }

    const result: Record<string, MarketQuote[]> = {}
    for (const [cat, syms] of Object.entries(MARKET_TICKERS)) {
      result[cat] = syms.map(sym => {
        const q = quotes[sym]
        return {
          symbol:    sym,
          name:      q?.shortName ?? q?.longName ?? sym,
          price:     q?.regularMarketPrice ?? 0,
          change:    q?.regularMarketChange ?? 0,
          changePct: q?.regularMarketChangePercent ?? 0,
          volume:    q?.regularMarketVolume,
          category:  cat,
        }
      }).filter(q => q.price > 0)
    }

    _cache = { data: result, expiry: Date.now() + 5 * 60_000 }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 })
  }
}
