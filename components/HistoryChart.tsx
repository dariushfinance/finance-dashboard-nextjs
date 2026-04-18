'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Position, HistoryResult } from '@/types'

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

export default function HistoryChart({ positions }: Props) {
  const [data, setData] = useState<HistoryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [range, setRange] = useState<Range>('1Y')

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold text-text-primary">Portfolio History</h2>
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

      {/* Risk metrics grid */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {data.sharpe != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">Sharpe Ratio</div>
              <div className={`font-mono text-xl font-semibold ${data.sharpe >= 1 ? 'pos' : data.sharpe >= 0 ? 'text-brand-gold' : 'neg'}`}>
                {data.sharpe.toFixed(2)}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {data.sharpe >= 2 ? 'Excellent' : data.sharpe >= 1 ? 'Good' : data.sharpe >= 0 ? 'Acceptable' : 'Poor'}
              </div>
            </div>
          )}
          {data.sortino != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">Sortino Ratio</div>
              <div className={`font-mono text-xl font-semibold ${data.sortino >= 1 ? 'pos' : data.sortino >= 0 ? 'text-brand-gold' : 'neg'}`}>
                {data.sortino.toFixed(2)}
              </div>
              <div className="text-xs text-text-muted mt-1">Downside-adjusted</div>
            </div>
          )}
          {data.volatility != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">Ann. Volatility</div>
              <div className="font-mono text-xl font-semibold text-text-primary">
                {(data.volatility * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-text-muted mt-1">
                {data.volatility < 0.15 ? 'Low' : data.volatility < 0.25 ? 'Medium' : 'High'}
              </div>
            </div>
          )}
          {data.maxDrawdown != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">Max Drawdown</div>
              <div className={`font-mono text-xl font-semibold ${data.maxDrawdown > 0.2 ? 'neg' : data.maxDrawdown > 0.1 ? 'text-brand-gold' : 'pos'}`}>
                -{(data.maxDrawdown * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-text-muted mt-1">Peak-to-trough (TWR)</div>
            </div>
          )}
          {data.var95 != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">VaR (95%, 1d)</div>
              <div className="font-mono text-xl font-semibold neg">
                -{(data.var95 * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-text-muted mt-1">Worst day 19/20 sessions</div>
            </div>
          )}
          {data.cvar95 != null && (
            <div className="bg-bg-elevated rounded-lg p-3">
              <div className="text-xs text-text-muted mb-1">CVaR / ES (95%)</div>
              <div className="font-mono text-xl font-semibold neg">
                -{(data.cvar95 * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-text-muted mt-1">Expected tail loss</div>
            </div>
          )}
        </div>
      )}

      {error && <div className="text-brand-red text-sm">{error}</div>}

      {data?.history?.length ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filterByRange(data.history, range)} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
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
