'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Position, CorrelationResult } from '@/types'

// ── Math helpers ─────────────────────────────────────────────────────────────

function rollingAnnualisedVol(returns: number[], window = 21): (number | null)[] {
  return returns.map((_, i) => {
    if (i < window - 1) return null
    const slice = returns.slice(i - window + 1, i + 1)
    const m = slice.reduce((a, b) => a + b, 0) / slice.length
    const variance = slice.reduce((a, b) => a + (b - m) ** 2, 0) / (slice.length - 1)
    return Math.sqrt(variance) * Math.sqrt(252)
  })
}

function volRegime(vols: (number | null)[]): { regime: 'Low' | 'Medium' | 'High'; percentile: number } {
  const valid = vols.filter((v): v is number => v !== null)
  if (!valid.length) return { regime: 'Medium', percentile: 0.5 }
  const current = valid[valid.length - 1]
  const sorted = [...valid].sort((a, b) => a - b)
  const percentile = sorted.filter(v => v <= current).length / sorted.length
  return {
    regime: percentile < 0.33 ? 'Low' : percentile < 0.67 ? 'Medium' : 'High',
    percentile,
  }
}

// TWR-based monthly returns (capital-injection-free)
function computeMonthlyTWRReturns(twrReturns: { date: string; ret: number }[]) {
  const months = new Map<string, { year: number; month: number; chained: number }>()
  for (const { date, ret } of twrReturns) {
    const key = date.slice(0, 7)
    const [y, m] = key.split('-').map(Number)
    const entry = months.get(key)
    if (!entry) months.set(key, { year: y, month: m, chained: 1 + ret })
    else         entry.chained *= (1 + ret)
  }
  return [...months.values()]
    .map(({ year, month, chained }) => ({ year, month, ret: chained - 1 }))
    .sort((a, b) => a.year - b.year || a.month - b.month)
}

// ── Correlation colour (OKLCH-safe CSS) ────────────────────────────────────────
// +1 → red (correlated, bad), -1 → blue (negative corr), 0 → neutral

function corrBg(v: number): string {
  if (v >= 0.9) return 'oklch(0.40 0.16 25)'   // diagonal / perfect
  if (v >= 0.6) return 'oklch(0.35 0.13 25)'
  if (v >= 0.4) return 'oklch(0.32 0.09 25)'
  if (v >= 0.2) return 'oklch(0.30 0.05 25)'
  if (v >= -0.2) return 'oklch(0.22 0.012 250)' // neutral
  if (v >= -0.4) return 'oklch(0.27 0.06 240)'
  return 'oklch(0.32 0.12 240)'                  // negatively correlated (hedge)
}

function monthRetBg(ret: number): string {
  const t = Math.min(Math.abs(ret) / 0.10, 1)
  if (ret >= 0) return `oklch(${0.22 + t * 0.20} ${t * 0.14} 160)`
  return `oklch(${0.22 + t * 0.18} ${t * 0.16} 25)`
}

// ── Diversification label ────────────────────────────────────────────────────

function diversLabel(avg: number): { text: string; color: string } {
  if (avg < 0.20) return { text: 'Well diversified',    color: 'var(--pos)' }
  if (avg < 0.40) return { text: 'Moderate correlation', color: 'var(--warn)' }
  if (avg < 0.60) return { text: 'High correlation',     color: 'var(--neg)' }
  return                  { text: 'Very concentrated',   color: 'var(--neg)' }
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Component ────────────────────────────────────────────────────────────────

interface Props { positions: Position[] }

export default function RiskTab({ positions }: Props) {
  const [twrReturns, setTwrReturns] = useState<{ date: string; ret: number }[]>([])
  const [corrData,   setCorrData]   = useState<CorrelationResult | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (!positions.length) return
    setLoading(true); setError('')
    const tickers  = [...new Set(positions.map(p => p.ticker))]
    const histBody = { positions: positions.map(p => ({ ticker: p.ticker, shares: p.shares, buy_date: p.buy_date })) }
    Promise.all([
      fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(histBody) }).then(r => r.json()),
      fetch('/api/correlation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tickers }) }).then(r => r.json()),
    ])
      .then(([hist, corr]) => {
        setTwrReturns(hist.twrReturns ?? [])
        setCorrData(corr)
      })
      .catch(() => setError('Failed to load risk data'))
      .finally(() => setLoading(false))
  }, [positions])

  // ── Rolling vol — use TWR returns (excludes capital injection distortion) ──
  const { volChart, regime } = useMemo(() => {
    if (!twrReturns.length) return { volChart: [], regime: { regime: 'Medium' as const, percentile: 0.5 } }
    // Cap extreme daily moves (±25%) to prevent data artifacts from distorting the window
    const cleanRets = twrReturns.map(d => Math.max(-0.25, Math.min(0.25, d.ret)))
    const vols      = rollingAnnualisedVol(cleanRets, 21)
    const volChart  = twrReturns
      .map((d, i) => ({ date: d.date, vol: vols[i] != null ? +(vols[i]! * 100).toFixed(2) : null }))
      .filter(d => d.vol !== null)
    return { volChart, regime: volRegime(vols) }
  }, [twrReturns])

  const monthly      = useMemo(() => computeMonthlyTWRReturns(twrReturns), [twrReturns])
  const calendarYears = useMemo(() => [...new Set(monthly.map(m => m.year))].sort((a, b) => b - a), [monthly])
  const calendarMap  = useMemo(() => {
    const map = new Map<string, number>()
    for (const { year, month, ret } of monthly) map.set(`${year}-${month}`, ret)
    return map
  }, [monthly])

  const regimeColor = regime.regime === 'Low' ? 'var(--pos)' : regime.regime === 'Medium' ? 'var(--warn)' : 'var(--neg)'

  if (!positions.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── 1. Rolling Volatility ─────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card__head">
          <div>
            <div className="card__title">Rolling Volatility</div>
            <div className="card__sub">
              21-day annualised · TWR-adjusted (capital injections excluded) · spikes = volatility clustering
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {loading && <span className="spinner" />}
            <div style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              border: `1px solid ${regimeColor}`,
              color: regimeColor,
              background: `${regimeColor.replace(')', ' / 0.08)').replace('var(', 'color-mix(in oklch,').replace(', ', ' 8%, transparent)')}`,
            }}>
              {regime.regime} · {(regime.percentile * 100).toFixed(0)}th pct
            </div>
          </div>
        </div>

        {error && <div style={{ padding: '16px 22px', color: 'var(--neg)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{error}</div>}

        {volChart.length > 0 ? (
          <div style={{ height: 240, padding: '16px 8px 8px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volChart} margin={{ top: 8, right: 24, bottom: 8, left: 48 }}>
                <defs>
                  <linearGradient id="vol-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--warn)" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="var(--warn)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="date" interval="preserveStartEnd"
                  tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                  tickLine={false} axisLine={false}
                />
                <YAxis
                  tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                  tickLine={false} axisLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const v = payload[0].value as number
                    const c = v < 15 ? 'var(--pos)' : v < 25 ? 'var(--warn)' : 'var(--neg)'
                    return (
                      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        <div style={{ color: 'var(--ink-3)', marginBottom: 4 }}>{label}</div>
                        <div style={{ color: c, fontWeight: 700 }}>{v}% ann. vol</div>
                      </div>
                    )
                  }}
                />
                <ReferenceLine y={15} stroke="var(--pos)"  strokeDasharray="4 4" strokeOpacity={0.5} />
                <ReferenceLine y={25} stroke="var(--warn)" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="vol" stroke="var(--warn)" strokeWidth={2} fill="url(#vol-grad)" dot={false} activeDot={{ r: 3, fill: 'var(--warn)', stroke: 'var(--bg-1)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : !loading && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Need at least 22 trading days of TWR history.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid var(--line-soft)' }}>
          {[
            { label: 'Low  < 15%',   color: 'var(--pos)',  hint: 'Calm · hold full position' },
            { label: 'Med  15–25%',  color: 'var(--warn)', hint: 'Normal · monitor closely' },
            { label: 'High > 25%',   color: 'var(--neg)',  hint: 'Stress · consider trimming' },
          ].map(({ label, color, hint }, i) => (
            <div key={label} style={{ padding: '14px 18px', borderRight: i < 2 ? '1px solid var(--line-soft)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Correlation Matrix ─────────────────────────────────────────── */}
      {corrData && corrData.tickers.length >= 2 && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card__head">
            <div>
              <div className="card__title">Correlation Matrix</div>
              <div className="card__sub">
                Log-return correlation · 1-year lookback
                {corrData.avgOffDiagonal != null && (() => {
                  const { text, color } = diversLabel(corrData.avgOffDiagonal)
                  return (
                    <span style={{ marginLeft: 8, fontWeight: 600, color }}>
                      · avg ρ = {corrData.avgOffDiagonal.toFixed(2)} — {text}
                    </span>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Correlation legend */}
          <div style={{ padding: '10px 22px 6px', display: 'flex', gap: 16, fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>
            {[
              { label: '> 0.6  High (red)',    bg: corrBg(0.8), text: 'white' },
              { label: '0.2–0.6 Moderate',     bg: corrBg(0.4), text: 'white' },
              { label: '≈ 0  Neutral',          bg: corrBg(0.0), text: 'var(--ink-3)' },
              { label: '< 0  Hedge (blue)',     bg: corrBg(-0.5), text: 'white' },
            ].map(({ label, bg, text }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, flexShrink: 0 }} />
                <span style={{ color: 'var(--ink-4)' }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ overflowX: 'auto', padding: '8px 22px 20px' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
              <thead>
                <tr>
                  <th style={{ width: 56 }} />
                  {corrData.tickers.map(t => (
                    <th key={t} style={{ fontSize: 10.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', textAlign: 'center', width: 56, paddingBottom: 4, fontWeight: 600 }}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corrData.tickers.map((rowTicker, i) => (
                  <tr key={rowTicker}>
                    <td style={{ fontSize: 10.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', textAlign: 'right', paddingRight: 6, fontWeight: 600 }}>
                      {rowTicker}
                    </td>
                    {corrData.tickers.map((_, j) => {
                      const val    = corrData.matrix[i][j]
                      const isDiag = i === j
                      return (
                        <td
                          key={j}
                          title={`${rowTicker} / ${corrData.tickers[j]}: ${val.toFixed(3)}`}
                          style={{
                            width: 56, height: 40, textAlign: 'center',
                            borderRadius: 6,
                            background: isDiag ? 'var(--bg-3)' : corrBg(val),
                            transition: 'transform 0.15s',
                            cursor: 'default',
                          }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.08)')}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
                        >
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                            color: isDiag ? 'var(--ink-3)' : 'oklch(0.97 0.004 90)',
                          }}>
                            {val.toFixed(2)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3. Monthly Calendar ──────────────────────────────────────────── */}
      {monthly.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card__head">
            <div>
              <div className="card__title">Monthly Returns Calendar</div>
              <div className="card__sub">TWR · green = gain · red = loss · full saturation at ±10%</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto', padding: '12px 22px 20px' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 3, width: '100%', minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 10.5, color: 'var(--ink-4)', fontWeight: 500, textAlign: 'left', paddingBottom: 6, width: 44 }}>Year</th>
                  {MONTHS.map(m => (
                    <th key={m} style={{ fontSize: 10.5, color: 'var(--ink-4)', fontWeight: 500, textAlign: 'center', minWidth: 50, paddingBottom: 6 }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarYears.map(year => (
                  <tr key={year}>
                    <td style={{ fontSize: 10.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontWeight: 600, paddingRight: 6 }}>{year}</td>
                    {Array.from({ length: 12 }, (_, idx) => {
                      const ret = calendarMap.get(`${year}-${idx + 1}`)
                      if (ret == null) {
                        return <td key={idx} style={{ height: 32, borderRadius: 6, background: 'var(--bg-2)', opacity: 0.4 }} />
                      }
                      return (
                        <td
                          key={idx}
                          title={`${MONTHS[idx]} ${year}: ${(ret * 100).toFixed(2)}%`}
                          style={{ height: 32, textAlign: 'center', borderRadius: 6, background: monthRetBg(ret), transition: 'transform 0.15s', cursor: 'default' }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.05)')}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
                        >
                          <span style={{ color: 'oklch(0.97 0.004 90)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600 }}>
                            {ret >= 0 ? '+' : ''}{(ret * 100).toFixed(1)}%
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
