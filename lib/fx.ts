// Shared FX helpers — used by both /api/fx (route) and /api/portfolio (return calc)

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
}

async function fetchYahooRate(sym: string): Promise<number> {
  try {
    const url  = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`
    const res  = await fetch(url, { headers: HEADERS, next: { revalidate: 900 } })
    const data = await res.json()
    const closes: (number | null)[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const last  = closes.filter(v => v != null).pop()
    return (last && last > 0) ? last : 0
  } catch { return 0 }
}

// Module-level caches: CHF per 1 USD, CHF per 1 EUR
let _usdCache: { rate: number; expiry: number } | null = null
let _eurCache: { rate: number; expiry: number } | null = null

export async function getCHFperUSD(): Promise<number> {
  if (_usdCache && Date.now() < _usdCache.expiry) return _usdCache.rate
  const rate = await fetchYahooRate('USDCHF=X')
  if (rate > 0) _usdCache = { rate, expiry: Date.now() + 15 * 60_000 }
  return rate || _usdCache?.rate || 0
}

// CHF per 1 EUR — used for EUR-exchange tickers (.AS, .DE, .PA, etc.)
export async function getCHFperEUR(): Promise<number> {
  if (_eurCache && Date.now() < _eurCache.expiry) return _eurCache.rate
  const rate = await fetchYahooRate('EURCHF=X')
  if (rate > 0) _eurCache = { rate, expiry: Date.now() + 15 * 60_000 }
  return rate || _eurCache?.rate || 0
}
