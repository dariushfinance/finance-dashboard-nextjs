'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Position } from '@/types'

interface ScenarioResult {
  name: string
  start: string
  end: string
  portReturn: number
  spReturn: number
  portMaxDD: number
  spMaxDD: number
  data: { date: string; portfolio: number; sp500: number }[]
  missingTickers: string[]
}

interface Props { positions: Position[] }

function fmt(v: number) {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`
}

function ScenarioCard({ s }: { s: ScenarioResult }) {
  const outperformed = s.portReturn > s.spReturn
  const excess = s.portReturn - s.spReturn

  return (
    <div className="fin-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{s.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 3 }}>{s.start} → {s.end}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 7, flexShrink: 0,
          color:       outperformed ? 'var(--pos)'      : 'var(--neg)',
          background:  outperformed ? 'var(--pos-soft)' : 'var(--neg-soft)',
          border:      `1px solid ${outperformed ? 'var(--pos-line)' : 'var(--neg-line)'}`,
          fontFamily:  'var(--font-mono)',
        }}>
          {outperformed ? '▲' : '▼'} {fmt(excess)} vs index
        </span>
      </div>

      {/* Portfolio vs S&P boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Your Portfolio', ret: s.portReturn, dd: s.portMaxDD },
          { label: 'S&P 500',        ret: s.spReturn,   dd: s.spMaxDD   },
        ].map(({ label, ret, dd }) => (
          <div key={label} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--line-soft)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 5 }}>
              {label}
            </div>
            <div className={`${ret >= 0 ? 'pos' : 'neg'}`} style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18 }}>
              {fmt(ret)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 5 }}>
              Max DD: <span style={{ color: 'var(--neg)' }}>{fmt(-dd)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Mini chart */}
      <div style={{ height: 112 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={s.data} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <ReferenceLine y={100} stroke="var(--line)" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div style={{
                    background: 'var(--bg-2)', border: '1px solid var(--line)',
                    borderRadius: 9, padding: '8px 11px',
                    fontSize: 11, fontFamily: 'var(--font-mono)',
                    display: 'flex', flexDirection: 'column', gap: 3,
                    boxShadow: 'var(--shadow-hi)',
                  }}>
                    <div style={{ color: 'var(--ink-4)' }}>{label}</div>
                    <div style={{ color: 'var(--pos)' }}>Portfolio: {(payload[0]?.value as number)?.toFixed(1)}</div>
                    <div style={{ color: 'var(--ink-3)' }}>S&amp;P 500: {(payload[1]?.value as number)?.toFixed(1)}</div>
                  </div>
                )
              }}
            />
            <Line type="monotone" dataKey="portfolio" stroke="var(--pos)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="sp500"     stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {s.missingTickers.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--ink-4)', borderTop: '1px solid var(--line-soft)', paddingTop: 8 }}>
          ⚠ {s.missingTickers.join(', ')} had no data for this period — treated as cash
        </div>
      )}
    </div>
  )
}

export default function StressTest({ positions }: Props) {
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const pricedPositions = positions.filter((p) => !p.price_error && (p.current_price ?? 0) > 0)

  useEffect(() => {
    if (!pricedPositions.length) return
    setLoading(true)
    setError('')
    fetch('/api/stress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positions: pricedPositions.map((p) => ({
          ticker: p.ticker,
          shares: p.shares,
          current_price: p.current_price,
        })),
      }),
    })
      .then((r) => r.json())
      .then((d) => setScenarios(d.scenarios ?? []))
      .catch(() => setError('Failed to load stress test data. Historical data may be unavailable.'))
      .finally(() => setLoading(false))
  }, [pricedPositions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!pricedPositions.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-slide-up">
      <div className="fin-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
              Historical Stress Test
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.55 }}>
              Current portfolio weights applied to four historical crises · shows how your holdings
              <em> would have</em> performed · not a prediction
            </div>
          </div>
          {loading && <span className="spinner" style={{ flexShrink: 0, marginTop: 2 }} />}
        </div>
        {error && <div style={{ color: 'var(--neg)', fontSize: 13, marginTop: 12 }}>{error}</div>}
      </div>

      {loading && scenarios.length === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="fin-card shimmer" style={{ height: 256 }} />
          ))}
        </div>
      )}

      {scenarios.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {scenarios.map((s) => <ScenarioCard key={s.name} s={s} />)}
        </div>
      )}
    </div>
  )
}
