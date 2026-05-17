/* eslint-disable no-console */
//
// Cross-checks public/backtests/aggregate.json against the per-portfolio JSONs.
// Runs as part of `npm run build` so a drift between the headline numbers and
// the underlying portfolio runs fails CI loudly.

import { promises as fs } from 'node:fs'
import path from 'node:path'

const FILES = ['conservative.json', 'growth.json', 'concentrated.json']

async function readJson<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, 'utf8')
  return JSON.parse(raw) as T
}

interface PerPeriodLite { modelSharpe: number; modelVol: number; benchmarkSharpe: Record<string, number>; benchmarkVol: Record<string, number> }
interface PortfolioJson { perPeriod: PerPeriodLite[] }
interface AggregateJson {
  pooled: Record<string, { sharpeDelta: { mean: number; n: number }; volDelta: { mean: number; n: number } }>
}

async function main() {
  const dir = path.join(process.cwd(), 'public', 'backtests')
  const portfolios = await Promise.all(FILES.map(f => readJson<PortfolioJson>(path.join(dir, f))))
  const aggregate = await readJson<AggregateJson>(path.join(dir, 'aggregate.json'))

  const benchmarks = Object.keys(aggregate.pooled)
  let drift = false

  for (const b of benchmarks) {
    const deltas: number[] = []
    for (const p of portfolios) {
      for (const pp of p.perPeriod) {
        if (pp.benchmarkSharpe[b] != null) deltas.push(pp.modelSharpe - pp.benchmarkSharpe[b])
      }
    }
    const observedMean = deltas.length ? deltas.reduce((a, b2) => a + b2, 0) / deltas.length : 0
    const observedN    = deltas.length
    const claimedMean  = aggregate.pooled[b].sharpeDelta.mean
    const claimedN     = aggregate.pooled[b].sharpeDelta.n
    if (observedN !== claimedN || Math.abs(observedMean - claimedMean) > 1e-9) {
      console.error(`[verify] DRIFT for benchmark "${b}":`)
      console.error(`  aggregate.json claims mean=${claimedMean.toFixed(6)} n=${claimedN}`)
      console.error(`  portfolio JSONs imply  mean=${observedMean.toFixed(6)} n=${observedN}`)
      drift = true
    }
  }

  if (drift) {
    console.error('\n[verify] aggregate.json is stale — re-run scripts/build-backtests.ts')
    process.exit(1)
  }
  console.log('[verify] aggregate.json matches per-portfolio JSONs ✓')
}

main().catch(e => { console.error(e); process.exit(1) })
