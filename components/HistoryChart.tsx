'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Position, HistoryResult } from '@/types'

const RANGES = ['1M', '3M', 'YTD', '1Y', 'All'] as const
type Range = typeof RANGES[number]

function filterByRange<T extends { date: string }>(arr: T[], range: Range): T[] {
  if (range === 'All' || !arr.length) return arr
  const now = new Date(); const cut = new Date(now)
  if (range === '1M')  cut.setMonth(now.getMonth() - 1)
  if (range === '3M')  cut.setMonth(now.getMonth() - 3)
  if (range === 'YTD') { cut.setMonth(0); cut.setDate(1) }
  if (range === '1Y')  cut.setFullYear(now.getFullYear() - 1)
  return arr.filter(d => new Date(d.date) >= cut)
}

const fmtY = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `$${(v / 1_000).toFixed(0)}K`
  : `$${v}`

interface Props { positions: Position[] }

export default function HistoryChart({ positions }: Props) {
  const [data, setData]     = useState<HistoryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [range, setRange]   = useState<Range>('1Y')

  useEffect(() => {
    if (!positions.length) return
    setLoading(true); setError('')
    fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(r => r.json()).then(setData)
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false))
  }, [positions])

  const series = data ? filterByRange(data.history, range) : []

  // Compute range performance
  const perf = series.length >= 2
    ? ((series[series.length - 1].value - series[0].value) / series[0].value) * 100
    : null

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 11,
        padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12,
        boxShadow: 'var(--shadow-hi)',
      }}>
        <div style={{ color: 'var(--ink-3)', marginBottom: 5, fontSize: 11 }}>{label}</div>
        <div style={{ color: 'var(--pos)', fontWeight: 700, fontSize: 15 }}>
          ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Risk metrics */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {[
            { label: 'Sharpe Ratio',    val: data.sharpe,     fmt: (v: number) => v.toFixed(2),           variant: data.sharpe != null ? (data.sharpe >= 1 ? 'pos' : data.sharpe >= 0 ? 'warn' : 'neg') : '',  sub: data.sharpe != null ? (data.sharpe >= 2 ? 'Excellent' : data.sharpe >= 1 ? 'Good' : data.sharpe >= 0 ? 'Acceptable' : 'Poor') : '—' },
            { label: 'Sortino Ratio',   val: data.sortino,    fmt: (v: number) => v.toFixed(2),           variant: data.sortino != null ? (data.sortino >= 1 ? 'pos' : data.sortino >= 0 ? 'warn' : 'neg') : '', sub: 'Downside-adjusted' },
            { label: 'Ann. Volatility', val: data.volatility, fmt: (v: number) => `${(v*100).toFixed(1)}%`, variant: data.volatility != null ? (data.volatility < 0.15 ? 'pos' : data.volatility < 0.25 ? 'warn' : 'neg') : '', sub: data.volatility != null ? (data.volatility < 0.15 ? 'Low' : data.volatility < 0.25 ? 'Medium' : 'High') : '—' },
            { label: 'Max Drawdown',    val: data.maxDrawdown,fmt: (v: number) => `-${(v*100).toFixed(1)}%`, variant: data.maxDrawdown != null ? (data.maxDrawdown > 0.2 ? 'neg' : data.maxDrawdown > 0.1 ? 'warn' : 'pos') : '', sub: 'Peak-to-trough' },
            { label: 'VaR 95% (1d)',    val: data.var95,      fmt: (v: number) => `-${(v*100).toFixed(2)}%`, variant: 'neg', sub: 'Worst day 19/20' },
            { label: 'CVaR / ES 95%',   val: data.cvar95,     fmt: (v: number) => `-${(v*100).toFixed(2)}%`, variant: 'neg', sub: 'Expected tail loss' },
          ].filter(m => m.val != null).map(m => (
            <div key={m.label} className="stat-box">
              <div className="stat-box__label">{m.label}</div>
              <div className={`stat-box__val ${m.variant}`}>{m.fmt(m.val as number)}</div>
              <div className="stat-box__sub">{m.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main chart card */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card__head">
          <div>
            <div className="card__title">Portfolio Value History</div>
            <div className="card__sub">
              TWR · capital injections excluded
              {perf != null && (
                <span style={{ marginLeft: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: perf >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                  {perf >= 0 ? '+' : ''}{perf.toFixed(2)}% in range
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {loading && <span className="spinner" />}
            <div className="range-tabs">
              {RANGES.map(r => (
                <button key={r} className={`range-tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        {error && <div style={{ padding: '16px 22px', color: 'var(--neg)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{error}</div>}

        {series.length > 0 ? (
          <div style={{ height: 420, padding: '24px 12px 8px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 20, bottom: 8, left: 56 }}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="var(--pos)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--pos)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--line-soft)" vertical={false} />
                <XAxis
                  dataKey="date" interval="preserveStartEnd"
                  tick={{ fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                  tickLine={false} axisLine={false}
                />
                <YAxis
                  tickFormatter={fmtY} width={52}
                  tick={{ fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                  tickLine={false} axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="value"
                  stroke="var(--pos)" strokeWidth={2.5}
                  fill="url(#histGrad)" dot={false}
                  activeDot={{ r: 5, fill: 'var(--pos)', stroke: 'var(--bg-1)', strokeWidth: 2.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : !loading && (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Loading historical data…
          </div>
        )}

        {/* TWR returns chart */}
        {data?.twrReturns && data.twrReturns.length > 20 && (
          <>
            <div style={{ padding: '18px 22px 10px', borderTop: '1px solid var(--line-soft)' }}>
              <div className="card__title" style={{ fontSize: 13 }}>Daily TWR Returns</div>
              <div className="card__sub">Daily portfolio return stream · green = gain · red = loss</div>
            </div>
            <div style={{ height: 180, padding: '0 12px 16px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filterByRange(data.twrReturns.map(d => ({ date: d.date, ret: +(d.ret * 100).toFixed(3) })), range)}
                  margin={{ top: 4, right: 20, bottom: 4, left: 56 }}
                >
                  <defs>
                    <linearGradient id="retGradPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--pos)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--pos)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--line-soft)" vertical={false} />
                  <XAxis dataKey="date" interval="preserveStartEnd" tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                  <YAxis width={52} tickFormatter={v => `${v.toFixed(1)}%`} tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                  <ReferenceLine y={0} stroke="var(--line)" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const v = payload[0].value as number
                      return (
                        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 9, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                          <div style={{ color: 'var(--ink-3)', marginBottom: 3 }}>{label}</div>
                          <div style={{ color: v >= 0 ? 'var(--pos)' : 'var(--neg)', fontWeight: 700 }}>{v >= 0 ? '+' : ''}{v.toFixed(3)}%</div>
                        </div>
                      )
                    }}
                  />
                  <Area type="monotone" dataKey="ret" stroke="var(--pos)" strokeWidth={1.5} fill="url(#retGradPos)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--line-soft)', fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
          TWR = Time-Weighted Return · strips capital injection distortion · VaR/CVaR require ≥30 data points
        </div>
      </div>
    </div>
  )
}
