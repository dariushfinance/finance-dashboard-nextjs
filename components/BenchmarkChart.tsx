'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import type { Position, BenchmarkResult } from '@/types'

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

interface Props { positions: Position[] }

export default function BenchmarkChart({ positions }: Props) {
  const [data, setData]     = useState<BenchmarkResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [range, setRange]   = useState<Range>('1Y')

  useEffect(() => {
    if (!positions.length) return
    setLoading(true); setError('')
    fetch('/api/benchmark', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: positions.map(p => ({ ticker: p.ticker, shares: p.shares, buy_date: p.buy_date })) }),
    })
      .then(r => r.json()).then(setData)
      .catch(() => setError('Failed to load benchmark'))
      .finally(() => setLoading(false))
  }, [positions])

  const series = data ? filterByRange(data.data, range) : []
  const lastPort = series[series.length - 1]?.portfolio ?? 100
  const lastSP   = series[series.length - 1]?.sp500 ?? 100
  const portOut  = lastPort - lastSP // outperformance vs SP500

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
  }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 11,
        padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12,
        boxShadow: 'var(--shadow-hi)',
      }}>
        <div style={{ color: 'var(--ink-3)', marginBottom: 7, fontSize: 11 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color, marginBottom: 3, fontWeight: 600 }}>
            {p.name}: {p.value.toFixed(2)}
          </div>
        ))}
        {payload.length === 2 && (
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--line-soft)', fontSize: 10.5, color: payload[0].value >= payload[1].value ? 'var(--pos)' : 'var(--neg)' }}>
            Spread: {(payload[0].value - payload[1].value) > 0 ? '+' : ''}{(payload[0].value - payload[1].value).toFixed(2)}
          </div>
        )}
      </div>
    )
  }

  const BetaTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    const b = payload[0].value
    return (
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 9, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        <div style={{ color: 'var(--ink-3)', marginBottom: 3 }}>{label}</div>
        <div style={{ color: b > 1.2 ? 'var(--neg)' : b > 0.8 ? 'var(--warn)' : 'var(--pos)', fontWeight: 700 }}>β = {b.toFixed(2)}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stat cards */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Beta (β)',         val: data.beta,            fmt: (v: number) => v.toFixed(2),         variant: data.beta != null ? (data.beta > 1.2 ? 'neg' : data.beta > 0.8 ? 'warn' : 'pos') : '',  sub: data.beta != null ? (data.beta > 1.2 ? 'High market sensitivity' : data.beta > 0.8 ? 'Market-like' : 'Defensive') : '—' },
            { label: "Jensen's Alpha",   val: data.alpha,           fmt: (v: number) => `${v >= 0 ? '+' : ''}${(v*100).toFixed(2)}%`, variant: data.alpha != null ? (data.alpha >= 0 ? 'pos' : 'neg') : '', sub: data.alpha != null ? (data.alpha >= 0 ? 'Outperforming CAPM' : 'Underperforming CAPM') : '—' },
            { label: 'Information Ratio',val: data.informationRatio, fmt: (v: number) => v.toFixed(2),        variant: data.informationRatio != null ? (data.informationRatio >= 0.5 ? 'pos' : data.informationRatio >= 0 ? 'warn' : 'neg') : '', sub: data.informationRatio != null ? (data.informationRatio >= 0.5 ? 'Strong active return' : data.informationRatio >= 0 ? 'Modest' : 'Underperforming') : '—' },
          ].filter(m => m.val != null).map(m => (
            <div key={m.label} className="stat-box">
              <div className="stat-box__label">{m.label}</div>
              <div className={`stat-box__val ${m.variant}`}>{m.fmt(m.val as number)}</div>
              <div className="stat-box__sub">{m.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main chart — rebased to 100 */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card__head">
          <div>
            <div className="card__title">Portfolio vs. S&amp;P 500</div>
            <div className="card__sub">
              Rebased to 100 at start of period · TWR
              {series.length >= 2 && (
                <span style={{ marginLeft: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: portOut >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                  · {portOut >= 0 ? '+' : ''}{portOut.toFixed(2)} vs S&P 500
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
          <div style={{ height: 400, padding: '24px 12px 8px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 20, bottom: 8, left: 52 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--line-soft)" vertical={false} />
                <XAxis
                  dataKey="date" interval="preserveStartEnd"
                  tick={{ fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                  tickLine={false} axisLine={false}
                />
                <YAxis
                  width={48} tickFormatter={v => v.toFixed(0)}
                  tick={{ fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                  tickLine={false} axisLine={false}
                />
                <ReferenceLine y={100} stroke="var(--line)" strokeDasharray="4 4" />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}
                />
                <Line
                  type="monotone" dataKey="portfolio" name="My Portfolio"
                  stroke="var(--pos)" strokeWidth={2.5} dot={false}
                  activeDot={{ r: 5, fill: 'var(--pos)', stroke: 'var(--bg-1)', strokeWidth: 2.5 }}
                />
                <Line
                  type="monotone" dataKey="sp500" name="S&P 500"
                  stroke="var(--ink-3)" strokeWidth={1.8} strokeDasharray="5 4" dot={false}
                  activeDot={{ r: 4, fill: 'var(--ink-3)', stroke: 'var(--bg-1)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : !loading && (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Loading benchmark data…
          </div>
        )}

        {/* Rolling Beta */}
        {data?.rollingBeta && data.rollingBeta.length > 0 && (
          <>
            <div style={{ padding: '18px 22px 10px', borderTop: '1px solid var(--line-soft)' }}>
              <div className="card__title" style={{ fontSize: 13 }}>Rolling Beta (63-day)</div>
              <div className="card__sub">Market sensitivity over time · &gt;1 amplifies moves · &lt;1 defensive</div>
            </div>
            <div style={{ height: 240, padding: '0 12px 16px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filterByRange(data.rollingBeta, range)}
                  margin={{ top: 4, right: 20, bottom: 4, left: 52 }}
                >
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--line-soft)" vertical={false} />
                  <XAxis dataKey="date" interval="preserveStartEnd" tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                  <YAxis width={48} tickFormatter={v => v.toFixed(1)} tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                  <ReferenceLine y={1} stroke="var(--line)" strokeDasharray="4 4" />
                  <Tooltip content={<BetaTooltip />} />
                  <Line type="monotone" dataKey="beta" stroke="var(--warn)" strokeWidth={2} dot={false}
                    activeDot={{ r: 4, fill: 'var(--warn)', stroke: 'var(--bg-1)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--line-soft)', fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
          Portfolio rebased to 100. Beta = market sensitivity. Alpha = Jensen's (CAPM-adjusted, annualised). IR = active return / tracking error.
        </div>
      </div>
    </div>
  )
}
