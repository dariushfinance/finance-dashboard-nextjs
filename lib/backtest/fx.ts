// FX-rate loader for the backtest engine.
//
// Fetches USDCHF=X and EURCHF=X daily history from Yahoo Finance using the
// same disk-cache pattern as lib/backtest/data.ts (7-day TTL, per-range file).
//
// The engine calls buildFxDeltaMaps() once per runWalkForward() to precompute
// a date → daily-%change map for O(1) lookup inside the tight per-day loops.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getHistoricalPrices } from '../yahoo'
import type { DailyPrice } from './data'

export type FxPair = 'USDCHF' | 'EURCHF'

export interface FxFrame {
  USDCHF: DailyPrice[]
  EURCHF: DailyPrice[]
}

const CACHE_DIR  = path.join(process.cwd(), 'data', 'backtests-cache')
const CACHE_TTL_MS = 7 * 24 * 60 * 60_000

const YAHOO_SYMBOL: Record<FxPair, string> = {
  USDCHF: 'USDCHF=X',
  EURCHF: 'EURCHF=X',
}

async function readCacheFile(file: string): Promise<DailyPrice[] | null> {
  try {
    const stat = await fs.stat(file)
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null
    return JSON.parse(await fs.readFile(file, 'utf8')) as DailyPrice[]
  } catch { return null }
}

async function writeCacheFile(file: string, data: DailyPrice[]): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true })
  await fs.writeFile(file, JSON.stringify(data), 'utf8')
}

export async function loadFxRates(from: string, to: string): Promise<FxFrame> {
  const pairs: FxPair[] = ['USDCHF', 'EURCHF']
  const out: Partial<FxFrame> = {}
  for (const pair of pairs) {
    const file = path.join(CACHE_DIR, `fx__${pair}__${from}__${to}.json`)
    let series = await readCacheFile(file)
    if (!series) {
      const raw = await getHistoricalPrices(YAHOO_SYMBOL[pair], from)
      series = raw.filter(p => p.date >= from && p.date <= to)
      await writeCacheFile(file, series)
    }
    out[pair] = series
  }
  return out as FxFrame
}

// Precompute date → daily_%change maps for both pairs.
// Called once per runWalkForward() call. Empty map = no FX conversion.
export function buildFxDeltaMaps(fx: FxFrame): Map<FxPair, Map<string, number>> {
  const result = new Map<FxPair, Map<string, number>>()
  for (const pair of (['USDCHF', 'EURCHF'] as const)) {
    const series = fx[pair] ?? []
    const m = new Map<string, number>()
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1].close
      const curr = series[i].close
      if (prev > 0 && curr > 0) m.set(series[i].date, (curr - prev) / prev)
    }
    result.set(pair, m)
  }
  return result
}

// r_chf = (1 + r_native) × (1 + Δ_fx) − 1
export function toChfReturn(nativeReturn: number, fxDelta: number): number {
  return (1 + nativeReturn) * (1 + fxDelta) - 1
}
