/**
 * Yahoo Finance & Alpha Vantage helpers (server-side only)
 * Replicates the Python yfinance + Alpha Vantage fallback logic from portfolviz.py
 */

const YAHOO_BASE = 'https://query1.finance.yahoo.com'
const YAHOO_BASE2 = 'https://query2.finance.yahoo.com'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
}

// --- Current Price (Alpha Vantage → Yahoo fallback) ---
export async function getCurrentPrice(ticker: string): Promise<number> {
  // 1. Alpha Vantage
  const avKey = process.env.ALPHA_VANTAGE_KEY
  if (avKey) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${avKey}`
      const res = await fetch(url, { next: { revalidate: 300 } })
      const data = await res.json()
      if (data['Global Quote']?.['05. price']) {
        return parseFloat(data['Global Quote']['05. price'])
      }
    } catch {}
  }

  // 2. Yahoo Finance fallback
  try {
    const url = `${YAHOO_BASE}/v8/finance/chart/${ticker}?interval=1d&range=1d`
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } })
    const data = await res.json()
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close
    if (closes?.length) {
      const last = closes.filter((v: number | null) => v != null).pop()
      if (last) return last
    }
  } catch {}

  return 0
}

// --- Historical OHLC data (returns daily close prices) ---
export async function getHistoricalPrices(
  ticker: string,
  startDate: string // YYYY-MM-DD
): Promise<{ date: string; close: number }[]> {
  const startTs = Math.floor(new Date(startDate).getTime() / 1000)
  const endTs = Math.floor(Date.now() / 1000)

  try {
    const url = `${YAHOO_BASE}/v8/finance/chart/${ticker}?interval=1d&period1=${startTs}&period2=${endTs}`
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 3600 } })
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return []

    const timestamps: number[] = result.timestamp ?? []
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []

    const out: { date: string; close: number }[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        out.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          close: closes[i]!,
        })
      }
    }
    return out
  } catch {
    return []
  }
}

// --- Company fundamentals ---
// Two-source strategy:
//   1. v7/quote  → reliable, no auth, basic metrics (P/E, P/S, market cap)
//   2. v11/quoteSummary → extended metrics (margins, ROE, FCF) — works server-side without crumb
export async function getFundamentals(ticker: string) {
  try {
    const [basic, extended] = await Promise.allSettled([
      fetchBasicQuote(ticker),
      fetchQuoteSummary(ticker),
    ])

    const b = basic.status === 'fulfilled' ? basic.value : {}
    const e = extended.status === 'fulfilled' ? extended.value : {}

    return { ticker, ...b, ...e }
  } catch {
    return { ticker }
  }
}

async function fetchBasicQuote(ticker: string) {
  const url = `${YAHOO_BASE}/v7/finance/quote?symbols=${ticker}&fields=trailingPE,priceToSalesTrailing12Months,marketCap,freeCashflow`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'python-requests/2.31.0',
      Accept: 'application/json',
    },
    cache: 'no-store',
  })
  const data = await res.json()
  const q = data?.quoteResponse?.result?.[0]
  if (!q) return {}
  return {
    pe: q.trailingPE ?? null,
    ps: q.priceToSalesTrailing12Months ?? null,
  }
}

async function fetchQuoteSummary(ticker: string) {
  const modules = 'defaultKeyStatistics,financialData,summaryDetail'
  const url = `${YAHOO_BASE}/v11/finance/quoteSummary/${ticker}?modules=${modules}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'python-requests/2.31.0',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
  })
  const data = await res.json()
  const r = data?.quoteSummary?.result?.[0]
  if (!r) return {}

  const ks = r.defaultKeyStatistics ?? {}
  const fd = r.financialData ?? {}
  const sd = r.summaryDetail ?? {}

  const marketCap = sd.marketCap?.raw ?? null
  const fcf = fd.freeCashflow?.raw ?? null

  return {
    pe: sd.trailingPE?.raw ?? null,
    ev_ebitda: ks.enterpriseToEbitda?.raw ?? null,
    ps: sd.priceToSalesTrailing12Months?.raw ?? null,
    gross_margin: fd.grossMargins?.raw ?? null,
    net_margin: fd.profitMargins?.raw ?? null,
    roe: fd.returnOnEquity?.raw ?? null,
    debt_equity: fd.debtToEquity?.raw != null ? fd.debtToEquity.raw / 100 : null,
    rev_growth: fd.revenueGrowth?.raw ?? null,
    fcf_yield: fcf != null && marketCap != null && marketCap > 0 ? fcf / marketCap : null,
  }
}

// --- Helper: Sharpe Ratio & Volatility ---
export function calcSharpeAndVol(values: number[]): { sharpe: number | null; vol: number | null } {
  if (values.length < 5) return { sharpe: null, vol: null }

  const returns: number[] = []
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) returns.push((values[i] - values[i - 1]) / values[i - 1])
  }
  if (returns.length < 4) return { sharpe: null, vol: null }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length
  const std = Math.sqrt(variance)
  if (std === 0) return { sharpe: null, vol: null }

  const riskFreeDaily = 0.04 / 252
  const sharpe = ((mean - riskFreeDaily) / std) * Math.sqrt(252)
  const vol = std * Math.sqrt(252)

  return { sharpe, vol }
}

// --- Helper: Beta & Alpha ---
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
  const alpha = (meanP - beta * meanM) * 252

  return { beta, alpha }
}
