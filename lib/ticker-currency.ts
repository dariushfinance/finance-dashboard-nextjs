import { getTickerMeta } from './ticker-meta'

// Currency classification for the Portfolio Value History FX conversion.
//
// We can convert to CHF only for currencies we have an FX series for: USD and
// EUR (plus CHF = identity). Anything else (GBP, DKK, HKD, JPY, ...) is
// approximated as USD — its CHF axis will be slightly off but additive, which
// is strictly better than the old behaviour of summing raw foreign-currency
// prices as if 1:1 with CHF. See docs/HISTORY_BUG_AUDIT.md §FX.

export type FxCurrency = 'CHF' | 'EUR' | 'USD'

// SIX Swiss Exchange listings quote in CHF.
const CHF_SUFFIXES = ['.SW', '.VX', '.SWX']
// Euro-zone exchange listings quote in EUR.
const EUR_SUFFIXES = ['.DE', '.F', '.XETRA', '.AS', '.PA', '.BR', '.MI', '.MC', '.VI', '.LS', '.IR', '.HE', '.MA']

export function tickerCurrency(ticker: string): FxCurrency {
  const t = ticker.toUpperCase()

  // Exchange suffix is the most reliable signal — it reflects the actual
  // listing the user holds, which is what Yahoo prices in.
  if (CHF_SUFFIXES.some((s) => t.endsWith(s))) return 'CHF'
  if (EUR_SUFFIXES.some((s) => t.endsWith(s))) return 'EUR'

  // Crypto and FX pairs (e.g. BTC-USD) are priced in USD.
  if (t.endsWith('-USD')) return 'USD'

  // Fall back to static metadata for bare symbols (NESN → CHF, ASML → EUR, US → USD).
  const c = getTickerMeta(ticker).currency
  if (c === 'CHF') return 'CHF'
  if (c === 'EUR') return 'EUR'
  return 'USD' // USD, plus unsupported currencies approximated as USD
}
