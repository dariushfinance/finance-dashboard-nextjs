// Forward-fill helper for Portfolio Value History.
//
// Why this exists: the value chart is built on the UNION of every ticker's
// trading days. Exchanges have different holiday calendars (e.g. SIX/Xetra are
// closed on Easter Monday while the NYSE is open). Without forward-fill, a
// position whose exchange is closed on a given union date has no price entry
// and was silently valued at 0 — producing a phantom single-day cliff that
// recovered the next day. See docs/HISTORY_BUG_AUDIT.md.
//
// Forward-fill carries each ticker's last-known close onto every union date
// AFTER its first observed bar. It never back-fills before the first bar, so a
// position bought before its ticker has any price data still reads as a genuine
// gap (handled by the caller, not here).

import type { FxCurrency } from './ticker-currency'

export type PriceMap = Record<string, Record<string, number>>

/**
 * Returns a new PriceMap where each ticker's last-known close is carried forward
 * onto every date in `sortedDates` that falls on or after the ticker's first
 * observed bar. Dates before a ticker's first bar are left absent.
 *
 * @param priceMap   raw per-ticker { date: close } maps (sparse)
 * @param sortedDates ascending union of all dates to fill onto
 */
export function forwardFillPriceMap(priceMap: PriceMap, sortedDates: string[]): PriceMap {
  const filled: PriceMap = {}
  for (const ticker of Object.keys(priceMap)) {
    const raw = priceMap[ticker]
    const out: Record<string, number> = {}
    let last: number | null = null
    for (const date of sortedDates) {
      const px = raw[date]
      if (px != null) last = px
      if (last != null) out[date] = last // only after first observed bar
    }
    filled[ticker] = out
  }
  return filled
}

// Historical FX rates expressed as CHF per 1 unit of the foreign currency,
// already forward-filled onto the same date grid as the price maps.
export interface FxFilled {
  USD?: Record<string, number>
  EUR?: Record<string, number>
}

// Spot fallback (CHF per 1 unit) used only when a historical rate is missing
// for a date — never default to 1.0, which would silently misvalue positions.
export interface FxSpot {
  USD: number
  EUR: number
}

/**
 * Converts a forward-filled native-currency price map into CHF.
 *
 * For each ticker/date: CHF price = native × rate, where rate is the day's
 * historical FX (CHF per foreign unit), falling back to the spot rate when the
 * historical series has no value for that date. CHF-quoted tickers use rate 1.
 *
 * If no usable rate exists (historical missing AND spot ≤ 0), the entry is
 * omitted — the caller treats a missing CHF price as a genuine data gap rather
 * than inventing a 1.0 rate. See docs/HISTORY_BUG_AUDIT.md §FX.
 */
export function toChfPriceMap(
  nativeFilled: PriceMap,
  fxFilled: FxFilled,
  spot: FxSpot,
  currencyOf: (ticker: string) => FxCurrency,
  sortedDates: string[]
): PriceMap {
  const out: PriceMap = {}
  for (const ticker of Object.keys(nativeFilled)) {
    const ccy = currencyOf(ticker)
    const native = nativeFilled[ticker]
    const series: Record<string, number> = {}
    for (const date of sortedDates) {
      const px = native[date]
      if (px == null) continue
      const rate = ccy === 'CHF' ? 1 : (fxFilled[ccy]?.[date] ?? spot[ccy])
      if (rate != null && rate > 0) series[date] = px * rate
    }
    out[ticker] = series
  }
  return out
}
