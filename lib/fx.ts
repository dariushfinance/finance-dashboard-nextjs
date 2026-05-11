// Shared FX helpers — used by both /api/fx (route) and /api/portfolio (return calc)

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
}

// Module-level cache: CHF per 1 USD (e.g. 0.778 means $1 = 0.778 CHF)
let _chfCache: { rate: number; expiry: number } | null = null

export async function getCHFperUSD(): Promise<number> {
  if (_chfCache && Date.now() < _chfCache.expiry) return _chfCache.rate

  try {
    const url  = 'https://query1.finance.yahoo.com/v8/finance/chart/USDCHF=X?interval=1d&range=1d'
    const res  = await fetch(url, { headers: HEADERS, next: { revalidate: 900 } })
    const data = await res.json()
    const closes: (number | null)[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const last  = closes.filter(v => v != null).pop()
    if (last && last > 0) {
      _chfCache = { rate: last, expiry: Date.now() + 15 * 60_000 }
      return last
    }
  } catch {}

  // Fallback to last cached value if fetch fails
  return _chfCache?.rate ?? 0
}
