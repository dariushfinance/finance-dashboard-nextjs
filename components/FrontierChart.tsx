'use client'

import { useState, useEffect } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ZAxis, ReferenceLine,
} from 'recharts'
import type { Position } from '@/types'

interface FrontierPoint  { expectedReturn: number; volatility: number; sharpe: number }
interface OptimalPoint extends FrontierPoint { weights: Record<string, number> }
interface FrontierResult {
  tickers: string[]; portfolios: FrontierPoint[]
  minVol: OptimalPoint; maxSharpe: OptimalPoint; current: OptimalPoint
}
interface Props { positions: Position[] }

const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`

// Special dots respecting CSS theme vars
const SpecialDot = (color: string, r = 8) =>
  function Dot(props: { cx?: number; cy?: number }) {
    const { cx = 0, cy = 0 } = props
    return <circle cx={cx} cy={cy} r={r} fill={color} stroke="var(--bg-1)" strokeWidth={2.5} />
  }
const currentDot   = SpecialDot('#22d3a0', 8)
const maxSharpeDot = SpecialDot('#f59e0b', 8)
const minVolDot    = SpecialDot('#60a5fa', 8)

export default function FrontierChart({ positions }: Props) {
  const [data, setData]       = useState<FrontierResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const pricedPositions = positions.filter(p => !p.price_error && (p.current_price ?? 0) > 0)
  const uniqueTickers   = [...new Set(pricedPositions.map(p => p.ticker))]

  useEffect(() => {
    if (uniqueTickers.length < 2) return
    setLoading(true)
    setError('')
    fetch('/api/frontier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positions: pricedPositions.map(p => ({
          ticker: p.ticker, shares: p.shares, current_price: p.current_price,
        })),
      }),
    })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('Failed to compute efficient frontier'))
      .finally(() => setLoading(false))
  }, [uniqueTickers.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (uniqueTickers.length < 2) {
    return (
      <div className="card" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
        Add at least 2 different tickers to compute the Efficient Frontier.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 0 }}>
        <div className="card__head">
          <div>
            <div className="card__title">Efficient Frontier</div>
            <div className="card__sub">
              Markowitz · 2,000 Monte Carlo portfolios · 2-year lookback · long-only
            </div>
          </div>
          {loading && <span className="spinner" />}
        </div>

        {error && (
          <div style={{ padding: '16px 22px', color: 'var(--neg)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Scatter chart */}
            <div style={{ padding: '22px 22px 8px', height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 30, bottom: 40, left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis
                    type="number" dataKey="volatility" name="Volatility"
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                    tickLine={false} axisLine={{ stroke: 'var(--line)' }}
                    label={{
                      value: 'Annualised Volatility →',
                      position: 'insideBottom', offset: -24,
                      fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <YAxis
                    type="number" dataKey="expectedReturn" name="Expected Return"
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                    tickLine={false} axisLine={{ stroke: 'var(--line)' }}
                    width={52}
                    label={{
                      value: '← Expected Return',
                      angle: -90, position: 'insideLeft', offset: 14,
                      fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <ZAxis range={[16, 16]} />
                  <ReferenceLine y={0} stroke="var(--line-soft)" strokeDasharray="4 4" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: 'var(--line)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as FrontierPoint
                      return (
                        <div style={{
                          background: 'var(--bg-2)', border: '1px solid var(--line)',
                          borderRadius: 10, padding: '10px 14px',
                          fontFamily: 'var(--font-mono)', fontSize: 12,
                          boxShadow: 'var(--shadow-hi)',
                        }}>
                          <div style={{ color: d.expectedReturn >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                            Return: {pct(d.expectedReturn, 2)}
                          </div>
                          <div style={{ color: 'var(--ink-2)' }}>Volatility: {pct(d.volatility, 2)}</div>
                          <div style={{ color: 'var(--warn)' }}>Sharpe: {d.sharpe.toFixed(2)}</div>
                        </div>
                      )
                    }}
                  />
                  <Scatter
                    name="Simulated portfolios"
                    data={data.portfolios}
                    fill="var(--bg-3)"
                    opacity={0.75}
                  />
                  <Scatter name="Current" data={[data.current]}   fill="#22d3a0" shape={currentDot} />
                  <Scatter name="Max Sharpe" data={[data.maxSharpe]} fill="#f59e0b" shape={maxSharpeDot} />
                  <Scatter name="Min Vol" data={[data.minVol]}    fill="#60a5fa" shape={minVolDot} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 20,
              padding: '0 22px 20px',
              fontSize: 12, fontFamily: 'var(--font-mono)',
            }}>
              {[
                { color: '#22d3a0', label: 'Current portfolio' },
                { color: '#f59e0b', label: 'Max Sharpe ratio' },
                { color: '#60a5fa', label: 'Min Volatility' },
                { color: 'var(--bg-3)', label: 'Simulated (2,000)', border: 'var(--line)' },
              ].map(({ color, label, border }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: color,
                    border: border ? `1px solid ${border}` : undefined,
                  }} />
                  <span style={{ color: 'var(--ink-3)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Weights table */}
            <div style={{ borderTop: '1px solid var(--line-soft)' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th className="num" style={{ color: 'var(--ink-3)' }}>Current</th>
                    <th className="num" style={{ color: '#f59e0b' }}>Max Sharpe</th>
                    <th className="num" style={{ color: '#60a5fa' }}>Min Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tickers.map(t => (
                    <tr key={t}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)' }}>{t}</td>
                      <td className="num" style={{ color: 'var(--ink-3)' }}>{pct(data.current.weights[t] ?? 0)}</td>
                      <td className="num" style={{ color: '#f59e0b' }}>{pct(data.maxSharpe.weights[t] ?? 0)}</td>
                      <td className="num" style={{ color: '#60a5fa' }}>{pct(data.minVol.weights[t] ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                      Return (ann.)
                    </td>
                    <td className="num" style={{ color: 'var(--ink-3)' }}>{pct(data.current.expectedReturn, 2)}</td>
                    <td className="num" style={{ color: '#f59e0b' }}>{pct(data.maxSharpe.expectedReturn, 2)}</td>
                    <td className="num" style={{ color: '#60a5fa' }}>{pct(data.minVol.expectedReturn, 2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                      Volatility (ann.)
                    </td>
                    <td className="num" style={{ color: 'var(--ink-3)' }}>{pct(data.current.volatility, 2)}</td>
                    <td className="num" style={{ color: '#f59e0b' }}>{pct(data.maxSharpe.volatility, 2)}</td>
                    <td className="num" style={{ color: '#60a5fa' }}>{pct(data.minVol.volatility, 2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                      Sharpe Ratio
                    </td>
                    <td className="num" style={{ color: 'var(--ink-3)' }}>{data.current.sharpe.toFixed(2)}</td>
                    <td className="num" style={{ color: '#f59e0b' }}>{data.maxSharpe.sharpe.toFixed(2)}</td>
                    <td className="num" style={{ color: '#60a5fa' }}>{data.minVol.sharpe.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{
              padding: '14px 22px',
              fontSize: 11.5, color: 'var(--ink-4)',
              fontFamily: 'var(--font-mono)',
              borderTop: '1px solid var(--line-soft)',
            }}>
              Based on 2 years of historical returns. Past covariance does not guarantee future correlations.
              Monte Carlo uses uniform simplex sampling — not a recommendation to rebalance.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
