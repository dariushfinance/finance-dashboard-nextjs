import { NextResponse } from 'next/server'

// Yahoo Finance FX symbols and how to interpret them
// invert=false → price IS "target per 1 USD"
// invert=true  → price is "USD per 1 target" → we need 1/price
const PAIRS = [
  { code: 'CHF', sym: 'USDCHF=X', invert: false },
  { code: 'EUR', sym: 'EURUSD=X', invert: true  },
  { code: 'GBP', sym: 'GBPUSD=X', invert: true  },
  { code: 'JPY', sym: 'USDJPY=X', invert: false },
  { code: 'CAD', sym: 'USDCAD=X', invert: false },
  { code: 'SGD', sym: 'USDSGD=X', invert: false },
  { code: 'HKD', sym: 'USDHKD=X', invert: false },
  { code: 'AUD', sym: 'USDAUD=X', invert: false },
] as const

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
}

let _cache: { rates: Record<string, number>; expiry: number } | null = null

export async function GET() {
  if (_cache && Date.now() < _cache.expiry) {
    return NextResponse.json({ rates: _cache.rates })
  }

  const rates: Record<string, number> = { USD: 1 }

  await Promise.all(
    PAIRS.map(async ({ code, sym, invert }) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`
        const res  = await fetch(url, { headers: HEADERS, next: { revalidate: 900 } })
        const data = await res.json()
        const closes: (number | null)[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
        const last = closes.filter(v => v != null).pop()
        if (last) rates[code] = invert ? 1 / last : last
      } catch { /* leave currency out of rates if fetch fails */ }
    })
  )

  _cache = { rates, expiry: Date.now() + 15 * 60_000 }
  return NextResponse.json({ rates })
}
