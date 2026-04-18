'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Position, BenchmarkResult } from '@/types'

const RANGES = ['1M', '3M', 'YTD', '1Y', 'All'] as const
type Range = (typeof RANGES)[number]

function filterByRange<T extends { date: string }>(arr: T[], range: Range): T[] {
  if (range === 'All' || !arr.length) return arr
  const now = new Date()
  const cutoff = new Date(now)
  if (range === '1M') cutoff.setMonth(now.getMonth() - 1)
  else if (range === '3M') cutoff.setMonth(now.getMonth() - 3)
  else if (range === 'YTD') { cutoff.setMonth(0); cutoff.setDate(1) }
  else if (range === '1Y') cutoff.setFullYear(now.getFullYear() - 1)
  return arr.filter((d) => new Date(d.date) >= cutoff)
}

interface Props { positions: Position[] }

export default function BenchmarkChart({ positions }: Props) {
  const [data, setData] = useState<BenchmarkResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [range, setRange] = useState<Range>('1Y')

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold text-text-primary">Portfolio vs. S&amp;P 500</h2>
        <div className="flex items-center gap-2">
          {loading && <span className="spinner" />}
          <div className="flex items-center gap-0.5 bg-bg-elevated rounded-lg p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                  range === r
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Beta, Alpha, IR */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="text-xs text-text-muted mb-1">Jensen's Alpha (ann.)</div>
              <div className={`font-mono text-xl font-semibold ${data.alpha >= 0 ? 'pos' : 'neg'}`}>
                {data.alpha >= 0 ? '+' : ''}{(data.alpha * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-text-muted mt-1">
                {data.alpha >= 0 ? 'Outperforming' : 'Underperforming'} vs CAPM
              </div>
            </div>
          )}
          {data.informationRatio != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">Information Ratio</div>
              <div className={`font-mono text-xl font-semibold ${data.informationRatio >= 0.5 ? 'pos' : data.informationRatio >= 0 ? 'text-brand-gold' : 'neg'}`}>
                {data.informationRatio.toFixed(2)}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {data.informationRatio >= 0.5 ? 'Strong active return' : data.informationRatio >= 0 ? 'Modest outperformance' : 'Underperforming index'}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div className="text-brand-red text-sm">{error}</div>}

      {data?.data?.length ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filterByRange(data.data, range)} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
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
        Portfolio: TWR index (capital flows excluded). Beta = market sensitivity. Alpha = Jensen's (CAPM-adjusted). IR = active return / tracking error.
      </div>

      {/* Rolling Beta chart */}
      {data?.rollingBeta && data.rollingBeta.length > 0 && (
        <div className="pt-4 border-t border-bg-border space-y-2">
          <div>
            <div className="font-semibold text-text-primary text-sm">Rolling Beta (63d)</div>
            <div className="text-xs text-text-muted">How market sensitivity has changed over time · &gt;1 = amplifies market moves · &lt;1 = defensive</div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filterByRange(data.rollingBeta, range)} margin={{ top: 4, right: 32, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => v.toFixed(1)} />
                <ReferenceLine y={1} stroke="#475569" strokeDasharray="4 4" label={{ value: 'β=1', position: 'right', fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const b = payload[0].value as number
                    return (
                      <div className="bg-bg-elevated border border-bg-border rounded-lg p-3 text-xs font-mono">
                        <div className="text-text-muted mb-1">{label}</div>
                        <div className={b > 1.2 ? 'text-brand-red' : b > 0.8 ? 'text-brand-gold' : 'text-brand-green'}>
                          β = {b.toFixed(2)}
                        </div>
                      </div>
                    )
                  }}
                />
                <Line type="monotone" dataKey="beta" stroke="#f59e0b" strokeWidth={1.5} dot={false}
                  activeDot={{ r: 3, fill: '#f59e0b', stroke: '#0a0f1e', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
