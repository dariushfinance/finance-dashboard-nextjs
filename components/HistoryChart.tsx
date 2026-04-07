'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Position, HistoryResult } from '@/types'

interface Props { positions: Position[] }

export default function HistoryChart({ positions }: Props) {
  const [data, setData] = useState<HistoryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!positions.length) return
    setLoading(true)
    setError('')
    fetch('/api/history', {
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
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false))
  }, [positions])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-bg-elevated border border-bg-border rounded-lg p-3 text-xs font-mono">
        <div className="text-text-muted mb-1">{label}</div>
        <div className="text-brand-green font-semibold">
          ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>
    )
  }

  const formatYAxis = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}k` : `$${v}`

  return (
    <div className="fin-card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Portfolio History</h2>
        {loading && <span className="spinner" />}
      </div>

      {/* Sharpe + Volatility */}
      {data && (data.sharpe != null || data.volatility != null) && (
        <div className="grid grid-cols-2 gap-4">
          {data.sharpe != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">Sharpe Ratio</div>
              <div className={`font-mono text-xl font-semibold ${data.sharpe >= 1 ? 'pos' : data.sharpe >= 0 ? 'text-brand-gold' : 'neg'}`}>
                {data.sharpe.toFixed(2)}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {data.sharpe >= 2 ? 'Excellent' : data.sharpe >= 1 ? 'Good' : data.sharpe >= 0 ? 'Acceptable' : 'Poor'} risk-adjusted return
              </div>
            </div>
          )}
          {data.volatility != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">Annualised Volatility</div>
              <div className="font-mono text-xl font-semibold text-text-primary">
                {(data.volatility * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-text-muted mt-1">
                {data.volatility < 0.15 ? 'Low' : data.volatility < 0.25 ? 'Medium' : 'High'} volatility
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div className="text-brand-red text-sm">{error}</div>}

      {data?.history?.length ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.history} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#portGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#22c55e', stroke: '#0a0f1e', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        !loading && <div className="text-text-muted text-sm text-center py-10">Loading historical data…</div>
      )}
    </div>
  )
}
