// LOOKAHEAD-BIAS REGRESSION + cost-model + benchmark-sanity tests.
//
// The shift-by-one-day test is the canary: if the engine ever reads from
// the future, shifting the input series will not change the output.
// Do not weaken or skip that test.

import { describe, it, expect } from 'vitest'
import { runWalkForward, type WalkForwardParams } from './engine'
import type { PriceFrame } from './data'
import type { FxFrame } from './fx'
import { DEFAULT_COSTS, tradeCost, rebalanceCost, entryCost } from './costs'

// ── Synthetic price frame helpers ───────────────────────────────────────

function buildSeries(
  startDate: string,
  days: number,
  driftPerDay: number,
  volPerDay: number,
  seed: number,
): { date: string; close: number }[] {
  // Deterministic pseudo-Gaussian via Box–Muller on a mulberry32 RNG
  let s = seed >>> 0
  const rng = () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const gauss = () => {
    const u1 = Math.max(rng(), 1e-12), u2 = rng()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }
  const out: { date: string; close: number }[] = []
  let d = new Date(startDate + 'T00:00:00Z')
  let price = 100
  for (let i = 0; i < days; i++) {
    // Skip weekends to match trading-day cadence loosely
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
      d.setUTCDate(d.getUTCDate() + 1)
    }
    price *= (1 + driftPerDay + volPerDay * gauss())
    out.push({ date: d.toISOString().split('T')[0], close: price })
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

function makeFrame(): PriceFrame {
  // 3 instruments × ~5 years of daily data
  return {
    AAA: buildSeries('2018-01-02', 1300, 0.0006, 0.012, 11),
    BBB: buildSeries('2018-01-02', 1300, 0.0004, 0.018, 22),
    CCC: buildSeries('2018-01-02', 1300, 0.0003, 0.008, 33),
  }
}

function baseParams(prices: PriceFrame): WalkForwardParams {
  return {
    startDate:       '2020-06-01',
    endDate:         '2022-12-01',
    rebalanceFreq:   'quarterly',
    instruments:     ['AAA', 'BBB', 'CCC'],
    startingWeights: { AAA: 1/3, BBB: 1/3, CCC: 1/3 },
    benchmarks:      ['equal-weight', 'starting-allocation'],
    prices,
    nMonteCarlo:     400,
    maxWeight:       0.50,   // feasible for n=3 (0.50 * 3 = 1.5 > 1)
    seed:            7,
  }
}

// ── Engine end-to-end ──────────────────────────────────────────────────

describe('runWalkForward — basic invariants', () => {
  const prices = makeFrame()
  const result = runWalkForward(baseParams(prices))

  it('produces multiple rebalances and a per-period record per rebalance', () => {
    expect(result.rebalances.length).toBeGreaterThanOrEqual(8)
    expect(result.perPeriod.length).toBe(result.rebalances.length)
  })

  it('model NAV series starts at 1.0 and stays positive', () => {
    expect(result.series.model.navs[0]).toBe(1.0)
    expect(result.series.model.navs.every(n => n > 0)).toBe(true)
  })

  it('benchmark NAV series exist for each requested benchmark', () => {
    expect(result.series.benchmarks['equal-weight']).toBeDefined()
    expect(result.series.benchmarks['starting-allocation']).toBeDefined()
  })

  it('model weights at each rebalance sum to ~1 and respect the cap (0.50)', () => {
    for (const r of result.rebalances) {
      const sum = Object.values(r.weights).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1, 3)
      for (const w of Object.values(r.weights)) {
        expect(w).toBeLessThanOrEqual(0.50 + 1e-6)
      }
    }
  })

  it('reduces to uniform allocation when the requested cap is infeasible', () => {
    const prices = makeFrame()
    // n=3, cap=0.30: 0.30 * 3 = 0.90 < 1 → only the uniform portfolio is feasible
    const result = runWalkForward({ ...baseParams(prices), maxWeight: 0.30 })
    for (const r of result.rebalances) {
      for (const w of Object.values(r.weights)) {
        expect(w).toBeCloseTo(1 / 3, 6)
      }
    }
  })
})

// ── LOOKAHEAD-BIAS GUARD ───────────────────────────────────────────────
// Shift every price series forward by 1 trading day. If the engine were
// peeking at future prices, the output would not change. If it's clean,
// the mean Sharpe-delta vs equal-weight benchmark moves measurably.

describe('runWalkForward — lookahead-bias guard', () => {
  // Weak guard: changing close values inside the lookback window MUST change
  // the optimizer output. Proves the engine actually consumes the prices.
  it('output changes when in-window prices are shifted by one trading day', () => {
    const base = makeFrame()
    const baseResult = runWalkForward(baseParams(base))

    // Shift: each trading day reports the next day's close (close[i] ← close[i+1]).
    // This perturbs every value the lookback window sees.
    const shifted: PriceFrame = {}
    for (const t of Object.keys(base)) {
      shifted[t] = base[t].slice(0, -1).map((p, i) => ({ date: p.date, close: base[t][i + 1].close }))
    }
    const shiftedResult = runWalkForward(baseParams(shifted))

    const baseDelta    = baseResult.aggregate.sharpeDeltaMean['equal-weight']
    const shiftedDelta = shiftedResult.aggregate.sharpeDeltaMean['equal-weight']
    expect(Math.abs(baseDelta - shiftedDelta)).toBeGreaterThan(1e-9)
  })

  // Strong guard: mutating ONLY prices that lie strictly after endDate must
  // NOT change any rebalance decision or any realized return. If this test
  // ever fails, the engine is reading from the future.
  it('output is identical when only post-endDate prices are mutated', () => {
    const base = makeFrame()
    const params = baseParams(base)
    const baseResult = runWalkForward(params)

    // Build a frame where every price strictly after endDate is multiplied
    // by a wild factor. A leaking engine would see this and change output.
    const future: PriceFrame = {}
    for (const t of Object.keys(base)) {
      future[t] = base[t].map(p =>
        p.date > params.endDate ? { date: p.date, close: p.close * 50 } : p)
    }
    const futureResult = runWalkForward({ ...params, prices: future })

    expect(futureResult.aggregate.sharpeDeltaMean['equal-weight'])
      .toBeCloseTo(baseResult.aggregate.sharpeDeltaMean['equal-weight'], 12)
    expect(futureResult.rebalances).toEqual(baseResult.rebalances)
  })
})

// ── Determinism (same seed → same result) ──────────────────────────────

describe('runWalkForward — determinism', () => {
  it('same seed produces identical rebalance weights', () => {
    const prices = makeFrame()
    const a = runWalkForward(baseParams(prices))
    const b = runWalkForward(baseParams(prices))
    expect(a.rebalances.length).toBe(b.rebalances.length)
    for (let i = 0; i < a.rebalances.length; i++) {
      expect(a.rebalances[i].weights).toEqual(b.rebalances[i].weights)
    }
  })
})

// ── FX conversion (T2 from ETF_MATH_AUDIT.md) ─────────────────────────
//
// Synthetic proof that the FX layer changes outcomes for mixed-currency portfolios
// while leaving pure-CHF portfolios unchanged.

describe('runWalkForward — FX conversion', () => {
  // Build a monotone FX series (no vol, predictable drift) so the test
  // is deterministic without depending on real Yahoo data.
  function buildFxSeries(
    startDate: string,
    days: number,
    startRate: number,
    dailyDrift: number,
  ): { date: string; close: number }[] {
    const out: { date: string; close: number }[] = []
    let d = new Date(startDate + 'T00:00:00Z')
    let rate = startRate
    for (let i = 0; i < days; i++) {
      while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1)
      rate *= (1 + dailyDrift)
      out.push({ date: d.toISOString().split('T')[0], close: rate })
      d.setUTCDate(d.getUTCDate() + 1)
    }
    return out
  }

  it('FX-corrected CHF NAV is lower than native when USD depreciates vs CHF', () => {
    // USD ticker trends up 0.10%/day (native), but USD depreciates −0.05%/day vs CHF.
    // CHF ticker is flat. Portfolio is 50/50.
    // → CHF investor's return on USD leg = (1.001)(0.9995) − 1 ≈ +0.05%/day instead of +0.10%.
    // Over ~3 years (750 trading days) the gap is several percent of NAV.
    const prices: PriceFrame = {
      CHF_FLAT: buildSeries('2018-01-02', 1000, 0.0000, 0.000, 77),   // flat
      USD_TREND: buildSeries('2018-01-02', 1000, 0.0010, 0.000, 88),  // +0.10%/day, no vol
    }

    // USDCHF starts at 0.92, drifts down 0.05%/day (USD weakens)
    const usdchf = buildFxSeries('2018-01-02', 1100, 0.92, -0.0005)
    const fxFrame: FxFrame = { USDCHF: usdchf, EURCHF: usdchf }

    const shared: WalkForwardParams = {
      startDate:       '2020-01-02',
      endDate:         '2022-12-01',
      rebalanceFreq:   'quarterly',
      instruments:     ['CHF_FLAT', 'USD_TREND'],
      startingWeights: { CHF_FLAT: 0.5, USD_TREND: 0.5 },
      benchmarks:      ['equal-weight'],
      prices,
      nMonteCarlo:     400,
      maxWeight:       0.60,
      seed:            42,
    }

    const withoutFx = runWalkForward(shared)
    const withFx    = runWalkForward({
      ...shared,
      currencyByTicker: { CHF_FLAT: 'CHF', USD_TREND: 'USD' },
      fx: fxFrame,
    })

    const navWithout = withoutFx.series.model.navs.at(-1)!
    const navWith    = withFx.series.model.navs.at(-1)!

    // FX drag must reduce final NAV
    expect(navWith).toBeLessThan(navWithout)
    // Gap must be economically meaningful (several %)
    expect(navWithout - navWith).toBeGreaterThan(0.05)
  })

  it('pure-CHF portfolio is unaffected by FX layer', () => {
    const prices: PriceFrame = makeFrame()   // synthetic CHF instruments

    const fxFrame: FxFrame = {
      USDCHF: buildFxSeries('2018-01-02', 1300, 0.90, -0.0005),
      EURCHF: buildFxSeries('2018-01-02', 1300, 1.02, -0.0003),
    }

    const shared = baseParams(prices)
    // All instruments declared as CHF → FX layer is a no-op
    const withFx = runWalkForward({
      ...shared,
      currencyByTicker: { AAA: 'CHF', BBB: 'CHF', CCC: 'CHF' },
      fx: fxFrame,
    })
    const withoutFx = runWalkForward(shared)

    const navWith    = withFx.series.model.navs.at(-1)!
    const navWithout = withoutFx.series.model.navs.at(-1)!
    expect(navWith).toBeCloseTo(navWithout, 8)
  })
})

// ── Cost model ─────────────────────────────────────────────────────────

describe('cost model', () => {
  it('tradeCost = commission + spread + stamp duty (foreign default 0.30%)', () => {
    // 'AAA' is not in the universe → falls back to foreign 0.30%
    expect(tradeCost('AAA')).toBeCloseTo(0.0050 + 0.0010 + 0.0030, 9)
  })

  it('entryCost(weights) sums per-ticker weighted cost', () => {
    const w = { AAA: 0.5, BBB: 0.5 }
    const expected = 0.5 * tradeCost('AAA') + 0.5 * tradeCost('BBB')
    expect(entryCost(w, DEFAULT_COSTS)).toBeCloseTo(expected, 9)
  })

  it('rebalanceCost = Σ |Δw| * per-ticker cost', () => {
    const prev = { AAA: 0.5, BBB: 0.5 }
    const next = { AAA: 0.7, BBB: 0.3 }
    const expected = 0.2 * tradeCost('AAA') + 0.2 * tradeCost('BBB')
    expect(rebalanceCost(prev, next, DEFAULT_COSTS)).toBeCloseTo(expected, 9)
  })

  it('rebalanceCost is zero when weights are unchanged', () => {
    const w = { AAA: 0.6, BBB: 0.4 }
    expect(rebalanceCost(w, w)).toBe(0)
  })

  it('CH-domiciled ticker (NESN.SW) has lower stamp duty than non-universe foreign default', () => {
    expect(tradeCost('NESN.SW')).toBeLessThan(tradeCost('AAA'))
  })
})
