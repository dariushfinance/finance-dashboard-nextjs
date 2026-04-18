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
    <div className="fin-card space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-text-primary">{s.name}</div>
          <div className="text-xs text-text-muted">{s.start} → {s.end}</div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
          outperformed ? 'text-brand-green bg-brand-green/10' : 'text-brand-red bg-brand-red/10'
        }`}>
          {outperformed ? '▲' : '▼'} {fmt(excess)} vs index
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bg-elevated rounded-lg p-2.5">
          <div className="text-xs text-text-muted mb-0.5">Your Portfolio</div>
          <div className={`font-mono font-semibold text-lg ${s.portReturn >= 0 ? 'pos' : 'neg'}`}>
            {fmt(s.portReturn)}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            Max DD: <span className="text-brand-red">{fmt(-s.portMaxDD)}</span>
          </div>
        </div>
        <div className="bg-bg-elevated rounded-lg p-2.5">
          <div className="text-xs text-text-muted mb-0.5">S&P 500</div>
          <div className={`font-mono font-semibold text-lg ${s.spReturn >= 0 ? 'pos' : 'neg'}`}>
            {fmt(s.spReturn)}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            Max DD: <span className="text-brand-red">{fmt(-s.spMaxDD)}</span>
          </div>
        </div>
      </div>

      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={s.data} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <ReferenceLine y={100} stroke="#475569" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="bg-bg-elevated border border-bg-border rounded px-2 py-1.5 text-xs font-mono space-y-0.5">
                    <div className="text-text-muted">{label}</div>
                    <div className="text-brand-green">Portfolio: {(payload[0]?.value as number)?.toFixed(1)}</div>
                    <div className="text-text-secondary">S&P 500: {(payload[1]?.value as number)?.toFixed(1)}</div>
                  </div>
                )
              }}
            />
            <Line type="monotone" dataKey="portfolio" stroke="#22c55e" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="sp500"     stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {s.missingTickers.length > 0 && (
        <div className="text-xs text-text-muted border-t border-bg-border pt-2">
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
    <div className="space-y-4 animate-slide-up">
      <div className="fin-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-text-primary">Historical Stress Test</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Current portfolio weights applied to four historical crises · shows how your holdings
              <em> would have</em> performed · not a prediction
            </p>
          </div>
          {loading && <span className="spinner flex-shrink-0 mt-1" />}
        </div>
        {error && <div className="text-brand-red text-sm mt-3">{error}</div>}
      </div>

      {loading && scenarios.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="fin-card h-64 animate-pulse bg-bg-elevated rounded-xl" />
          ))}
        </div>
      )}

      {scenarios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((s) => <ScenarioCard key={s.name} s={s} />)}
        </div>
      )}
    </div>
  )
}
