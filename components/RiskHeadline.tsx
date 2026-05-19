'use client'

import { useEffect, useState } from 'react'
import type { Position } from '@/types'

interface Props { positions: Position[] }

function rollingAnnualisedVolLast(returns: number[], window = 21): number | null {
  if (returns.length < window) return null
  const slice = returns.slice(returns.length - window)
  const m = slice.reduce((a, b) => a + b, 0) / slice.length
  const variance = slice.reduce((a, b) => a + (b - m) ** 2, 0) / (slice.length - 1)
  return Math.sqrt(variance) * Math.sqrt(252)
}

export default function RiskHeadline({ positions }: Props) {
  const [vol21d, setVol21d] = useState<number | null>(null)
  const [sharpe, setSharpe] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!positions.length) { setLoading(false); return }
    const body = { positions: positions.map(p => ({ ticker: p.ticker, shares: p.shares, buy_date: p.buy_date })) }
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(r => r.json())
      .then(d => {
        const rets: number[] = (d.twrReturns ?? []).map((r: { ret: number }) => Math.max(-0.25, Math.min(0.25, r.ret)))
        setVol21d(rollingAnnualisedVolLast(rets, 21))
        setSharpe(typeof d.sharpe === 'number' ? d.sharpe : null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [positions])

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 12,
    }}>
      <HeadlineTile
        label="Volatility (21d annualised)"
        value={vol21d != null ? `${(vol21d * 100).toFixed(1)}%` : (loading ? '…' : '—')}
      />
      <HeadlineTile
        label="Sharpe ratio (1Y)"
        value={sharpe != null ? sharpe.toFixed(2) : (loading ? '…' : '—')}
      />
      <div style={{
        gridColumn: '1 / -1',
        fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.55,
      }}>
        21-day rolling annualised volatility of your portfolio&apos;s daily returns. Sharpe over the trailing 1Y, vs. 0% risk-free (CHF cash rate placeholder).
      </div>
    </div>
  )
}

function HeadlineTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-box" style={{ animation: 'fade-up 0.4s both' }}>
      <div className="stat-box__label">{label}</div>
      <div className="stat-box__val" style={{ color: 'var(--ink)' }}>{value}</div>
    </div>
  )
}
