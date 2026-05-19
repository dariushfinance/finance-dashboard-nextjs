import { promises as fs } from 'node:fs'
import path from 'node:path'
import { HeroChart } from './HeroChart'
import { CopyLinkButton } from './CopyLinkButton'

interface PerPeriod {
  date: string
  modelSharpe: number
  modelVol: number
  benchmarkSharpe: Record<string, number>
  benchmarkVol: Record<string, number>
}
interface NavSeries { dates: string[]; navs: number[] }
interface PortfolioJson {
  id: string
  title: string
  description: string
  instruments: string[]
  startingWeights: Record<string, number>
  benchmarks: string[]
  range: { start: string; end: string }
  rebalances: { date: string; weights: Record<string, number>; turnover: number; cost: number }[]
  perPeriod: PerPeriod[]
  series: { model: NavSeries; benchmarks: Record<string, NavSeries> }
  aggregate: {
    nRebalances: number
    pctPeriodsModelWonSharpe: Record<string, number>
    sharpeDeltaMean: Record<string, number>
    worstPeriod: { date: string; benchmark: string; sharpeDelta: number }
  }
}

export async function loadPortfolio(id: string): Promise<PortfolioJson> {
  const file = path.join(process.cwd(), 'public', 'backtests', `${id}.json`)
  const raw = await fs.readFile(file, 'utf8')
  return JSON.parse(raw)
}

function pct(x: number, digits = 1) { return `${(x * 100).toFixed(digits)}%` }
function sgn(x: number, digits = 3) { return `${x >= 0 ? '+' : ''}${x.toFixed(digits)}` }

type Verdict = 'won' | 'tied' | 'lost'

// Verdict rules:
//   wins ≥ 55% AND median > +0.02  → won
//   wins ≤ 45% OR  median < −0.02  → lost
//   else                            → tied
// Median is the more honest center than the mean because a few outlier quarters
// can pull the mean positive even when most periods underperform.
function deriveVerdict(winsPct: number, median: number): Verdict {
  if (winsPct >= 0.55 && median > 0.02)  return 'won'
  if (winsPct <= 0.45 || median < -0.02) return 'lost'
  return 'tied'
}

const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string }> = {
  won:  { label: 'Model returned higher Sharpe', color: 'var(--pos)',  bg: 'oklch(0.82 0.156 162 / 0.14)' },
  tied: { label: 'Roughly tied',                 color: 'var(--warn)', bg: 'oklch(0.84 0.148 80 / 0.14)' },
  lost: { label: 'Model returned lower Sharpe',  color: 'var(--neg)',  bg: 'oklch(0.65 0.190 25 / 0.14)' },
}

export function SamplePortfolioCard({
  data, anchor, whyText,
}: { data: PortfolioJson; anchor: string; whyText: string }) {
  // Ending NAVs
  const endModel = data.series.model.navs[data.series.model.navs.length - 1]
  const benchEnd: Record<string, number> = {}
  for (const [k, s] of Object.entries(data.series.benchmarks)) {
    benchEnd[k] = s.navs[s.navs.length - 1]
  }

  const wins = data.aggregate.pctPeriodsModelWonSharpe['equal-weight'] ?? 0
  const meanDelta = data.aggregate.sharpeDeltaMean['equal-weight'] ?? 0

  // Compute median Sharpe Δ vs equal-weight (honest center, not pulled by outliers)
  const deltas = data.perPeriod
    .map(p => p.modelSharpe - (p.benchmarkSharpe['equal-weight'] ?? 0))
    .sort((a, b) => a - b)
  const median = deltas.length ? deltas[Math.floor(deltas.length / 2)] : 0

  const verdict = deriveVerdict(wins, median)
  const v = VERDICT_META[verdict]

  // Per-verdict opening sentence — never lead with the "wins" number when it's < 50%
  const opener =
    verdict === 'won'
      ? `Model improved Sharpe vs. equal-weight in ${pct(wins, 0)} of measured periods.`
    : verdict === 'lost'
      ? `Model returned lower Sharpe than equal-weight in ${pct(1 - wins, 0)} of measured periods.`
      : `Model and equal-weight were roughly tied (model won ${pct(wins, 0)} of periods).`

  return (
    <section
      id={anchor}
      style={{
        scrollMarginTop: 80,
        border: '1px solid var(--line-soft)',
        borderRadius: 14,
        padding: 24,
        marginBottom: 28,
        background: 'var(--bg-1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 auto', minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em' }}>
              {data.title}
            </h3>
            <span style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '3px 9px', borderRadius: 6,
              color: v.color, background: v.bg,
              border: `1px solid ${v.color}33`,
            }}>
              {v.label}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '6px 0 0', lineHeight: 1.55 }}>
            {data.description}
          </p>
        </div>
        <CopyLinkButton anchor={anchor} />
      </div>

      <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
        {data.range.start} → {data.range.end} · {data.aggregate.nRebalances} quarterly rebalances · net of Swiss costs
      </div>

      {/* Starting weights */}
      <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Object.entries(data.startingWeights).map(([t, w]) => (
          <span key={t} style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            padding: '3px 9px', borderRadius: 20,
            background: 'var(--bg-2)', border: '1px solid var(--line-soft)',
            color: 'var(--ink-3)',
          }}>
            {t} {pct(w, 0)}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div style={{ marginTop: 18 }}>
        <HeroChart data={data} height={260} />
      </div>

      {/* Ending stats */}
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          <thead>
            <tr style={{ color: 'var(--ink-4)', textAlign: 'right' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid var(--line-soft)' }}>Series</th>
              <th style={{ padding: '8px 6px', borderBottom: '1px solid var(--line-soft)' }}>Ending NAV</th>
              <th style={{ padding: '8px 6px', borderBottom: '1px solid var(--line-soft)' }}>Total return</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px 6px', color: 'var(--accent)' }}>Model</td>
              <td style={{ padding: '8px 6px', textAlign: 'right', color: 'var(--ink-2)' }}>{endModel.toFixed(3)}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right', color: endModel >= 1 ? 'var(--pos)' : 'var(--neg)' }}>{pct(endModel - 1, 1)}</td>
            </tr>
            {Object.entries(benchEnd).map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: '8px 6px', color: 'var(--ink-3)' }}>{k === 'equal-weight' ? 'Equal-weighted' : 'Starting allocation'}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', color: 'var(--ink-3)' }}>{v.toFixed(3)}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', color: v >= 1 ? 'var(--pos)' : 'var(--neg)' }}>{pct(v - 1, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Honest narrative: opener + central stats + "Why" + worst period */}
      <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 16, lineHeight: 1.65 }}>
        {opener}{' '}
        Mean Sharpe Δ <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{sgn(meanDelta)}</span>,{' '}
        median <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{sgn(median)}</span>.
        {' '}<strong style={{ color: 'var(--ink-2)' }}>Why:</strong> {whyText}
      </p>
      <p style={{ fontSize: 11.5, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
        Worst single period: {data.aggregate.worstPeriod.date} · Sharpe Δ {sgn(data.aggregate.worstPeriod.sharpeDelta)} vs. {data.aggregate.worstPeriod.benchmark}.
      </p>
    </section>
  )
}
