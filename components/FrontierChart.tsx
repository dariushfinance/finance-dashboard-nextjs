'use client'

import { useState, useEffect } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ZAxis, ReferenceLine,
} from 'recharts'
import type { Position } from '@/types'

interface FrontierPoint {
  expectedReturn: number
  volatility: number
  sharpe: number
}

interface OptimalPoint extends FrontierPoint {
  weights: Record<string, number>
}

interface FrontierResult {
  tickers: string[]
  portfolios: FrontierPoint[]
  minVol: OptimalPoint
  maxSharpe: OptimalPoint
  current: OptimalPoint
}

interface Props { positions: Position[] }

function pct(v: number, d = 1) { return `${(v * 100).toFixed(d)}%` }

// Custom dots for highlighted portfolios
const SpecialDot = (color: string, size = 9, stroke = '#0a0f1e') =>
  function Dot(props: { cx?: number; cy?: number }) {
    const { cx = 0, cy = 0 } = props
    return <circle cx={cx} cy={cy} r={size} fill={color} stroke={stroke} strokeWidth={2} />
  }

const currentDot  = SpecialDot('#22c55e', 8)
const maxSharpeDot = SpecialDot('#f59e0b', 8)
const minVolDot    = SpecialDot('#3b82f6', 8)

export default function FrontierChart({ positions }: Props) {
  const [data, setData]       = useState<FrontierResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const pricedPositions = positions.filter((p) => !p.price_error && (p.current_price ?? 0) > 0)
  const uniqueTickers   = [...new Set(pricedPositions.map((p) => p.ticker))]

  useEffect(() => {
    if (uniqueTickers.length < 2) return
    setLoading(true)
    setError('')
    fetch('/api/frontier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positions: pricedPositions.map((p) => ({
          ticker: p.ticker,
          shares: p.shares,
          current_price: p.current_price,
        })),
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('Failed to compute efficient frontier'))
      .finally(() => setLoading(false))
  }, [uniqueTickers.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (uniqueTickers.length < 2) {
    return (
      <div className="fin-card text-center py-16 text-text-muted text-sm animate-slide-up">
        Add at least 2 different tickers to compute the Efficient Frontier.
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="fin-card space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-text-primary">Efficient Frontier</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Markowitz · 2,000 Monte Carlo portfolios · 2-year lookback · long-only constraints
            </p>
          </div>
          {loading && <span className="spinner flex-shrink-0 mt-1" />}
        </div>

        {error && <div className="text-brand-red text-sm">{error}</div>}

        {data && (
          <>
            {/* Scatter chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 24, bottom: 24, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
                  <XAxis
                    type="number"
                    dataKey="volatility"
                    name="Volatility"
                    tickFormatter={(v) => pct(v)}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Annualised Volatility', position: 'insideBottom', offset: -14, fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="expectedReturn"
                    name="Expected Return"
                    tickFormatter={(v) => pct(v)}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Expected Return', angle: -90, position: 'insideLeft', offset: 12, fontSize: 10, fill: '#64748b' }}
                  />
                  <ZAxis range={[18, 18]} />
                  <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" strokeOpacity={0.6} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as FrontierPoint
                      return (
                        <div className="bg-bg-elevated border border-bg-border rounded-lg p-3 text-xs font-mono space-y-1">
                          <div>Return: <span className={d.expectedReturn >= 0 ? 'text-brand-green' : 'neg'}>{pct(d.expectedReturn, 2)}</span></div>
                          <div>Volatility: <span className="text-text-primary">{pct(d.volatility, 2)}</span></div>
                          <div>Sharpe: <span className="text-brand-gold">{d.sharpe.toFixed(2)}</span></div>
                        </div>
                      )
                    }}
                  />
                  {/* All simulated portfolios */}
                  <Scatter name="Portfolios" data={data.portfolios} fill="#1e3a5f" opacity={0.7} />
                  {/* Current portfolio */}
                  <Scatter name="Current"    data={[data.current]}  fill="#22c55e" shape={currentDot} />
                  {/* Max Sharpe */}
                  <Scatter name="Max Sharpe" data={[data.maxSharpe]} fill="#f59e0b" shape={maxSharpeDot} />
                  {/* Min Vol */}
                  <Scatter name="Min Vol"    data={[data.minVol]}    fill="#3b82f6" shape={minVolDot} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-5 text-xs">
              {([
                { color: '#22c55e', label: 'Current portfolio' },
                { color: '#f59e0b', label: 'Max Sharpe ratio' },
                { color: '#3b82f6', label: 'Min Volatility' },
                { color: '#1e3a5f', label: 'Simulated portfolios' },
              ] as const).map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-text-muted">{label}</span>
                </div>
              ))}
            </div>

            {/* Weights + metrics comparison table */}
            <div className="overflow-x-auto">
              <table className="fin-table text-xs">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th className="text-right text-text-secondary">Current</th>
                    <th className="text-right text-brand-gold">Max Sharpe</th>
                    <th className="text-right" style={{ color: '#3b82f6' }}>Min Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tickers.map((t) => (
                    <tr key={t}>
                      <td className="font-mono font-semibold text-text-primary">{t}</td>
                      <td className="text-right text-text-secondary">{pct(data.current.weights[t] ?? 0)}</td>
                      <td className="text-right text-brand-gold">{pct(data.maxSharpe.weights[t] ?? 0)}</td>
                      <td className="text-right" style={{ color: '#3b82f6' }}>{pct(data.minVol.weights[t] ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-bg-border">
                  <tr>
                    <td className="text-text-muted py-1.5">Return (ann.)</td>
                    <td className="text-right text-text-secondary">{pct(data.current.expectedReturn, 2)}</td>
                    <td className="text-right text-brand-gold">{pct(data.maxSharpe.expectedReturn, 2)}</td>
                    <td className="text-right" style={{ color: '#3b82f6' }}>{pct(data.minVol.expectedReturn, 2)}</td>
                  </tr>
                  <tr>
                    <td className="text-text-muted py-1.5">Volatility (ann.)</td>
                    <td className="text-right text-text-secondary">{pct(data.current.volatility, 2)}</td>
                    <td className="text-right text-brand-gold">{pct(data.maxSharpe.volatility, 2)}</td>
                    <td className="text-right" style={{ color: '#3b82f6' }}>{pct(data.minVol.volatility, 2)}</td>
                  </tr>
                  <tr>
                    <td className="text-text-muted py-1.5">Sharpe Ratio</td>
                    <td className="text-right text-text-secondary">{data.current.sharpe.toFixed(2)}</td>
                    <td className="text-right text-brand-gold">{data.maxSharpe.sharpe.toFixed(2)}</td>
                    <td className="text-right" style={{ color: '#3b82f6' }}>{data.minVol.sharpe.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="text-xs text-text-muted">
              Based on 2 years of historical returns. Past covariance does not guarantee future correlations.
              Monte Carlo uses uniform simplex sampling — not a recommendation to rebalance.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
