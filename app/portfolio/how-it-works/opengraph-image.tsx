import { ImageResponse } from 'next/og'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export const runtime = 'nodejs'   // need fs to read public/backtests/aggregate.json
export const dynamic = 'force-dynamic'   // skip build-time prerender (Vercel edge-caches at request time)
export const alt = 'Quantfoli — Walk-forward backtest results'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface AggregateJson {
  pooled: Record<string, { sharpeDelta: { mean: number; n: number; pctPositive: number } }>
}

async function readAggregate(): Promise<AggregateJson | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'public', 'backtests', 'aggregate.json'), 'utf8')
    return JSON.parse(raw)
  } catch { return null }
}

export default async function OpengraphImage() {
  const aggregate = await readAggregate()
  const eq = aggregate?.pooled?.['equal-weight']?.sharpeDelta
  const headline = eq
    ? `+Sharpe in ${(eq.pctPositive * 100).toFixed(0)}% of ${eq.n} quarters`
    : 'Walk-forward backtests on Swiss portfolios'
  const sub = eq
    ? `Mean Δ ${eq.mean >= 0 ? '+' : ''}${eq.mean.toFixed(3)} · 2019–2024 · net of Swiss costs`
    : '2019–2024 · net of trading commission, spread, stamp duty'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '80px',
          background:
            'radial-gradient(circle at 0% 0%, rgba(192, 132, 252, 0.30), transparent 55%), radial-gradient(circle at 100% 100%, rgba(216, 180, 254, 0.18), transparent 50%), #0b0f1a',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, fontWeight: 700,
              background: 'linear-gradient(135deg, rgba(192,132,252,1), rgba(216,180,254,1))',
              color: '#0b0f1a',
              boxShadow: '0 0 60px rgba(192, 132, 252, 0.55)',
            }}
          >Q</div>
          <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -1 }}>Quantfoli · How it works</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.0, letterSpacing: -3, color: '#e9d5ff' }}>
            {headline}
          </div>
          <div style={{ fontSize: 30, color: '#cbd5e1', maxWidth: 1040, lineHeight: 1.3 }}>
            {sub}
          </div>
          <div style={{ fontSize: 24, color: '#a78bfa' }}>
            The portfolio tool your quant friend uses.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, color: '#64748b' }}>
          <div>quantfoli.com/portfolio/how-it-works</div>
          <div>Simulated results · not investment advice</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
