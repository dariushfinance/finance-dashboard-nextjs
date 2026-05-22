// ────────────────────────────────────────────────────────────────────
// WALK-FORWARD BACKTEST ENGINE — LOOKAHEAD-BIAS GUARD
//
// At every rebalance date T, this engine MUST ONLY consume price data
// with timestamp < T. Any code path that reaches into the raw price
// frame using `>= T` is a bug.
//
// The single chokepoint is `pricesBefore()` in lib/backtest/data.ts.
// Engine code never indexes the raw `PriceFrame` directly; it always
// goes through `pricesBefore()`. A runtime assertion below verifies
// the slice is empty-or-strictly-before-T before passing to the
// optimizer. Do NOT weaken the assertion to "fix" a failing test —
// fix the call site instead.
//
// The companion test `engine.test.ts` shifts the input data by one day
// and asserts the output changes measurably. If you ever see those
// two runs produce identical aggregate Sharpe deltas, the engine is
// reading from the future.
// ────────────────────────────────────────────────────────────────────

import { pricesBefore, type PriceFrame } from './data'
import { DEFAULT_COSTS, type CostModel, rebalanceCost, entryCost } from './costs'
import { buildFxDeltaMaps, toChfReturn, type FxFrame, type FxPair } from './fx'

export type RebalanceFreq = 'monthly' | 'quarterly' | 'semi-annual'
export type BenchmarkId   = 'market-cap' | 'equal-weight' | 'starting-allocation'

export interface WalkForwardParams {
  startDate:       string                    // YYYY-MM-DD
  endDate:         string                    // YYYY-MM-DD
  rebalanceFreq:   RebalanceFreq
  instruments:     string[]
  startingWeights: Record<string, number>    // for 'starting-allocation' benchmark
  marketCapWeights?: Record<string, number>  // static weights used as 'market-cap' benchmark
  benchmarks:      BenchmarkId[]
  prices:          PriceFrame
  costs?:          CostModel
  lookbackDays?:   number                    // window of history used to estimate µ/Σ at each T (default 504 ≈ 2y)
  maxWeight?:      number                    // per-asset cap on Monte Carlo weights (default 0.30)
  nMonteCarlo?:    number                    // number of MC samples per rebalance (default 2000)
  seed?:           number                    // deterministic RNG seed
  // FX layer — omit for pure-CHF portfolios (concentrated SMI) or backwards-compat.
  // When supplied, every non-CHF return is converted to CHF before µ/Σ estimation
  // and NAV calculation: r_chf = (1 + r_native) × (1 + Δ_fx) − 1
  currencyByTicker?: Record<string, string>  // ticker → 'CHF' | 'USD' | 'EUR'
  fx?:               FxFrame                 // loaded by loadFxRates() in the build script
}

export interface RebalanceEvent {
  date:           string
  weights:        Record<string, number>     // model weights chosen at T
  turnover:       number                     // 0.5 * Σ|Δw|
  cost:           number                     // cost subtracted from NAV at T
}

export interface NavSeries {
  dates: string[]
  navs:  number[]   // starts at 1.0
}

export interface PeriodStats {
  date:               string                 // rebalance date (start of period)
  modelSharpe:        number
  modelVol:           number
  benchmarkSharpe:    Record<BenchmarkId, number>
  benchmarkVol:       Record<BenchmarkId, number>
}

export interface AggregateStats {
  nRebalances:               number
  // vs each benchmark
  sharpeDeltaMean:           Record<BenchmarkId, number>
  sharpeDeltaMedian:         Record<BenchmarkId, number>
  pctPeriodsModelWonSharpe:  Record<BenchmarkId, number>
  volDeltaMean:              Record<BenchmarkId, number>
  pctPeriodsModelReducedVol: Record<BenchmarkId, number>
  worstPeriod: {
    date:    string
    benchmark: BenchmarkId
    sharpeDelta: number
  }
}

export interface WalkForwardResult {
  rebalances:    RebalanceEvent[]
  perPeriod:     PeriodStats[]
  series:        { model: NavSeries; benchmarks: Record<BenchmarkId, NavSeries> }
  aggregate:     AggregateStats
  meta:          { params: WalkForwardParams; generatedAt: string }
}

// ── Deterministic RNG (mulberry32) ─────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Markowitz Monte Carlo (private copy — kept independent of the live
//    /api/frontier route so the engine never touches request paths). ──

function randomWeights(n: number, rng: () => number, cap: number): number[] {
  // Infeasible cap (cap × n < 1): only the uniform portfolio satisfies
  // sum=1 with all-weights-≤-cap. Return it directly.
  if (cap * n <= 1) {
    return Array(n).fill(1 / n)
  }
  // -log(U) ~ Exp(1) → divide by sum → uniform Dirichlet on the simplex
  const raw = Array.from({ length: n }, () => -Math.log(Math.max(rng(), 1e-12)))
  const sum = raw.reduce((a, b) => a + b, 0)
  const w = raw.map(v => v / sum)
  for (let iter = 0; iter < 2 * n; iter++) {
    let excess = 0, uncapped = 0
    for (let i = 0; i < n; i++) {
      if (w[i] > cap) { excess += w[i] - cap; w[i] = cap }
      else if (w[i] < cap) uncapped++
    }
    if (excess < 1e-12 || uncapped === 0) break
    const bump = excess / uncapped
    for (let i = 0; i < n; i++) if (w[i] < cap) w[i] = Math.min(cap, w[i] + bump)
  }
  return w
}

const RF_ANNUAL = 0.04

function maxSharpeWeights(
  tickers: string[],
  rets: number[][],   // [asset][time], daily simple returns over the lookback
  rng: () => number,
  cap: number,
  nMC: number,
): Record<string, number> {
  const n = tickers.length
  const T = rets[0]?.length ?? 0
  if (T < 30) {
    // Not enough history — fall back to equal weight
    const w = 1 / n
    return Object.fromEntries(tickers.map(t => [t, w]))
  }

  const means = rets.map(r => r.reduce((a, b) => a + b, 0) / T)
  const mu = means.map(m => m * 252)
  const cov: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      let s = 0
      for (let t = 0; t < T; t++) s += (rets[i][t] - means[i]) * (rets[j][t] - means[j])
      return (s / (T - 1)) * 252
    }))

  const portReturn = (w: number[]) => w.reduce((s, wi, i) => s + wi * mu[i], 0)
  const portVol = (w: number[]) => {
    let v = 0
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) v += w[i] * w[j] * cov[i][j]
    return Math.sqrt(Math.max(v, 0))
  }
  const portSharpe = (w: number[]) => {
    const vol = portVol(w)
    return vol > 0 ? (portReturn(w) - RF_ANNUAL) / vol : -Infinity
  }

  let best: { w: number[]; s: number } | null = null
  for (let k = 0; k < nMC; k++) {
    const w = randomWeights(n, rng, cap)
    const s = portSharpe(w)
    if (!best || s > best.s) best = { w, s }
  }
  const w = best!.w
  return Object.fromEntries(tickers.map((t, i) => [t, +w[i].toFixed(6)]))
}

// ── FX helpers ─────────────────────────────────────────────────────────

// Apply FX conversion for a single asset return on a single date.
// CHF assets: no-op. USD/EUR assets: compose with the daily FX move.
// If the pair's delta is missing for this date, falls back to 0 (no FX adjustment).
function applyFx(
  nativeReturn: number,
  ccy: string,
  date: string,
  fxMaps: Map<FxPair, Map<string, number>>,
): number {
  if (ccy === 'CHF' || fxMaps.size === 0) return nativeReturn
  const pair: FxPair = ccy === 'EUR' ? 'EURCHF' : 'USDCHF'
  const delta = fxMaps.get(pair)?.get(date) ?? 0
  return toChfReturn(nativeReturn, delta)
}

// ── Helpers ────────────────────────────────────────────────────────────

function nextRebalanceDate(d: Date, freq: RebalanceFreq): Date {
  const out = new Date(d)
  const months = freq === 'monthly' ? 1 : freq === 'quarterly' ? 3 : 6
  out.setUTCMonth(out.getUTCMonth() + months)
  return out
}

function isoDay(d: Date): string {
  return d.toISOString().split('T')[0]
}

function generateRebalanceDates(start: string, end: string, freq: RebalanceFreq): string[] {
  const dates: string[] = []
  let d = new Date(start + 'T00:00:00Z')
  const endD = new Date(end + 'T00:00:00Z')
  while (d <= endD) {
    dates.push(isoDay(d))
    d = nextRebalanceDate(d, freq)
  }
  return dates
}

// Daily returns matrix for a set of tickers, restricted to the lookback window
// strictly before `asOf` and intersected on common trading days.
// LOOKAHEAD-BIAS GUARD: every row of the returned matrix corresponds to a
// trading day with date < asOf. Assertion verifies.
// When fxMaps is non-empty, non-CHF returns are converted to CHF before
// the matrix is returned, so µ/Σ estimation runs on CHF-denominated returns.
function returnsMatrix(
  frame: PriceFrame,
  tickers: string[],
  asOf: string,
  lookbackDays: number,
  ccyMap: Record<string, string>,
  fxMaps: Map<FxPair, Map<string, number>>,
): { rets: number[][]; dates: string[] } {
  const perTicker = tickers.map(t => {
    const series = pricesBefore(frame, t, asOf).slice(-lookbackDays - 1)
    // LOOKAHEAD GUARD — runtime assertion, do not weaken
    if (series.some(p => p.date >= asOf)) {
      throw new Error(`[backtest] lookahead-bias guard tripped: ${t} has price on/after ${asOf}`)
    }
    const m = new Map<string, number>()
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1].close, curr = series[i].close
      if (prev > 0 && curr > 0) m.set(series[i].date, (curr - prev) / prev)
    }
    return m
  })
  if (perTicker.some(m => m.size === 0)) return { rets: tickers.map(() => []), dates: [] }
  const sets = perTicker.map(m => new Set(m.keys()))
  const commonDates = [...sets[0]].filter(d => sets.every(s => s.has(d))).sort()
  const rets = perTicker.map((m, i) => {
    const ccy = ccyMap[tickers[i]] ?? 'CHF'
    return commonDates.map(d => applyFx(m.get(d) ?? 0, ccy, d, fxMaps))
  })
  return { rets, dates: commonDates }
}

// Daily portfolio return over [from, to) given fixed weights and the price frame.
// `from` is exclusive (the rebalance day's price is the basis); returns start the
// next trading day. `to` is exclusive of the next rebalance day.
// Non-CHF returns are converted to CHF before weighting when fxMaps is non-empty.
function periodReturns(
  frame: PriceFrame,
  weights: Record<string, number>,
  from: string,
  to: string,
  ccyMap: Record<string, string>,
  fxMaps: Map<FxPair, Map<string, number>>,
): { dates: string[]; rets: number[] } {
  const tickers = Object.keys(weights).filter(t => weights[t] > 0)
  if (tickers.length === 0) return { dates: [], rets: [] }
  const perTicker = tickers.map(t => {
    const series = (frame[t] ?? []).filter(p => p.date >= from && p.date < to)
    const m = new Map<string, number>()
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1].close, curr = series[i].close
      if (prev > 0 && curr > 0) m.set(series[i].date, (curr - prev) / prev)
    }
    return m
  })
  const sets = perTicker.map(m => new Set(m.keys()))
  if (sets.length === 0 || sets[0].size === 0) return { dates: [], rets: [] }
  const commonDates = [...sets[0]].filter(d => sets.every(s => s.has(d))).sort()
  const rets = commonDates.map(d => {
    let r = 0
    for (let i = 0; i < tickers.length; i++) {
      const ccy = ccyMap[tickers[i]] ?? 'CHF'
      r += weights[tickers[i]] * applyFx(perTicker[i].get(d) ?? 0, ccy, d, fxMaps)
    }
    return r
  })
  return { dates: commonDates, rets }
}

function sharpeAndVol(rets: number[]): { sharpe: number; vol: number } {
  if (rets.length < 4) return { sharpe: 0, vol: 0 }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1)
  const std = Math.sqrt(variance)
  if (std === 0) return { sharpe: 0, vol: 0 }
  const rfDaily = RF_ANNUAL / 252
  return {
    sharpe: ((mean - rfDaily) / std) * Math.sqrt(252),
    vol:    std * Math.sqrt(252),
  }
}

function equalWeights(tickers: string[]): Record<string, number> {
  const w = 1 / tickers.length
  return Object.fromEntries(tickers.map(t => [t, w]))
}

function normalizeWeights(w: Record<string, number>): Record<string, number> {
  const sum = Object.values(w).reduce((a, b) => a + b, 0)
  if (sum <= 0) return w
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / sum]))
}

// ── Main entry ─────────────────────────────────────────────────────────

export function runWalkForward(params: WalkForwardParams): WalkForwardResult {
  const {
    startDate, endDate, rebalanceFreq, instruments,
    startingWeights, marketCapWeights, benchmarks, prices,
    costs = DEFAULT_COSTS,
    lookbackDays = 504,
    maxWeight = 0.30,
    nMonteCarlo = 2000,
    seed = 42,
  } = params

  const ccyMap  = params.currencyByTicker ?? {}
  const fxMaps  = params.fx ? buildFxDeltaMaps(params.fx) : new Map<FxPair, Map<string, number>>()

  const rng = mulberry32(seed)
  const rebalanceDates = generateRebalanceDates(startDate, endDate, rebalanceFreq)
  if (rebalanceDates.length < 2) {
    throw new Error('[backtest] need at least 2 rebalance dates between startDate and endDate')
  }

  const startNorm   = normalizeWeights(startingWeights)
  const equalW      = equalWeights(instruments)
  const mcapW       = marketCapWeights ? normalizeWeights(marketCapWeights) : startNorm  // fallback

  const benchmarkWeightsAt = (b: BenchmarkId): Record<string, number> => {
    switch (b) {
      case 'market-cap':          return mcapW
      case 'equal-weight':        return equalW
      case 'starting-allocation': return startNorm
    }
  }

  // State
  const rebalances: RebalanceEvent[] = []
  const perPeriod:  PeriodStats[]    = []
  const modelNav     = { dates: [startDate], navs: [1.0] }
  const benchNavs: Record<BenchmarkId, NavSeries> = {} as any
  for (const b of benchmarks) benchNavs[b] = { dates: [startDate], navs: [1.0] }

  let prevModelWeights: Record<string, number> = {}
  const prevBenchWeights: Record<BenchmarkId, Record<string, number>> = {} as any
  for (const b of benchmarks) prevBenchWeights[b] = {}

  for (let i = 0; i < rebalanceDates.length - 1; i++) {
    const T = rebalanceDates[i]
    const nextT = rebalanceDates[i + 1]

    // Choose model weights from history strictly before T
    const { rets } = returnsMatrix(prices, instruments, T, lookbackDays, ccyMap, fxMaps)
    const modelWeights = maxSharpeWeights(instruments, rets, rng, maxWeight, nMonteCarlo)

    // Apply rebalance cost
    const turnover = (() => {
      const tickers = new Set([...Object.keys(prevModelWeights), ...Object.keys(modelWeights)])
      let s = 0
      for (const t of tickers) s += Math.abs((modelWeights[t] ?? 0) - (prevModelWeights[t] ?? 0))
      return s / 2
    })()
    const cost = i === 0
      ? entryCost(modelWeights, costs)
      : rebalanceCost(prevModelWeights, modelWeights, costs)
    const lastModelNav = modelNav.navs[modelNav.navs.length - 1] * (1 - cost)

    rebalances.push({ date: T, weights: modelWeights, turnover, cost })

    // Realised returns over [T, nextT)
    const modelPeriod = periodReturns(prices, modelWeights, T, nextT, ccyMap, fxMaps)
    let nav = lastModelNav
    for (let j = 0; j < modelPeriod.rets.length; j++) {
      nav *= (1 + modelPeriod.rets[j])
      modelNav.dates.push(modelPeriod.dates[j])
      modelNav.navs.push(nav)
    }

    // Per-period stats
    const mStat = sharpeAndVol(modelPeriod.rets)
    const benchmarkSharpe: Record<BenchmarkId, number> = {} as any
    const benchmarkVol:    Record<BenchmarkId, number> = {} as any

    for (const b of benchmarks) {
      const bWeights = benchmarkWeightsAt(b)
      const bCost = i === 0
        ? entryCost(bWeights, costs)
        : rebalanceCost(prevBenchWeights[b], bWeights, costs)
      const lastBNav = benchNavs[b].navs[benchNavs[b].navs.length - 1] * (1 - bCost)
      const bPeriod = periodReturns(prices, bWeights, T, nextT, ccyMap, fxMaps)
      let bn = lastBNav
      for (let j = 0; j < bPeriod.rets.length; j++) {
        bn *= (1 + bPeriod.rets[j])
        benchNavs[b].dates.push(bPeriod.dates[j])
        benchNavs[b].navs.push(bn)
      }
      const bStat = sharpeAndVol(bPeriod.rets)
      benchmarkSharpe[b] = bStat.sharpe
      benchmarkVol[b]    = bStat.vol
      prevBenchWeights[b] = bWeights
    }

    perPeriod.push({
      date: T,
      modelSharpe: mStat.sharpe,
      modelVol:    mStat.vol,
      benchmarkSharpe,
      benchmarkVol,
    })

    prevModelWeights = modelWeights
  }

  // ── Aggregate ────────────────────────────────────────────────────────
  const sharpeDeltaMean:           Record<BenchmarkId, number> = {} as any
  const sharpeDeltaMedian:         Record<BenchmarkId, number> = {} as any
  const pctPeriodsModelWonSharpe:  Record<BenchmarkId, number> = {} as any
  const volDeltaMean:              Record<BenchmarkId, number> = {} as any
  const pctPeriodsModelReducedVol: Record<BenchmarkId, number> = {} as any

  let worstPeriod = { date: '', benchmark: benchmarks[0], sharpeDelta: Infinity }

  for (const b of benchmarks) {
    const deltas = perPeriod.map(p => p.modelSharpe - p.benchmarkSharpe[b])
    const volDeltas = perPeriod.map(p => p.modelVol - p.benchmarkVol[b])
    const sorted = [...deltas].sort((a, b2) => a - b2)
    sharpeDeltaMean[b] = deltas.length ? deltas.reduce((a, b2) => a + b2, 0) / deltas.length : 0
    sharpeDeltaMedian[b] = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0
    pctPeriodsModelWonSharpe[b] = deltas.length ? deltas.filter(d => d > 0).length / deltas.length : 0
    volDeltaMean[b] = volDeltas.length ? volDeltas.reduce((a, b2) => a + b2, 0) / volDeltas.length : 0
    pctPeriodsModelReducedVol[b] = volDeltas.length ? volDeltas.filter(d => d < 0).length / volDeltas.length : 0

    for (let i = 0; i < deltas.length; i++) {
      if (deltas[i] < worstPeriod.sharpeDelta) {
        worstPeriod = { date: perPeriod[i].date, benchmark: b, sharpeDelta: deltas[i] }
      }
    }
  }

  return {
    rebalances,
    perPeriod,
    series: { model: modelNav, benchmarks: benchNavs },
    aggregate: {
      nRebalances: rebalances.length,
      sharpeDeltaMean,
      sharpeDeltaMedian,
      pctPeriodsModelWonSharpe,
      volDeltaMean,
      pctPeriodsModelReducedVol,
      worstPeriod,
    },
    meta: { params, generatedAt: new Date().toISOString() },
  }
}
