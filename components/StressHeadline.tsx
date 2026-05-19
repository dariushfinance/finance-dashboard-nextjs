'use client'

import { useEffect, useState } from 'react'
import type { Position } from '@/types'

interface ScenarioResult {
  name: string
  portMaxDD: number
}

interface Props { positions: Position[] }

export default function StressHeadline({ positions }: Props) {
  const [worst, setWorst] = useState<ScenarioResult | null>(null)
  const [loading, setLoading] = useState(true)

  const priced = positions.filter(p => !p.price_error && (p.current_price ?? 0) > 0)

  useEffect(() => {
    if (!priced.length) { setLoading(false); return }
    fetch('/api/stress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positions: priced.map(p => ({
          ticker: p.ticker, shares: p.shares, current_price: p.current_price,
        })),
      }),
    })
      .then(r => r.json())
      .then(d => {
        const scenarios: ScenarioResult[] = d.scenarios ?? []
        if (!scenarios.length) return
        const w = scenarios.reduce((acc, s) => (s.portMaxDD > acc.portMaxDD ? s : acc), scenarios[0])
        setWorst(w)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [priced.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = worst ? `−${(worst.portMaxDD * 100).toFixed(1)}%` : (loading ? '…' : '—')
  const scenarioName = worst?.name ?? ''

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div className="stat-box" style={{ animation: 'fade-up 0.4s both', maxWidth: 320 }}>
        <div className="stat-box__label">Worst historical drawdown</div>
        <div className="stat-box__val" style={{ color: 'var(--neg)' }}>{value}</div>
        {scenarioName && (
          <div className="stat-box__sub">Scenario: {scenarioName}</div>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.55 }}>
        Largest peak-to-trough loss your current allocation would have shown across the historical stress scenarios. Past data, not a forecast.
      </div>
    </div>
  )
}
