'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Position, CorrelationResult } from '@/types'

// ── Math helpers ──────────────────────────────────────────────────────────────

function toLogReturns(values: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < values.length; i++) {
    out.push(values[i - 1] > 0 && values[i] > 0 ? Math.log(values[i] / values[i - 1]) : 0)
  }
  return out
}

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
  const percentile = sorted.filter((v) => v <= current).length / sorted.length
  const regime = percentile < 0.33 ? 'Low' : percentile < 0.67 ? 'Medium' : 'High'
  return { regime, percentile }
}

// Chain-link TWR daily returns within each calendar month.
// This is the correct approach — raw value comparison is distorted by capital injections.
function computeMonthlyTWRReturns(twrReturns: { date: string; ret: number }[]) {
  const months = new Map<string, { year: number; month: number; chained: number }>()
  for (const { date, ret } of twrReturns) {
    const key = date.slice(0, 7)
    const [y, m] = key.split('-').map(Number)
    const entry = months.get(key)
    if (!entry) {
      months.set(key, { year: y, month: m, chained: 1 + ret })
    } else {
      entry.chained *= (1 + ret)
    }
  }
  return [...months.values()]
    .map(({ year, month, chained }) => ({ year, month, ret: chained - 1 }))
    .sort((a, b) => a.year - b.year || a.month - b.month)
}

// ── Color helpers ─────────────────────────────────────────────────────────────

// Dark theme: 0 → bg-elevated (#1a2236), +1 → red (#ef4444), -1 → blue (#3b82f6)
function corrColor(corr: number): string {
  if (corr >= 0) {
    const t = corr
    return `rgb(${lerp(26, 239, t)},${lerp(34, 68, t)},${lerp(54, 68, t)})`
  } else {
    const t = -corr
    return `rgb(${lerp(26, 59, t)},${lerp(34, 130, t)},${lerp(54, 246, t)})`
  }
}

function monthRetColor(ret: number): string {
  const t = Math.min(Math.abs(ret) / 0.1, 1) // full saturation at ±10%
  return ret >= 0
    ? `rgb(${lerp(26, 22, t)},${lerp(34, 197, t)},${lerp(54, 94, t)})`
    : `rgb(${lerp(26, 239, t)},${lerp(34, 68, t)},${lerp(54, 68, t)})`
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const REGIME_STYLE = {
  Low:    'text-brand-green border-brand-green/30 bg-brand-green/10',
  Medium: 'text-brand-gold  border-brand-gold/30  bg-brand-gold/10',
  High:   'text-brand-red   border-brand-red/30   bg-brand-red/10',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { positions: Position[] }

export default function RiskTab({ positions }: Props) {
  const [historyValues, setHistoryValues] = useState<{ date: string; value: number }[]>([])
  const [twrReturns, setTwrReturns] = useState<{ date: string; ret: number }[]>([])
  const [corrData, setCorrData] = useState<CorrelationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!positions.length) return
    setLoading(true)
    setError('')

    const tickers = [...new Set(positions.map((p) => p.ticker))]
    const histBody = {
      positions: positions.map((p) => ({ ticker: p.ticker, shares: p.shares, buy_date: p.buy_date })),
    }

    Promise.all([
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(histBody),
      }).then((r) => r.json()),
      fetch('/api/correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers }),
      }).then((r) => r.json()),
    ])
      .then(([hist, corr]) => {
        setHistoryValues(hist.history ?? [])
        setTwrReturns(hist.twrReturns ?? [])
        setCorrData(corr)
      })
      .catch(() => setError('Failed to load risk data'))
      .finally(() => setLoading(false))
  }, [positions])

  // ── Derived ───────────────────────────────────────────────────────────────

  const { volChart, regime } = useMemo(() => {
    if (!historyValues.length) return { volChart: [], regime: { regime: 'Medium' as const, percentile: 0.5 } }
    const values = historyValues.map((h) => h.value)
    const dates  = historyValues.map((h) => h.date)
    const rets   = toLogReturns(values)
    const vols   = rollingAnnualisedVol(rets, 21)
    const volChart = dates.slice(1)
      .map((date, i) => ({ date, vol: vols[i] != null ? +(vols[i]! * 100).toFixed(2) : null }))
      .filter((d) => d.vol !== null)
    return { volChart, regime: volRegime(vols) }
  }, [historyValues])

  const monthly = useMemo(() => computeMonthlyTWRReturns(twrReturns), [twrReturns])
  const calendarYears = useMemo(
    () => [...new Set(monthly.map((m) => m.year))].sort((a, b) => b - a),
    [monthly]
  )
  const calendarMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const { year, month, ret } of monthly) map.set(`${year}-${month}`, ret)
    return map
  }, [monthly])

  if (!positions.length) return null

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── 1. Rolling Volatility ─────────────────────────────────────────── */}
      <div className="fin-card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-text-primary">Rolling Volatility</h2>
            <p className="text-xs text-text-muted mt-0.5">
              21-day annualised · spikes = volatility clustering · regime = percentile vs own history
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {loading && <span className="spinner" />}
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${REGIME_STYLE[regime.regime]}`}>
              {regime.regime} Regime · {(regime.percentile * 100).toFixed(0)}th pct
            </span>
          </div>
        </div>

        {error && <div className="text-brand-red text-sm">{error}</div>}

        {volChart.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volChart} margin={{ top: 4, right: 32, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const v = payload[0].value as number
                    const color = v < 15 ? '#22c55e' : v < 25 ? '#f59e0b' : '#ef4444'
                    return (
                      <div className="bg-bg-elevated border border-bg-border rounded-lg p-3 text-xs font-mono">
                        <div className="text-text-muted mb-1">{label}</div>
                        <div style={{ color }} className="font-semibold">{v}% ann. vol</div>
                      </div>
                    )
                  }}
                />
                {/* Regime threshold lines */}
                <ReferenceLine y={15} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.35}
                  label={{ value: 'Low', position: 'right', fontSize: 9, fill: '#22c55e' }} />
                <ReferenceLine y={25} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.35}
                  label={{ value: 'High', position: 'right', fontSize: 9, fill: '#f59e0b' }} />
                <Line
                  type="monotone"
                  dataKey="vol"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: '#f59e0b', stroke: '#0a0f1e', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          !loading && (
            <div className="text-text-muted text-sm text-center py-10">
              Need at least 22 trading days of history
            </div>
          )
        )}

        <div className="grid grid-cols-3 gap-3">
          {([
            { label: 'Low  <15%',   color: 'text-brand-green', hint: 'Calm · hold full position' },
            { label: 'Med  15–25%', color: 'text-brand-gold',  hint: 'Normal range · monitor' },
            { label: 'High >25%',   color: 'text-brand-red',   hint: 'Stress · consider reducing' },
          ] as const).map(({ label, color, hint }) => (
            <div key={label} className="bg-bg-elevated rounded-lg p-3">
              <div className={`text-xs font-mono font-semibold mb-1 ${color}`}>{label}</div>
              <div className="text-xs text-text-muted">{hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Correlation Heatmap ────────────────────────────────────────── */}
      {corrData && (
        <div className="fin-card space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Correlation Matrix</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Log return correlation (1y) · Red = correlated (no diversification) · Blue = uncorrelated (good hedge)
              {corrData.avgOffDiagonal != null && (
                <span className={`ml-2 font-semibold ${corrData.avgOffDiagonal < 0.5 ? 'text-brand-green' : 'text-brand-red'}`}>
                  · avg {corrData.avgOffDiagonal.toFixed(2)}{' '}
                  {corrData.avgOffDiagonal < 0.5 ? '— diversified' : '— concentrated'}
                </span>
              )}
            </p>
          </div>

          {corrData.tickers.length < 2 ? (
            <div className="text-text-muted text-sm text-center py-6">
              Add more positions to see asset correlations.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="w-16" />
                    {corrData.tickers.map((t) => (
                      <th key={t} className="text-xs text-text-secondary font-medium text-center w-16 pb-1 font-mono">
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {corrData.tickers.map((rowTicker, i) => (
                    <tr key={rowTicker}>
                      <td className="text-xs text-text-secondary font-mono font-medium pr-2 text-right">
                        {rowTicker}
                      </td>
                      {corrData.tickers.map((colTicker, j) => {
                        const val = corrData.matrix[i][j]
                        const isDiag = i === j
                        return (
                          <td
                            key={colTicker}
                            title={`${rowTicker} / ${colTicker}: ${val.toFixed(3)}`}
                            style={{ backgroundColor: corrColor(val) }}
                            className="w-16 h-10 text-center rounded"
                          >
                            <span className={`text-xs font-mono ${
                              isDiag ? 'text-text-muted' : Math.abs(val) > 0.3 ? 'text-white font-semibold' : 'text-text-secondary'
                            }`}>
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
          )}
        </div>
      )}

      {/* ── 3. Monthly Returns Calendar ───────────────────────────────────── */}
      {monthly.length > 0 && (
        <div className="fin-card space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Monthly Returns Calendar</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Portfolio total · green = gain · red = loss · intensity = magnitude (full colour at ±10%)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1 w-full min-w-max">
              <thead>
                <tr>
                  <th className="text-xs text-text-muted font-medium text-left w-12 pb-1">Year</th>
                  {MONTH_LABELS.map((m) => (
                    <th key={m} className="text-xs text-text-muted font-medium text-center min-w-[52px] pb-1">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarYears.map((year) => (
                  <tr key={year}>
                    <td className="text-xs text-text-secondary font-mono pr-2">{year}</td>
                    {Array.from({ length: 12 }, (_, idx) => {
                      const ret = calendarMap.get(`${year}-${idx + 1}`)
                      if (ret == null) {
                        return (
                          <td key={idx} className="h-8 rounded bg-bg-elevated opacity-20" />
                        )
                      }
                      return (
                        <td
                          key={idx}
                          title={`${MONTH_LABELS[idx]} ${year}: ${(ret * 100).toFixed(2)}%`}
                          style={{ backgroundColor: monthRetColor(ret) }}
                          className="h-8 text-center rounded min-w-[52px]"
                        >
                          <span className="text-white/90 text-xs font-mono">
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
