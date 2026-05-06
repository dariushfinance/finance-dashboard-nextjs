/**
 * Yahoo Finance & Alpha Vantage helpers (server-side only)
 */

const YAHOO_BASE = 'https://query1.finance.yahoo.com'

// Annual risk-free rate used across all metrics (Sharpe, Sortino, Alpha).
// Update this when the Fed meaningfully changes rates.
export const RISK_FREE_ANNUAL = 0.04
export const RISK_FREE_DAILY  = RISK_FREE_ANNUAL / 252

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
}

// Module-level price cache — warm serverless instances reuse this across requests.
// 5-min TTL keeps prices fresh without burning AV's 25 req/day free limit.
const priceCache = new Map<string, { price: number; expiry: number }>()

// Module-level historical price cache — 60-min TTL.
// Prevents redundant Yahoo fetches when correlation + history tabs load close together,
// and avoids re-fetching all N tickers on every risk-tab visit within the same instance.
const histCache = new Map<string, { data: { date: string; close: number }[]; expiry: number }>()

// Exchange suffixes to try for European/Swiss tickers that Yahoo lists with a suffix.
// Tried in order: bare ticker first (US tickers resolve immediately), then SIX, London, Xetra, Paris, Amsterdam.
const EXCHANGE_SUFFIXES = ['', '.SW', '.L', '.DE', '.PA', '.AS']

async function fetchYahooPrice(sym: string): Promise<number> {
  try {
    const url = `${YAHOO_BASE}/v8/finance/chart/${sym}?interval=1d&range=1d`
    const res  = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } })
    const data = await res.json()
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close
    if (closes?.length) {
      const last = (closes as (number | null)[]).filter(v => v != null).pop()
      if (last) return last
    }
  } catch {}
  return 0
}

// --- Current Price (Yahoo first → Alpha Vantage fallback) ---
// Yahoo has no daily request limit; AV is reserved as fallback only.
// For tickers without an exchange suffix, tries .SW → .L → .DE → .PA → .AS
// so Swiss/European ETFs (VWRA, XDUE, IWMO, etc.) resolve automatically.
export async function getCurrentPrice(ticker: string): Promise<number> {
  const cached = priceCache.get(ticker)
  if (cached && Date.now() < cached.expiry) return cached.price

  const store = (price: number) => {
    priceCache.set(ticker, { price, expiry: Date.now() + 5 * 60_000 })
    return price
  }

  // If ticker already has a dot (e.g. ROG.SW), trust it as-is
  const candidates = ticker.includes('.')
    ? [ticker]
    : EXCHANGE_SUFFIXES.map(s => ticker + s)

  for (const sym of candidates) {
    const price = await fetchYahooPrice(sym)
    if (price > 0) return store(price)
  }

  // Alpha Vantage fallback (25 req/day on free tier — use sparingly)
  const avKey = process.env.ALPHA_VANTAGE_KEY
  if (avKey) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${avKey}`
      const res = await fetch(url, { next: { revalidate: 300 } })
      const data = await res.json()
      if (data['Global Quote']?.['05. price']) {
        return store(parseFloat(data['Global Quote']['05. price']))
      }
    } catch {}
  }

  return 0
}

// --- Historical OHLC data (returns daily close prices) ---
export async function getHistoricalPrices(
  ticker: string,
  startDate: string // YYYY-MM-DD
): Promise<{ date: string; close: number }[]> {
  const cacheKey = `${ticker}:${startDate}`
  const cached   = histCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) return cached.data

  const startTs = Math.floor(new Date(startDate).getTime() / 1000)
  const endTs   = Math.floor(Date.now() / 1000)

  try {
    // Include events so Yahoo populates the adjclose array (dividend-adjusted prices)
    const url = `${YAHOO_BASE}/v8/finance/chart/${ticker}?interval=1d&period1=${startTs}&period2=${endTs}&events=splits%2Cdividends`
    const res  = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) { histCache.set(cacheKey, { data: [], expiry: Date.now() + 60_000 }); return [] }

    const timestamps: number[] = result.timestamp ?? []
    // Prefer adjclose (dividend + split adjusted); fall back to raw close
    const adjCloses: (number | null)[] = result.indicators?.adjclose?.[0]?.adjclose ?? []
    const rawCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []
    const prices = adjCloses.length ? adjCloses : rawCloses

    const out: { date: string; close: number }[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (prices[i] != null) {
        out.push({
          date:  new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          close: prices[i]!,
        })
      }
    }
    histCache.set(cacheKey, { data: out, expiry: Date.now() + 60 * 60_000 })
    return out
  } catch {
    return []
  }
}

// --- Company fundamentals via Alpha Vantage OVERVIEW ---
// Yahoo Finance blocks Vercel IPs — Alpha Vantage works reliably server-side.
export async function getFundamentals(ticker: string) {
  const avKey = process.env.ALPHA_VANTAGE_KEY
  if (!avKey) return { ticker }

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${avKey}`
    const res = await fetch(url, { cache: 'no-store' })
    const d = await res.json()

    // Alpha Vantage returns { Information: '...' } or { Note: '...' } when rate limited
    if (!d.Symbol) {
      const rateLimited = typeof d.Information === 'string' || typeof d.Note === 'string'
      return { ticker, rateLimited }
    }

    const parse = (v: string | undefined) => {
      const n = parseFloat(v ?? '')
      return isNaN(n) ? null : n
    }

    const revenue = parse(d.RevenueTTM)
    const grossProfit = parse(d.GrossProfitTTM)
    const marketCap = parse(d.MarketCapitalization)
    // Alpha Vantage doesn't expose FCF directly — approximate via OperatingCashflow - CapEx
    // Not available in OVERVIEW, so we skip FCF Yield

    return {
      ticker,
      pe: parse(d.TrailingPE),
      ev_ebitda: parse(d.EVToEBITDA),
      ps: parse(d.PriceToSalesRatioTTM),
      gross_margin: revenue && grossProfit ? grossProfit / revenue : null,
      net_margin: parse(d.ProfitMargin),
      roe: parse(d.ReturnOnEquityTTM),
      debt_equity: null, // not in OVERVIEW endpoint
      rev_growth: parse(d.QuarterlyRevenueGrowthYOY),
      fcf_yield: null,
    }
  } catch {
    return { ticker }
  }
}

// --- Helper: TWR daily returns (strips capital injection distortion) ---
// For each consecutive date pair, return = performance of positions already held
// before that date, so new buys on date D are excluded from D's return.
export function calcTWRReturns(
  positions: { ticker: string; shares: number; buy_date: string }[],
  priceMap: Record<string, Record<string, number>>,
  sortedDates: string[]
): { date: string; ret: number }[] {
  const results: { date: string; ret: number }[] = []
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1]
    const currDate = sortedDates[i]
    let prevValue = 0
    let currValue = 0
    for (const pos of positions) {
      const buyDate = pos.buy_date.split('T')[0]
      if (buyDate > prevDate) continue  // not yet bought — exclude from this period
      const prev = priceMap[pos.ticker]?.[prevDate]
      const curr = priceMap[pos.ticker]?.[currDate]
      if (prev != null && curr != null) {
        prevValue += prev * pos.shares
        currValue += curr * pos.shares
      }
    }
    if (prevValue > 0) results.push({ date: currDate, ret: (currValue - prevValue) / prevValue })
  }
  return results
}

// --- Helper: Sharpe Ratio & Volatility (accepts pre-computed daily returns) ---
export function calcSharpeAndVol(returns: number[]): { sharpe: number | null; vol: number | null } {
  if (returns.length < 4) return { sharpe: null, vol: null }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1)  // sample variance
  const std = Math.sqrt(variance)
  if (std === 0) return { sharpe: null, vol: null }

  const riskFreeDaily = RISK_FREE_DAILY
  const sharpe = ((mean - riskFreeDaily) / std) * Math.sqrt(252)
  const vol = std * Math.sqrt(252)

  return { sharpe, vol }
}

// --- Helper: Beta & Alpha (Jensen's, correct Rf treatment) ---
export function calcBetaAlpha(
  portReturns: number[],
  mktReturns: number[]
): { beta: number | null; alpha: number | null } {
  const n = Math.min(portReturns.length, mktReturns.length)
  if (n < 5) return { beta: null, alpha: null }

  const p = portReturns.slice(0, n)
  const m = mktReturns.slice(0, n)

  const meanP = p.reduce((a, b) => a + b, 0) / n
  const meanM = m.reduce((a, b) => a + b, 0) / n

  let cov = 0, varM = 0
  for (let i = 0; i < n; i++) {
    cov += (p[i] - meanP) * (m[i] - meanM)
    varM += (m[i] - meanM) ** 2
  }

  if (varM === 0) return { beta: null, alpha: null }
  const beta = cov / varM

  // Jensen's Alpha: α = (Rp - Rf) - β(Rm - Rf), annualised
  const riskFreeDaily = RISK_FREE_DAILY
  const alpha = ((meanP - riskFreeDaily) - beta * (meanM - riskFreeDaily)) * 252

  return { beta, alpha }
}

// --- Helper: Max Drawdown from TWR returns (peak-to-trough of TWR index) ---
export function calcMaxDrawdown(twrReturns: { date: string; ret: number }[]): number | null {
  if (twrReturns.length < 2) return null
  let idx = 100, peak = 100, maxDD = 0
  for (const { ret } of twrReturns) {
    idx *= (1 + ret)
    if (idx > peak) peak = idx
    const dd = (peak - idx) / peak
    if (dd > maxDD) maxDD = dd
  }
  return maxDD
}

// --- Helper: Sortino Ratio (penalises downside deviation only) ---
export function calcSortino(returns: number[]): number | null {
  if (returns.length < 4) return null
  const rfDaily = RISK_FREE_DAILY
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  // Downside semi-deviation: sqrt(mean of squared shortfalls below Rf)
  const downsideVar = returns.reduce((a, r) => a + Math.min(r - rfDaily, 0) ** 2, 0) / returns.length
  const downsideStd = Math.sqrt(downsideVar)
  if (downsideStd === 0) return null
  return ((mean - rfDaily) / downsideStd) * Math.sqrt(252)
}

// --- Helper: Historical VaR — 1-day loss not exceeded at given confidence ---
export function calcVaR(returns: number[], confidence = 0.95): number | null {
  if (returns.length < 30) return null
  const sorted = [...returns].sort((a, b) => a - b)
  const idx = Math.max(Math.floor((1 - confidence) * sorted.length), 0)
  return -sorted[idx]  // positive = loss amount
}

// --- Helper: CVaR / Expected Shortfall — mean loss in the tail beyond VaR ---
export function calcCVaR(returns: number[], confidence = 0.95): number | null {
  if (returns.length < 30) return null
  const sorted = [...returns].sort((a, b) => a - b)
  const cutoff = Math.floor((1 - confidence) * sorted.length)
  const tail = sorted.slice(0, Math.max(cutoff, 1))
  return -(tail.reduce((a, b) => a + b, 0) / tail.length)
}

// --- Helper: Rolling Beta (sliding window over aligned return pairs) ---
export function calcRollingBeta(
  portReturns: { date: string; ret: number }[],
  spReturnMap: Map<string, number>,
  window = 63
): { date: string; beta: number }[] {
  const aligned: { date: string; p: number; m: number }[] = []
  for (const { date, ret } of portReturns) {
    const m = spReturnMap.get(date)
    if (m !== undefined) aligned.push({ date, p: ret, m })
  }

  const result: { date: string; beta: number }[] = []
  for (let i = window; i <= aligned.length; i++) {
    const slice = aligned.slice(i - window, i)
    const meanP = slice.reduce((a, d) => a + d.p, 0) / window
    const meanM = slice.reduce((a, d) => a + d.m, 0) / window
    let cov = 0, varM = 0
    for (const d of slice) {
      cov  += (d.p - meanP) * (d.m - meanM)
      varM += (d.m - meanM) ** 2
    }
    if (varM > 0) result.push({ date: slice[window - 1].date, beta: cov / varM })
  }
  return result
}
