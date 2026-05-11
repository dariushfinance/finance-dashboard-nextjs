'use client'

import { useState, useEffect } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ZAxis, ReferenceLine,
} from 'recharts'
import type { Position } from '@/types'
import { getTickerMeta, SECTOR_COLORS } from '@/lib/ticker-meta'

interface FrontierPoint  { expectedReturn: number; volatility: number; sharpe: number }
interface OptimalPoint extends FrontierPoint { weights: Record<string, number> }
interface FrontierResult {
  tickers: string[]; portfolios: FrontierPoint[]
  minVol: OptimalPoint; maxSharpe: OptimalPoint; current: OptimalPoint
  tickerVols: Record<string, number>
}
interface Props { positions: Position[] }

const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`

const SpecialDot = (fill: string, r = 8) =>
  function Dot(props: { cx?: number; cy?: number }) {
    const { cx = 0, cy = 0 } = props
    return (
      <>
        <circle cx={cx} cy={cy} r={r + 4} fill={fill} opacity={0.15} />
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke="var(--bg-1)" strokeWidth={2.5} />
      </>
    )
  }

const currentDot   = SpecialDot('#22d3a0')
const maxSharpeDot = SpecialDot('#f59e0b')
const minVolDot    = SpecialDot('#60a5fa')

// ── Shared props ──────────────────────────────────────────────

interface RebalanceProps {
  data: FrontierResult
  pricedPositions: Position[]
  totalValue: number
}

// ── Rebalancing Roadmap (kept for future use — not shown due to CH regulatory considerations) ──
//
// function arrow(delta: number) {
//   if (delta > 0.015)  return { sym: '↑', color: 'var(--pos)' }
//   if (delta < -0.015) return { sym: '↓', color: 'var(--neg)' }
//   return { sym: '→', color: 'var(--ink-4)' }
// }

// ── Volatility Insights ───────────────────────────────────────
// Replaces the rebalancing roadmap for regulatory compliance (CH Anlageberatung).
// Shows per-position annualised volatility with factual, non-advisory observations.

function volCategory(v: number): { label: string; color: string } {
  if (v > 0.40) return { label: 'Extremely high', color: 'var(--neg)' }
  if (v > 0.25) return { label: 'High',           color: 'var(--neg)' }
  if (v > 0.15) return { label: 'Moderate',       color: 'var(--warn)' }
  return              { label: 'Low',              color: 'var(--pos)' }
}

function volHint(v: number): string {
  if (v > 0.40) return 'Extremely volatile — historically tends to dominate portfolio risk and amplify peak-to-trough drawdowns.'
  if (v > 0.25) return 'High volatility — positions at this level have historically contributed disproportionately to portfolio swings.'
  if (v > 0.15) return 'Moderate volatility — typical range for equities. Monitor concentration in the overall portfolio.'
  return               'Lower volatility — assets in this range have historically had a stabilising effect on portfolio returns.'
}

function VolatilityInsights({ data, pricedPositions, totalValue }: RebalanceProps) {
  const portfolioVol = data.current.volatility
  const pvCat = volCategory(portfolioVol)

  const rows = data.tickers
    .map(t => {
      const vol    = data.tickerVols?.[t] ?? 0
      const pos    = pricedPositions.find(p => p.ticker === t)
      const weight = pos ? (pos.current_value ?? 0) / Math.max(totalValue, 1) : 0
      return { t, vol, weight, cat: volCategory(vol) }
    })
    .sort((a, b) => b.vol - a.vol)

  return (
    <div style={{ borderTop: '1px solid var(--line-soft)', padding: '28px 22px' }}>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          Position Volatility Overview
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
          Annualised individual volatility · 2-year daily return history · informational only
        </div>
      </div>

      {/* Portfolio-level summary */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20,
        padding: '16px 20px', background: 'var(--bg-2)',
        borderRadius: 12, border: '1px solid var(--line-soft)',
      }}>
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 6 }}>
            Portfolio Vol (ann.)
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700, color: pvCat.color, lineHeight: 1 }}>
              {(portfolioVol * 100).toFixed(1)}%
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: pvCat.color }}>{pvCat.label}</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6, borderLeft: '1px solid var(--line-soft)', paddingLeft: 20 }}>
          {volHint(portfolioVol)}
        </div>
      </div>

      {/* Per-ticker rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(({ t, vol, weight, cat }) => {
          const barPct = Math.min((vol / 0.60) * 100, 100)
          return (
            <div key={t} style={{
              padding: '12px 16px', background: 'var(--bg)',
              border: '1px solid var(--line-soft)', borderRadius: 11,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{t}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)' }}>
                    {(weight * 100).toFixed(1)}% of portfolio
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: cat.color }}>
                    {(vol * 100).toFixed(1)}%
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                    color: cat.color, background: cat.color + '18',
                  }}>
                    {cat.label}
                  </span>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-3)', overflow: 'hidden', marginBottom: 7 }}>
                <div style={{ height: '100%', width: `${barPct}%`, borderRadius: 2, background: cat.color, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)', lineHeight: 1.55 }}>
                {volHint(vol)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── RebalancePanel — kept for future use ─────────────────────
// Commented out: displaying specific trade instructions could constitute Anlageberatung
// under Swiss financial services law (FIDLEG/FINIG). Re-enable only after legal review.
//
// function RebalancePanel({ data, pricedPositions, totalValue }: RebalanceProps) {
//   const [target, setTarget] = useState<'sharpe' | 'vol'>('sharpe')
//   const opt = target === 'sharpe' ? data.maxSharpe : data.minVol
//   const cur = data.current
//   const currentWeights = useMemo(() => { ... }, [data.tickers, pricedPositions, totalValue])
//   const trades = useMemo(() => [...], [data.tickers, opt.weights, currentWeights, pricedPositions, totalValue])
//   const sectorShifts = useMemo(() => [...], [data.tickers, opt.weights, currentWeights])
//   const totalTrades = trades.reduce((s, t) => s + Math.abs(t.valueChange), 0) / 2
//   const turnoverPct = totalValue > 0 ? (totalTrades / totalValue) * 100 : 0
//   return ( <div> ... sector shifts + trade table ... </div> )
// }

// ── Main component ────────────────────────────────────────────

export default function FrontierChart({ positions }: Props) {
  const [data, setData]       = useState<FrontierResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const pricedPositions = positions.filter(p => !p.price_error && (p.current_price ?? 0) > 0)
  const uniqueTickers   = [...new Set(pricedPositions.map(p => p.ticker))]
  const totalValue      = pricedPositions.reduce((s, p) => s + (p.current_value ?? 0), 0)

  useEffect(() => {
    if (uniqueTickers.length < 2) return
    setLoading(true); setError('')
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
              Markowitz · 2,000 Monte Carlo portfolios · 2-year lookback · long-only · X = annualised volatility · Y = expected return
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
                <ScatterChart margin={{ top: 10, right: 30, bottom: 44, left: 54 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis
                    type="number" dataKey="volatility" name="Volatility"
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                    tickLine={false} axisLine={{ stroke: 'var(--line-soft)' }}
                  />
                  <YAxis
                    type="number" dataKey="expectedReturn" name="Expected Return"
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                    tickLine={false} axisLine={{ stroke: 'var(--line-soft)' }}
                    width={42}
                  />
                  <ZAxis range={[18, 18]} />
                  <ReferenceLine y={0} stroke="var(--line-soft)" strokeDasharray="4 4" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: 'var(--line)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as FrontierPoint
                      return (
                        <div style={{
                          background: 'var(--bg-2)', border: '1px solid var(--line)',
                          borderRadius: 11, padding: '10px 14px',
                          fontFamily: 'var(--font-mono)', fontSize: 12,
                          boxShadow: 'var(--shadow-hi)',
                        }}>
                          <div style={{ color: d.expectedReturn >= 0 ? 'var(--pos)' : 'var(--neg)', marginBottom: 3 }}>
                            Return: {pct(d.expectedReturn, 2)}
                          </div>
                          <div style={{ color: 'var(--ink-2)' }}>Volatility: {pct(d.volatility, 2)}</div>
                          <div style={{ color: 'var(--warn)' }}>Sharpe: {d.sharpe.toFixed(2)}</div>
                        </div>
                      )
                    }}
                  />
                  <Scatter name="Simulated portfolios" data={data.portfolios} fill="var(--bg-3)" opacity={0.75} />
                  <Scatter name="Current"    data={[data.current]}   fill="#22d3a0" shape={currentDot} />
                  <Scatter name="Max Sharpe" data={[data.maxSharpe]} fill="#f59e0b" shape={maxSharpeDot} />
                  <Scatter name="Min Vol"    data={[data.minVol]}    fill="#60a5fa" shape={minVolDot} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: '0 22px 20px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              {[
                { color: '#22d3a0', label: 'Current portfolio',   glow: true },
                { color: '#f59e0b', label: 'Max Sharpe ratio',    glow: false },
                { color: '#60a5fa', label: 'Min Volatility',      glow: false },
                { color: 'var(--bg-3)', label: '2,000 simulated', border: 'var(--line)', glow: false },
              ].map(({ color, label, border, glow }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: color, border: border ? `1px solid ${border}` : undefined,
                    boxShadow: glow ? `0 0 8px ${color}` : undefined,
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
                    <th className="num" style={{ color: 'var(--ink-3)' }}>Δ Sharpe</th>
                    <th className="num" style={{ color: 'var(--ink-3)' }}>Δ Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tickers.map(t => {
                    const meta      = getTickerMeta(t)
                    const color     = SECTOR_COLORS[meta.sector] ?? '#475569'
                    const dSharpe   = (opt: OptimalPoint) => opt.weights[t] - (data.current.weights[t] ?? 0)
                    return (
                      <tr key={t}>
                        <td>
                          <div className="sym">
                            <div className="sym__logo" style={{ background: color + '22', color, borderColor: color + '44', fontSize: 9 }}>
                              {t.slice(0, 2)}
                            </div>
                            <div>
                              <div className="sym__ticker">{t}</div>
                              <div className="sym__name">{meta.sector}</div>
                            </div>
                          </div>
                        </td>
                        <td className="num" style={{ color: 'var(--ink-3)' }}>{pct(data.current.weights[t] ?? 0)}</td>
                        <td className="num" style={{ color: '#f59e0b' }}>{pct(data.maxSharpe.weights[t] ?? 0)}</td>
                        <td className="num" style={{ color: '#60a5fa' }}>{pct(data.minVol.weights[t] ?? 0)}</td>
                        <td className={`num ${dSharpe(data.maxSharpe) > 0 ? 'pos' : dSharpe(data.maxSharpe) < 0 ? 'neg' : ''}`}>
                          {dSharpe(data.maxSharpe) > 0 ? '+' : ''}{(dSharpe(data.maxSharpe) * 100).toFixed(1)}%
                        </td>
                        <td className={`num ${dSharpe(data.minVol) > 0 ? 'pos' : dSharpe(data.minVol) < 0 ? 'neg' : ''}`}>
                          {dSharpe(data.minVol) > 0 ? '+' : ''}{(dSharpe(data.minVol) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  {[
                    { label: 'Return (ann.)',    cur: data.current.expectedReturn, s: data.maxSharpe.expectedReturn, v: data.minVol.expectedReturn, fmt: (n: number) => pct(n, 2) },
                    { label: 'Volatility (ann.)',cur: data.current.volatility,     s: data.maxSharpe.volatility,     v: data.minVol.volatility,     fmt: (n: number) => pct(n, 2) },
                    { label: 'Sharpe Ratio',     cur: data.current.sharpe,         s: data.maxSharpe.sharpe,         v: data.minVol.sharpe,         fmt: (n: number) => n.toFixed(2) },
                  ].map(row => (
                    <tr key={row.label}>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{row.label}</td>
                      <td className="num" style={{ color: 'var(--ink-3)' }}>{row.fmt(row.cur)}</td>
                      <td className="num" style={{ color: '#f59e0b' }}>{row.fmt(row.s)}</td>
                      <td className="num" style={{ color: '#60a5fa' }}>{row.fmt(row.v)}</td>
                      <td className="num" />
                      <td className="num" />
                    </tr>
                  ))}
                </tfoot>
              </table>
            </div>

            {/* Position Volatility Overview */}
            <VolatilityInsights
              data={data}
              pricedPositions={pricedPositions}
              totalValue={totalValue}
            />

            <div style={{ padding: '14px 22px', fontSize: 11.5, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--line-soft)' }}>
              Based on 2 years of historical returns. Past covariance does not guarantee future correlations.
              Monte Carlo uses uniform simplex sampling — not a recommendation to rebalance.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
