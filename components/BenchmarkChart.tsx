'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Position, BenchmarkResult } from '@/types'

interface Props { positions: Position[] }

export default function BenchmarkChart({ positions }: Props) {
  const [data, setData] = useState<BenchmarkResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!positions.length) return
    setLoading(true)
    setError('')
    fetch('/api/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positions: positions.map((p) => ({
          ticker: p.ticker,
          shares: p.shares,
          buy_date: p.buy_date,
        })),
      }),
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('Failed to load benchmark'))
      .finally(() => setLoading(false))
  }, [positions])

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: { name: string; value: number; color: string }[]
    label?: string
  }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-bg-elevated border border-bg-border rounded-lg p-3 text-xs font-mono space-y-1">
        <div className="text-text-muted mb-2">{label}</div>
        {payload.map((p) => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value.toFixed(2)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="fin-card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Portfolio vs. S&amp;P 500</h2>
        {loading && <span className="spinner" />}
      </div>

      {/* Beta & Alpha */}
      {data && (data.beta != null || data.alpha != null) && (
        <div className="grid grid-cols-2 gap-4">
          {data.beta != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">Beta (β)</div>
              <div className="font-mono text-xl font-semibold text-text-primary">{data.beta.toFixed(2)}</div>
              <div className="text-xs text-text-muted mt-1">
                {data.beta > 1.2 ? 'High market sensitivity' : data.beta > 0.8 ? 'Market-like' : 'Defensive'}
              </div>
            </div>
          )}
          {data.alpha != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">Alpha (α, ann.)</div>
              <div className={`font-mono text-xl font-semibold ${data.alpha >= 0 ? 'pos' : 'neg'}`}>
                {data.alpha >= 0 ? '+' : ''}{(data.alpha * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-text-muted mt-1">
                {data.alpha >= 0 ? 'Outperforming' : 'Underperforming'} the index
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div className="text-brand-red text-sm">{error}</div>}

      {data?.data?.length ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.data} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toFixed(0)}`}
              />
              <ReferenceLine y={100} stroke="#475569" strokeDasharray="4 4" />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs font-mono text-text-secondary">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="portfolio"
                name="My Portfolio"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#22c55e', stroke: '#0a0f1e', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="sp500"
                name="S&P 500"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 3, fill: '#94a3b8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        !loading && <div className="text-text-muted text-sm text-center py-10">Loading benchmark data…</div>
      )}

      <div className="text-xs text-text-muted">
        Both series normalised to 100 at first buy date. Beta = market sensitivity. Alpha = excess annual return.
      </div>
    </div>
  )
}
