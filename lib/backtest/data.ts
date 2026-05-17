// Historical-price loader for the backtest engine.
//
// Wraps lib/yahoo.ts getHistoricalPrices() with a disk-based JSON cache so the
// build-time backtest script and the test suite don't hammer Yahoo on every run.
//
// Cache layout: data/backtests-cache/<sanitized-ticker>__<from>__<to>.json
// TTL: 7 days. EOD-data refresh cadence — overkill to fetch more often.
//
// LOOKAHEAD-BIAS GUARD: this module is the only place backtest code reads prices.
// It returns the full series; the ENGINE is responsible for slicing to `< asOf`
// before passing into the optimizer. See lib/backtest/engine.ts.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getHistoricalPrices } from '../yahoo'

export interface DailyPrice { date: string; close: number }
export interface PriceFrame { [ticker: string]: DailyPrice[] }

const CACHE_DIR = path.join(process.cwd(), 'data', 'backtests-cache')
const CACHE_TTL_MS = 7 * 24 * 60 * 60_000

function sanitize(ticker: string): string {
  return ticker.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function cachePath(ticker: string, from: string, to: string): string {
  return path.join(CACHE_DIR, `${sanitize(ticker)}__${from}__${to}.json`)
}

async function readCache(file: string): Promise<DailyPrice[] | null> {
  try {
    const stat = await fs.stat(file)
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw) as DailyPrice[]
  } catch {
    return null
  }
}

async function writeCache(file: string, data: DailyPrice[]): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true })
  await fs.writeFile(file, JSON.stringify(data), 'utf8')
}

export interface LoadParams {
  tickers: string[]
  from:    string  // YYYY-MM-DD inclusive
  to:      string  // YYYY-MM-DD inclusive — clamps the upstream series
}

export async function loadHistoricalPrices({ tickers, from, to }: LoadParams): Promise<PriceFrame> {
  const out: PriceFrame = {}
  for (const ticker of tickers) {
    const file = cachePath(ticker, from, to)
    let series = await readCache(file)
    if (!series) {
      const raw = await getHistoricalPrices(ticker, from)
      series = raw.filter(p => p.date >= from && p.date <= to)
      await writeCache(file, series)
    }
    out[ticker] = series
  }
  return out
}

// Slice helper used by the engine — single chokepoint for the lookahead guard.
// Returns rows STRICTLY before asOf (date < asOf). Engine code must use this
// rather than reaching into the raw frame.
export function pricesBefore(frame: PriceFrame, ticker: string, asOf: string): DailyPrice[] {
  const series = frame[ticker] ?? []
  return series.filter(p => p.date < asOf)
}
