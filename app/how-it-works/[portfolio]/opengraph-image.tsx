import { ImageResponse } from 'next/og'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const alt = 'Quantfoli — Sample portfolio backtest'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface PortfolioJson {
  title: string
  range: { start: string; end: string }
  aggregate: {
    nRebalances: number
    pctPeriodsModelWonSharpe: Record<string, number>
    sharpeDeltaMean: Record<string, number>
    worstPeriod: { date: string; benchmark: string; sharpeDelta: number }
  }
}

async function readPortfolio(id: string): Promise<PortfolioJson | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'public', 'backtests', `${id}.json`), 'utf8')
    return JSON.parse(raw)
  } catch { return null }
}

export default async function PortfolioOG({ params }: { params: { portfolio: string } }) {
  const data = await readPortfolio(params.portfolio)

  const title    = data?.title ?? 'Quantfoli sample portfolio'
  const range    = data ? `${data.range.start} → ${data.range.end}` : ''
  const wins     = data ? `${(data.aggregate.pctPeriodsModelWonSharpe['equal-weight'] * 100).toFixed(0)}%` : '—'
  const meanD    = data ? data.aggregate.sharpeDeltaMean['equal-weight'] : 0
  const meanStr  = data ? `${meanD >= 0 ? '+' : ''}${meanD.toFixed(3)}` : '—'
  const n        = data?.aggregate.nRebalances ?? 0

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '80px',
        background:
          'radial-gradient(circle at 0% 0%, rgba(192, 132, 252, 0.30), transparent 55%), radial-gradient(circle at 100% 100%, rgba(216, 180, 254, 0.18), transparent 50%), #0b0f1a',
        color: '#f8fafc', fontFamily: 'sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, fontWeight: 700,
            background: 'linear-gradient(135deg, rgba(192,132,252,1), rgba(216,180,254,1))',
            color: '#0b0f1a',
          }}>Q</div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1 }}>Quantfoli · sample backtest</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1040, color: '#e9d5ff' }}>
            {title}
          </div>
          <div style={{ display: 'flex', gap: 40, fontSize: 28, color: '#cbd5e1' }}>
            <div>+Sharpe in <span style={{ color: '#e9d5ff', fontWeight: 700 }}>{wins}</span> of {n} quarters</div>
            <div>Mean Δ <span style={{ color: '#e9d5ff', fontWeight: 700 }}>{meanStr}</span></div>
          </div>
          <div style={{ fontSize: 22, color: '#94a3b8' }}>
            {range} · vs. equal-weighted · net of Swiss costs
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, color: '#64748b' }}>
          <div>quantfoli.com/how-it-works</div>
          <div>Simulated · not investment advice</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
