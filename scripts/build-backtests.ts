/* eslint-disable no-console */
//
// Generates the three sample-portfolio backtest JSONs + aggregate JSON consumed
// by app/how-it-works/page.tsx. Run with:
//
//   npx tsx scripts/build-backtests.ts
//
// Output:
//   public/backtests/conservative.json
//   public/backtests/growth.json
//   public/backtests/concentrated.json
//   public/backtests/aggregate.json
//
// The aggregate JSON is the headline statistic shown in the hero. Its values
// are re-derived from the three per-portfolio JSONs by scripts/verify-backtest-jsons.ts.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { loadHistoricalPrices } from '../lib/backtest/data'
import { runWalkForward, type BenchmarkId } from '../lib/backtest/engine'
import { loadFxRates } from '../lib/backtest/fx'
import { ALL_INSTRUMENTS, metaFor } from '../lib/backtest/universe'

interface SamplePortfolio {
  id:               string
  title:            string
  description:      string
  instruments:      string[]
  startingWeights:  Record<string, number>
  marketCapProxy?:  Record<string, number>
}

const SAMPLE_PORTFOLIOS: SamplePortfolio[] = [
  {
    id: 'conservative',
    title: 'Conservative 60/40 Swiss investor',
    description: '60% global equity ETF / 40% global aggregate bond ETF, CHF-hedged where available.',
    instruments: ['VWRL.SW', 'AGGG.L'],
    startingWeights: { 'VWRL.SW': 0.60, 'AGGG.L': 0.40 },
  },
  {
    id: 'growth',
    title: 'Growth-oriented ETF portfolio',
    description: 'Diversified global equity exposure tilted toward US large-cap and emerging markets.',
    instruments: ['VWRL.SW', 'CSPX.L', 'EUNL.DE', 'EIMI.L'],
    startingWeights: { 'VWRL.SW': 0.40, 'CSPX.L': 0.30, 'EUNL.DE': 0.15, 'EIMI.L': 0.15 },
  },
  {
    id: 'concentrated',
    title: 'SMI single-stock-heavy retail portfolio',
    description: 'Anonymised allocation reflecting the most common ZKB-customer profile in the existing CSV-parser sample.',
    instruments: ['NESN.SW', 'NOVN.SW', 'ROG.SW', 'UBSG.SW', 'ZURN.SW'],
    startingWeights: { 'NESN.SW': 0.28, 'NOVN.SW': 0.24, 'ROG.SW': 0.22, 'UBSG.SW': 0.14, 'ZURN.SW': 0.12 },
  },
]

const START_DATE = '2018-01-02'
const END_DATE   = '2024-12-31'
const BENCHMARKS: BenchmarkId[] = ['equal-weight', 'starting-allocation']

function ensure(weights: Record<string, number>): Record<string, number> {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0)
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / sum]))
}

async function buildOne(p: SamplePortfolio, fx: Awaited<ReturnType<typeof loadFxRates>>) {
  console.log(`\n[backtest] building ${p.id}: ${p.instruments.join(', ')}`)
  const prices = await loadHistoricalPrices({
    tickers: p.instruments,
    from:    START_DATE,
    to:      END_DATE,
  })

  // Determine the first date all instruments have data → start backtest there
  let earliestUsableStart = START_DATE
  for (const t of p.instruments) {
    const first = prices[t]?.[0]?.date
    if (!first) throw new Error(`No price data for ${t}`)
    if (first > earliestUsableStart) earliestUsableStart = first
  }
  // Add a 504-trading-day lookback buffer before the first rebalance
  const startD = new Date(earliestUsableStart + 'T00:00:00Z')
  startD.setUTCDate(startD.getUTCDate() + 504 + 30)  // calendar days, generous
  const firstRebalance = startD.toISOString().split('T')[0]

  console.log(`[backtest]   data starts ${earliestUsableStart}, first rebalance ${firstRebalance}`)

  // Build ticker → currency map from universe metadata for the FX layer
  const currencyByTicker: Record<string, string> = {}
  for (const t of p.instruments) {
    currencyByTicker[t] = metaFor(t)?.currency ?? 'CHF'
  }

  const result = runWalkForward({
    startDate:       firstRebalance,
    endDate:         END_DATE,
    rebalanceFreq:   'quarterly',
    instruments:     p.instruments,
    startingWeights: ensure(p.startingWeights),
    benchmarks:      BENCHMARKS,
    prices,
    maxWeight:       Math.max(0.40, 1 / p.instruments.length + 0.05),
    nMonteCarlo:     2000,
    seed:            42,
    currencyByTicker,
    fx,
  })

  // Compact the output: every 5th NAV point keeps file size sane (~weekly resolution)
  const compact = (s: { dates: string[]; navs: number[] }) => ({
    dates: s.dates.filter((_, i) => i % 5 === 0 || i === s.dates.length - 1),
    navs:  s.navs.filter((_, i) => i % 5 === 0 || i === s.navs.length - 1),
  })

  const out = {
    id:          p.id,
    title:       p.title,
    description: p.description,
    instruments: p.instruments,
    startingWeights: ensure(p.startingWeights),
    benchmarks:  BENCHMARKS,
    range:       { start: firstRebalance, end: END_DATE },
    aggregate:   result.aggregate,
    rebalances:  result.rebalances,
    perPeriod:   result.perPeriod,
    series: {
      model:      compact(result.series.model),
      benchmarks: Object.fromEntries(
        Object.entries(result.series.benchmarks).map(([k, v]) => [k, compact(v)])),
    },
    generatedAt: result.meta.generatedAt,
  }

  const file = path.join(process.cwd(), 'public', 'backtests', `${p.id}.json`)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(out, null, 2), 'utf8')
  console.log(`[backtest]   wrote ${file} (n=${result.rebalances.length} rebalances)`)
  return out
}

async function main() {
  console.log('[backtest] loading FX rates (USDCHF, EURCHF)…')
  const fx = await loadFxRates(START_DATE, END_DATE)
  console.log(`[backtest]   USDCHF: ${fx.USDCHF.length} days, EURCHF: ${fx.EURCHF.length} days`)

  const results = []
  for (const p of SAMPLE_PORTFOLIOS) {
    results.push(await buildOne(p, fx))
  }

  // Aggregate across the 3 portfolios — pool per-period stats vs each benchmark
  const pooled: Record<BenchmarkId, { sharpeDelta: number[]; volDelta: number[] }> =
    { 'equal-weight': { sharpeDelta: [], volDelta: [] },
      'starting-allocation': { sharpeDelta: [], volDelta: [] },
      'market-cap': { sharpeDelta: [], volDelta: [] } }

  for (const r of results) {
    for (const p of r.perPeriod) {
      for (const b of BENCHMARKS) {
        if (p.benchmarkSharpe[b] != null) {
          pooled[b].sharpeDelta.push(p.modelSharpe - p.benchmarkSharpe[b])
          pooled[b].volDelta.push(p.modelVol - p.benchmarkVol[b])
        }
      }
    }
  }

  const summarize = (arr: number[]) => {
    if (!arr.length) return { mean: 0, median: 0, n: 0, pctPositive: 0 }
    const sorted = [...arr].sort((a, b) => a - b)
    return {
      mean:        arr.reduce((a, b) => a + b, 0) / arr.length,
      median:      sorted[Math.floor(sorted.length / 2)],
      n:           arr.length,
      pctPositive: arr.filter(x => x > 0).length / arr.length,
    }
  }

  const aggregate: Record<string, unknown> = {
    portfolios: results.map(r => ({
      id: r.id, title: r.title, range: r.range,
      nRebalances: r.aggregate.nRebalances,
    })),
    pooled: Object.fromEntries(
      BENCHMARKS.map(b => [b, {
        sharpeDelta: summarize(pooled[b].sharpeDelta),
        volDelta:    summarize(pooled[b].volDelta),
      }])),
    generatedAt: new Date().toISOString(),
  }

  // Worst single quarter across all portfolios and benchmarks
  let worst: { date: string; portfolio: string; benchmark: BenchmarkId; sharpeDelta: number } | null = null
  for (const r of results) {
    for (const p of r.perPeriod) {
      for (const b of BENCHMARKS) {
        const d = p.modelSharpe - (p.benchmarkSharpe[b] ?? 0)
        if (!worst || d < worst.sharpeDelta) {
          worst = { date: p.date, portfolio: r.id, benchmark: b, sharpeDelta: d }
        }
      }
    }
  }
  aggregate.worstQuarter = worst

  const file = path.join(process.cwd(), 'public', 'backtests', 'aggregate.json')
  await fs.writeFile(file, JSON.stringify(aggregate, null, 2), 'utf8')
  console.log(`\n[backtest] wrote ${file}`)
  console.log('[backtest] done')
  void ALL_INSTRUMENTS  // universe import kept for future coverage checks
}

main().catch(e => { console.error(e); process.exit(1) })
