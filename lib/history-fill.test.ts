import { describe, it, expect } from 'vitest'
import { forwardFillPriceMap, toChfPriceMap, type PriceMap } from './history-fill'
import { tickerCurrency } from './ticker-currency'
import { calcTWRReturns } from './yahoo'

// Regression suite for the phantom 70% drop in Portfolio Value History.
// See docs/HISTORY_BUG_AUDIT.md. The bug: on a union date where one exchange
// was closed but another open, the closed-exchange position was valued at 0,
// producing a single-day cliff that recovered the next day.

// Mirrors the value-series assembly in app/api/history/route.ts so the test
// exercises the same logic the route runs.
function buildValueSeries(
  positions: { ticker: string; shares: number; buy_date: string }[],
  priceMap: PriceMap,
  sortedDates: string[]
): { date: string; value: number; gap?: boolean }[] {
  const filled = forwardFillPriceMap(priceMap, sortedDates)
  return sortedDates
    .map((date) => {
      let value = 0
      let gap = false
      for (const pos of positions) {
        const buyDate = pos.buy_date.split('T')[0]
        if (date < buyDate) continue
        const price = filled[pos.ticker]?.[date]
        if (price != null) value += price * pos.shares
        else gap = true
      }
      return gap ? { date, value, gap } : { date, value }
    })
    .filter((d) => d.value > 0)
}

const maxSingleDayDrop = (series: { value: number }[]): number => {
  let worst = 0
  for (let i = 1; i < series.length; i++) {
    const drop = (series[i - 1].value - series[i].value) / series[i - 1].value
    if (drop > worst) worst = drop
  }
  return worst
}

// 70% of value in CH-listed holdings, 30% in a US ticker. CH exchange is closed
// on the Easter Monday union date (2026-04-06) that the US ticker still trades.
const positions = [
  { ticker: 'NESN.SW', shares: 70, buy_date: '2026-04-01' }, // CHF, ~70% weight
  { ticker: 'AAPL', shares: 30, buy_date: '2026-04-01' }, // USD-ish, ~30% weight
]
const priceMap: PriceMap = {
  'NESN.SW': { '2026-04-02': 100, '2026-04-03': 100, /* 04-06 CLOSED */ '2026-04-07': 100 },
  AAPL: { '2026-04-02': 100, '2026-04-03': 100, '2026-04-06': 100, '2026-04-07': 100 },
}
const sortedDates = ['2026-04-02', '2026-04-03', '2026-04-06', '2026-04-07']

describe('forwardFillPriceMap', () => {
  it('carries last-known close onto a missing (holiday) union date', () => {
    const filled = forwardFillPriceMap(priceMap, sortedDates)
    expect(filled['NESN.SW']['2026-04-06']).toBe(100) // carried, not absent
  })

  it('does not back-fill before a ticker has any data', () => {
    const pm: PriceMap = { LATE: { '2026-04-07': 50 } }
    const filled = forwardFillPriceMap(pm, sortedDates)
    expect(filled.LATE['2026-04-02']).toBeUndefined()
    expect(filled.LATE['2026-04-06']).toBeUndefined()
    expect(filled.LATE['2026-04-07']).toBe(50)
  })
})

describe('Portfolio Value History — phantom drop regression', () => {
  it('has NO single-day drop > 50% when an exchange is closed (the bug)', () => {
    const series = buildValueSeries(positions, priceMap, sortedDates)
    expect(maxSingleDayDrop(series)).toBeLessThanOrEqual(0.5)
  })

  it('values the closed-exchange position at its carried price, not 0', () => {
    const series = buildValueSeries(positions, priceMap, sortedDates)
    const holiday = series.find((d) => d.date === '2026-04-06')!
    // Full value = 70*100 + 30*100 = 10000; the buggy version was 30*100 = 3000.
    expect(holiday.value).toBe(10000)
    expect(holiday.gap).toBeUndefined() // a holiday fill is a real value, not a gap
  })

  it('PROVES the old unfilled logic WOULD have produced a >50% drop', () => {
    // Same assembly but WITHOUT forward-fill — reproduces the original bug.
    const buggy = sortedDates
      .map((date) => {
        let value = 0
        for (const pos of positions) {
          if (date < pos.buy_date) continue
          const price = priceMap[pos.ticker]?.[date]
          if (price != null) value += price * pos.shares
        }
        return { date, value }
      })
      .filter((d) => d.value > 0)
    expect(maxSingleDayDrop(buggy)).toBeGreaterThan(0.5) // 10000 → 3000 = 70%
  })

  it('flags a genuine data gap (position held before its ticker has any data)', () => {
    const pm: PriceMap = {
      AAPL: { '2026-04-02': 100, '2026-04-03': 100, '2026-04-06': 100, '2026-04-07': 100 },
      LATE: { '2026-04-07': 100 }, // no data until 04-07
    }
    const pos = [
      { ticker: 'AAPL', shares: 10, buy_date: '2026-04-01' },
      { ticker: 'LATE', shares: 10, buy_date: '2026-04-01' }, // bought before any LATE data
    ]
    const series = buildValueSeries(pos, pm, sortedDates)
    expect(series.find((d) => d.date === '2026-04-02')!.gap).toBe(true)
    expect(series.find((d) => d.date === '2026-04-07')!.gap).toBeUndefined()
  })
})

describe('tickerCurrency', () => {
  it('classifies SIX (.SW) as CHF', () => {
    expect(tickerCurrency('NESN.SW')).toBe('CHF')
    expect(tickerCurrency('UBSG.SW')).toBe('CHF')
  })
  it('classifies Euro-zone suffixes as EUR', () => {
    expect(tickerCurrency('SAP.DE')).toBe('EUR')
    expect(tickerCurrency('ASML.AS')).toBe('EUR')
    expect(tickerCurrency('MC.PA')).toBe('EUR')
  })
  it('classifies US tickers and crypto as USD', () => {
    expect(tickerCurrency('AAPL')).toBe('USD')
    expect(tickerCurrency('BTC-USD')).toBe('USD')
  })
  it('uses static metadata for bare foreign symbols', () => {
    expect(tickerCurrency('NESN')).toBe('CHF') // Nestlé bare symbol
    expect(tickerCurrency('ASML')).toBe('EUR')
  })
  it('approximates unsupported currencies as USD', () => {
    expect(tickerCurrency('NVO')).toBe('USD') // DKK in metadata → approximated USD
  })
})

describe('toChfPriceMap', () => {
  const dates = ['2026-04-02', '2026-04-03']
  const currencyOf = tickerCurrency

  it('leaves CHF tickers unconverted (rate 1)', () => {
    const native: PriceMap = { 'NESN.SW': { '2026-04-02': 100, '2026-04-03': 110 } }
    const chf = toChfPriceMap(native, {}, { USD: 0, EUR: 0 }, currencyOf, dates)
    expect(chf['NESN.SW']['2026-04-02']).toBe(100)
    expect(chf['NESN.SW']['2026-04-03']).toBe(110)
  })

  it('applies the per-day historical USD→CHF rate', () => {
    const native: PriceMap = { AAPL: { '2026-04-02': 100, '2026-04-03': 100 } }
    const fx = { USD: { '2026-04-02': 0.90, '2026-04-03': 0.80 } }
    const chf = toChfPriceMap(native, fx, { USD: 0, EUR: 0 }, currencyOf, dates)
    expect(chf.AAPL['2026-04-02']).toBe(90)
    expect(chf.AAPL['2026-04-03']).toBe(80) // FX move flows through, not a flat rate
  })

  it('falls back to spot when a historical rate is missing — never 1.0', () => {
    const native: PriceMap = { AAPL: { '2026-04-02': 100, '2026-04-03': 100 } }
    const fx = { USD: { '2026-04-02': 0.90 } } // 04-03 missing
    const chf = toChfPriceMap(native, fx, { USD: 0.85, EUR: 0 }, currencyOf, dates)
    expect(chf.AAPL['2026-04-02']).toBe(90)
    expect(chf.AAPL['2026-04-03']).toBe(85) // spot fallback, not 100 (would be the 1.0 bug)
  })

  it('omits a date (→ gap) when neither historical nor spot rate is usable', () => {
    const native: PriceMap = { AAPL: { '2026-04-02': 100 } }
    const chf = toChfPriceMap(native, {}, { USD: 0, EUR: 0 }, currencyOf, dates)
    expect(chf.AAPL['2026-04-02']).toBeUndefined()
  })

  it('makes mixed-currency holdings additive in CHF', () => {
    // 1 share USD stock @100 (rate 0.9 → 90 CHF) + 1 share CHF stock @100 (→100 CHF) = 190 CHF.
    const native: PriceMap = {
      AAPL: { '2026-04-02': 100 },
      'NESN.SW': { '2026-04-02': 100 },
    }
    const fx = { USD: { '2026-04-02': 0.9 } }
    const chf = toChfPriceMap(native, fx, { USD: 0, EUR: 0 }, currencyOf, ['2026-04-02'])
    const total = chf.AAPL['2026-04-02'] + chf['NESN.SW']['2026-04-02']
    expect(total).toBe(190) // old bug summed 100+100=200 as if 1:1
  })
})

describe('calcTWRReturns with forward-filled map', () => {
  it('does not drop a position from a step on a holiday gap', () => {
    const filled = forwardFillPriceMap(priceMap, sortedDates)
    const out = calcTWRReturns(positions, filled, sortedDates)
    // All flat prices → every period return is exactly 0 (no spurious moves).
    for (const { ret } of out) expect(ret).toBe(0)
  })
})
