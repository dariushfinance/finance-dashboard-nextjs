import { describe, it, expect } from 'vitest'
import {
  RISK_FREE_ANNUAL,
  RISK_FREE_DAILY,
  calcTWRReturns,
  calcSharpeAndVol,
  calcBetaAlpha,
  calcMaxDrawdown,
  calcSortino,
  calcVaR,
  calcCVaR,
  calcRollingBeta,
} from './yahoo'

const closeTo = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

describe('risk-free constants', () => {
  it('daily Rf equals annual / 252', () => {
    expect(RISK_FREE_DAILY).toBe(RISK_FREE_ANNUAL / 252)
  })
})

describe('calcTWRReturns', () => {
  it('returns simple period return when no capital injection', () => {
    const positions = [{ ticker: 'AAPL', shares: 10, buy_date: '2024-01-01' }]
    const priceMap = { AAPL: { '2024-01-02': 100, '2024-01-03': 110 } }
    const dates = ['2024-01-02', '2024-01-03']
    const out = calcTWRReturns(positions, priceMap, dates)
    expect(out).toHaveLength(1)
    expect(out[0].date).toBe('2024-01-03')
    expect(closeTo(out[0].ret, 0.10)).toBe(true)
  })

  it('excludes a position bought ON the start of a period (not yet held at prevDate)', () => {
    // AAPL held throughout; MSFT bought on 2024-01-03 should NOT distort the 01-02→01-03 return.
    const positions = [
      { ticker: 'AAPL', shares: 10, buy_date: '2024-01-01' },
      { ticker: 'MSFT', shares: 5,  buy_date: '2024-01-03' },
    ]
    const priceMap = {
      AAPL: { '2024-01-02': 100, '2024-01-03': 110 },
      MSFT: { '2024-01-02': 200, '2024-01-03': 220 },
    }
    const out = calcTWRReturns(positions, priceMap, ['2024-01-02', '2024-01-03'])
    expect(out).toHaveLength(1)
    // Should be pure AAPL return (10%) — MSFT is excluded because buy_date > prevDate
    expect(closeTo(out[0].ret, 0.10)).toBe(true)
  })

  it('includes a position once both endpoints fall after buy_date', () => {
    const positions = [
      { ticker: 'AAPL', shares: 10, buy_date: '2024-01-01' },
      { ticker: 'MSFT', shares: 5,  buy_date: '2024-01-03' },
    ]
    const priceMap = {
      AAPL: { '2024-01-03': 110, '2024-01-04': 121 }, // +10%
      MSFT: { '2024-01-03': 200, '2024-01-04': 210 }, // +5%
    }
    const out = calcTWRReturns(positions, priceMap, ['2024-01-03', '2024-01-04'])
    // Weighted: AAPL value 1100→1210 (+110), MSFT 1000→1050 (+50). Total 2100→2260. ret = 160/2100.
    expect(closeTo(out[0].ret, 160 / 2100, 1e-12)).toBe(true)
  })

  it('skips periods where prevValue is 0 (no holdings yet)', () => {
    const positions = [{ ticker: 'AAPL', shares: 10, buy_date: '2024-01-05' }]
    const priceMap = { AAPL: { '2024-01-02': 100, '2024-01-03': 110 } }
    const out = calcTWRReturns(positions, priceMap, ['2024-01-02', '2024-01-03'])
    expect(out).toHaveLength(0)
  })

  it('skips a position when one endpoint price is missing', () => {
    const positions = [{ ticker: 'AAPL', shares: 10, buy_date: '2024-01-01' }]
    const priceMap = { AAPL: { '2024-01-02': 100 } } // missing 01-03
    const out = calcTWRReturns(positions, priceMap, ['2024-01-02', '2024-01-03'])
    expect(out).toHaveLength(0)
  })

  it('handles buy_date with ISO timestamp suffix correctly', () => {
    const positions = [{ ticker: 'AAPL', shares: 1, buy_date: '2024-01-01T00:00:00Z' }]
    const priceMap = { AAPL: { '2024-01-02': 100, '2024-01-03': 105 } }
    const out = calcTWRReturns(positions, priceMap, ['2024-01-02', '2024-01-03'])
    expect(out).toHaveLength(1)
    expect(closeTo(out[0].ret, 0.05)).toBe(true)
  })
})

describe('calcSharpeAndVol', () => {
  it('returns null when fewer than 4 returns', () => {
    expect(calcSharpeAndVol([0.01, 0.02, -0.005])).toEqual({ sharpe: null, vol: null })
  })

  it('returns null when std is zero (constant returns)', () => {
    expect(calcSharpeAndVol([0.001, 0.001, 0.001, 0.001, 0.001])).toEqual({ sharpe: null, vol: null })
  })

  it('annualises vol with sqrt(252)', () => {
    // returns with hand-known std
    const returns = [0.01, -0.01, 0.02, -0.02, 0.015, -0.005, 0.0, 0.01]
    const { vol } = calcSharpeAndVol(returns)
    // sample std (n-1 denom)
    const n = returns.length
    const mean = returns.reduce((a, b) => a + b, 0) / n
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)
    const expected = Math.sqrt(variance) * Math.sqrt(252)
    expect(vol).not.toBeNull()
    expect(closeTo(vol!, expected, 1e-12)).toBe(true)
  })

  it('Sharpe = (mean - Rf_daily) / std * sqrt(252)', () => {
    const returns = [0.01, -0.005, 0.02, 0.0, 0.015, -0.01]
    const { sharpe } = calcSharpeAndVol(returns)
    const n = returns.length
    const mean = returns.reduce((a, b) => a + b, 0) / n
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)
    const std = Math.sqrt(variance)
    const expected = ((mean - RISK_FREE_DAILY) / std) * Math.sqrt(252)
    expect(closeTo(sharpe!, expected, 1e-12)).toBe(true)
  })

  it('Sharpe is positive when mean daily return exceeds Rf_daily', () => {
    // mean ~ 0.005/day = ~125% annual, well above 4% Rf
    const returns = [0.005, 0.006, 0.004, 0.005, 0.005, 0.004]
    const { sharpe } = calcSharpeAndVol(returns)
    expect(sharpe!).toBeGreaterThan(0)
  })
})

describe('calcBetaAlpha', () => {
  it('returns null when fewer than 5 aligned points', () => {
    expect(calcBetaAlpha([0.01, 0.02], [0.01, 0.015])).toEqual({ beta: null, alpha: null })
  })

  it('beta = 1 and alpha = 0 when portfolio mirrors market exactly', () => {
    const mkt = [0.01, -0.005, 0.02, -0.01, 0.015, 0.0, 0.008]
    const { beta, alpha } = calcBetaAlpha([...mkt], [...mkt])
    expect(closeTo(beta!, 1, 1e-12)).toBe(true)
    expect(closeTo(alpha!, 0, 1e-9)).toBe(true)
  })

  it('beta = 2 when portfolio returns are exactly 2x market', () => {
    const mkt = [0.01, -0.005, 0.02, -0.01, 0.015, 0.0, 0.008]
    const port = mkt.map(r => r * 2)
    const { beta } = calcBetaAlpha(port, mkt)
    expect(closeTo(beta!, 2, 1e-12)).toBe(true)
  })

  it('beta is negative when portfolio is anti-correlated', () => {
    const mkt = [0.01, -0.005, 0.02, -0.01, 0.015, 0.0, 0.008]
    const port = mkt.map(r => -r)
    const { beta } = calcBetaAlpha(port, mkt)
    expect(closeTo(beta!, -1, 1e-12)).toBe(true)
  })

  it('returns null beta when market variance is zero', () => {
    const mkt = [0.001, 0.001, 0.001, 0.001, 0.001, 0.001]
    const port = [0.01, -0.005, 0.02, -0.01, 0.015, 0.0]
    expect(calcBetaAlpha(port, mkt)).toEqual({ beta: null, alpha: null })
  })

  it('truncates to the shorter of the two series', () => {
    const mkt = [0.01, -0.005, 0.02, -0.01, 0.015, 0.0, 0.008, 0.003]
    const port = [0.02, -0.01, 0.04, -0.02, 0.03]
    const { beta } = calcBetaAlpha(port, mkt)
    // Should compute over n=5 (the shorter length)
    expect(beta).not.toBeNull()
  })

  it('Jensen alpha is annualised (× 252) and uses Rf', () => {
    // Construct: port = 2*mkt + 0.001 constant alpha per day
    const mkt = [0.01, -0.005, 0.02, -0.01, 0.015, 0.0, 0.008, 0.012, -0.003]
    const port = mkt.map(r => 2 * r + 0.001)
    const { beta, alpha } = calcBetaAlpha(port, mkt)
    expect(closeTo(beta!, 2, 1e-10)).toBe(true)
    // Per-day Jensen alpha = (meanP - Rf) - 2*(meanM - Rf) = (meanP - 2*meanM) + Rf
    const meanP = port.reduce((a, b) => a + b, 0) / port.length
    const meanM = mkt.reduce((a, b) => a + b, 0) / mkt.length
    const expectedDaily = (meanP - RISK_FREE_DAILY) - 2 * (meanM - RISK_FREE_DAILY)
    const expectedAnnual = expectedDaily * 252
    expect(closeTo(alpha!, expectedAnnual, 1e-9)).toBe(true)
  })
})

describe('calcMaxDrawdown', () => {
  it('returns null when fewer than 2 entries', () => {
    expect(calcMaxDrawdown([{ date: '2024-01-01', ret: 0.01 }])).toBeNull()
  })

  it('returns 0 for monotonically rising series', () => {
    const series = [0.01, 0.02, 0.015, 0.01].map((ret, i) => ({ date: `2024-01-0${i + 1}`, ret }))
    expect(calcMaxDrawdown(series)).toBe(0)
  })

  it('captures a 50% drawdown', () => {
    // start 100 → up to 200 → down to 100 → recover.
    // Step 1: +100% → idx=200, peak=200
    // Step 2: -50%  → idx=100, dd=0.5
    const series = [
      { date: 'd1', ret: 1.0 },
      { date: 'd2', ret: -0.5 },
      { date: 'd3', ret: 0.2 },
    ]
    expect(closeTo(calcMaxDrawdown(series)!, 0.5, 1e-12)).toBe(true)
  })

  it('keeps the maximum drawdown, not the latest', () => {
    // Big dip then small dip after recovery
    const series = [
      { date: 'd1', ret: 1.0 },     // 200
      { date: 'd2', ret: -0.5 },    // 100, dd=0.5
      { date: 'd3', ret: 2.0 },     // 300, peak=300
      { date: 'd4', ret: -0.1 },    // 270, dd=0.1
    ]
    expect(closeTo(calcMaxDrawdown(series)!, 0.5, 1e-12)).toBe(true)
  })
})

describe('calcSortino', () => {
  it('returns null when fewer than 4 returns', () => {
    expect(calcSortino([0.01, 0.02, -0.01])).toBeNull()
  })

  it('returns null when there is no downside (all returns above Rf)', () => {
    const returns = [0.01, 0.02, 0.015, 0.018, 0.012]
    expect(calcSortino(returns)).toBeNull()
  })

  it('is positive when mean exceeds Rf and downside exists', () => {
    const returns = [0.02, -0.01, 0.025, -0.005, 0.018, 0.022]
    const s = calcSortino(returns)
    expect(s).not.toBeNull()
    expect(s!).toBeGreaterThan(0)
  })

  it('matches the analytical formula', () => {
    const returns = [0.02, -0.01, 0.025, -0.005, 0.018, 0.022]
    const n = returns.length
    const mean = returns.reduce((a, b) => a + b, 0) / n
    const downsideVar =
      returns.reduce((a, r) => a + Math.min(r - RISK_FREE_DAILY, 0) ** 2, 0) / n
    const downsideStd = Math.sqrt(downsideVar)
    const expected = ((mean - RISK_FREE_DAILY) / downsideStd) * Math.sqrt(252)
    expect(closeTo(calcSortino(returns)!, expected, 1e-12)).toBe(true)
  })
})

describe('calcVaR', () => {
  it('returns null when fewer than 30 observations', () => {
    expect(calcVaR(Array(29).fill(-0.01))).toBeNull()
  })

  it('returns the loss at the 5th percentile by default', () => {
    // 100 returns: -0.099, -0.098, ..., 0.000
    const returns = Array.from({ length: 100 }, (_, i) => -(99 - i) / 1000) // -0.099 .. 0
    const v = calcVaR(returns) // confidence 0.95 → idx = floor(0.05*100) = 5
    // sorted ascending, sorted[5] = -0.094 → VaR = 0.094
    expect(closeTo(v!, 0.094, 1e-12)).toBe(true)
  })

  it('VaR at 99% confidence is more extreme than at 95%', () => {
    const returns = Array.from({ length: 200 }, (_, i) => -(199 - i) / 1000)
    const v95 = calcVaR(returns, 0.95)!
    const v99 = calcVaR(returns, 0.99)!
    expect(v99).toBeGreaterThan(v95)
  })
})

describe('calcCVaR', () => {
  it('returns null when fewer than 30 observations', () => {
    expect(calcCVaR(Array(29).fill(-0.01))).toBeNull()
  })

  it('CVaR is at least as large as VaR (expected shortfall ≥ quantile loss)', () => {
    const returns = Array.from({ length: 100 }, (_, i) => -(99 - i) / 1000)
    const v = calcVaR(returns, 0.95)!
    const c = calcCVaR(returns, 0.95)!
    expect(c).toBeGreaterThanOrEqual(v)
  })

  it('CVaR equals mean of tail beyond cutoff', () => {
    // 100 returns evenly spaced from -0.099 to 0
    const returns = Array.from({ length: 100 }, (_, i) => -(99 - i) / 1000)
    // cutoff = floor(0.05 * 100) = 5, tail = sorted[0..5) = [-0.099,-0.098,-0.097,-0.096,-0.095]
    const expectedTail = [-0.099, -0.098, -0.097, -0.096, -0.095]
    const expected = -(expectedTail.reduce((a, b) => a + b, 0) / expectedTail.length)
    expect(closeTo(calcCVaR(returns, 0.95)!, expected, 1e-12)).toBe(true)
  })
})

describe('calcRollingBeta', () => {
  it('returns empty when aligned series is shorter than window', () => {
    const port = Array.from({ length: 10 }, (_, i) => ({ date: `d${i}`, ret: 0.01 }))
    const map = new Map(port.map(p => [p.date, 0.01]))
    expect(calcRollingBeta(port, map, 63)).toEqual([])
  })

  it('produces one beta per window-aligned slice', () => {
    // 70 perfectly correlated days → with window=63 we get 70 - 63 + 1 = 8 results
    const port = Array.from({ length: 70 }, (_, i) => ({
      date: `2024-${String(i + 1).padStart(3, '0')}`,
      ret: 0.01 * Math.sin(i),
    }))
    const map = new Map(port.map(p => [p.date, p.ret])) // identical → beta=1
    const result = calcRollingBeta(port, map, 63)
    expect(result).toHaveLength(8)
    for (const r of result) {
      expect(closeTo(r.beta, 1, 1e-10)).toBe(true)
    }
  })

  it('drops dates where the market series has no aligned value', () => {
    const port = Array.from({ length: 70 }, (_, i) => ({ date: `d${i}`, ret: 0.01 * (i % 3 - 1) }))
    // Only first 50 dates have aligned market data → aligned length 50 < window 63 → empty
    const map = new Map(port.slice(0, 50).map(p => [p.date, p.ret]))
    expect(calcRollingBeta(port, map, 63)).toEqual([])
  })
})
