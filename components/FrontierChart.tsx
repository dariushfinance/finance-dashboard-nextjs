'use client'

import { useState, useEffect, useMemo } from 'react'
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

// ── Rebalancing Roadmap ───────────────────────────────────────

interface RebalanceProps {
  data: FrontierResult
  pricedPositions: Position[]
  totalValue: number
}

function arrow(delta: number) {
  if (delta > 0.015)  return { sym: '↑', color: 'var(--pos)' }
  if (delta < -0.015) return { sym: '↓', color: 'var(--neg)' }
  return { sym: '→', color: 'var(--ink-4)' }
}

function ImprovementBadge({ label, before, after, isGood }: { label: string; before: number; after: number; isGood: boolean }) {
  const improved = isGood ? after > before : after < before
  return (
    <div style={{
      padding: '14px 18px',
      background: 'var(--bg)',
      border: `1px solid ${improved ? 'var(--pos-line)' : 'var(--line)'}`,
      borderRadius: 12,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--ink-3)', textDecoration: 'line-through', opacity: 0.5 }}>
          {typeof before === 'number' ? (isGood ? before.toFixed(2) : pct(before, 1)) : '—'}
        </span>
        <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>→</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: improved ? 'var(--pos)' : 'var(--neg)' }}>
          {typeof after === 'number' ? (isGood ? after.toFixed(2) : pct(after, 1)) : '—'}
        </span>
      </div>
      {improved && (
        <div style={{ fontSize: 10.5, color: 'var(--pos)', fontFamily: 'var(--font-mono)' }}>
          {isGood
            ? `+${(after - before).toFixed(2)} improvement`
            : `${((before - after) * 100).toFixed(1)}% less volatile`}
        </div>
      )}
    </div>
  )
}

function RebalancePanel({ data, pricedPositions, totalValue }: RebalanceProps) {
  const [target, setTarget] = useState<'sharpe' | 'vol'>('sharpe')

  const opt = target === 'sharpe' ? data.maxSharpe : data.minVol
  const cur = data.current

  // Current weights per ticker
  const currentWeights = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of data.tickers) {
      const pos = pricedPositions.find(p => p.ticker === t)
      map[t] = pos ? (pos.current_value ?? 0) / Math.max(totalValue, 1) : 0
    }
    return map
  }, [data.tickers, pricedPositions, totalValue])

  // Ticker-level trades
  const trades = useMemo(() =>
    data.tickers
      .map(t => {
        const pos      = pricedPositions.find(p => p.ticker === t)
        const curW     = currentWeights[t] ?? 0
        const tgtW     = opt.weights[t] ?? 0
        const delta    = tgtW - curW
        const price    = pos?.current_price ?? 0
        const curShares = pos?.shares ?? 0
        const curVal   = curW * totalValue
        const tgtVal   = tgtW * totalValue
        const shareDelta = price > 0 ? Math.round((tgtVal - curVal) / price) : 0
        return {
          ticker: t, meta: getTickerMeta(t),
          curW, tgtW, delta, shareDelta,
          price, curShares,
          action: shareDelta > 0 ? 'Buy' : shareDelta < 0 ? 'Sell' : 'Hold',
          valueChange: shareDelta * price,
        }
      })
      .filter(t => Math.abs(t.delta) > 0.005)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  , [data.tickers, opt.weights, currentWeights, pricedPositions, totalValue])

  // Sector-level aggregation
  const sectorShifts = useMemo(() => {
    const map: Record<string, { cur: number; tgt: number; color: string }> = {}
    for (const t of data.tickers) {
      const meta  = getTickerMeta(t)
      const s     = meta.sector
      const color = SECTOR_COLORS[s] ?? '#475569'
      if (!map[s]) map[s] = { cur: 0, tgt: 0, color }
      map[s].cur += currentWeights[t] ?? 0
      map[s].tgt += opt.weights[t] ?? 0
    }
    return Object.entries(map)
      .map(([sector, v]) => ({ sector, ...v, delta: v.tgt - v.cur }))
      .filter(s => Math.abs(s.delta) > 0.005)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  }, [data.tickers, opt.weights, currentWeights])

  const totalTrades  = trades.reduce((s, t) => s + Math.abs(t.valueChange), 0) / 2
  const turnoverPct  = totalValue > 0 ? (totalTrades / totalValue) * 100 : 0

  return (
    <div style={{ borderTop: '1px solid var(--line-soft)', padding: '28px 22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Rebalancing roadmap
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
            Exact trades to move from your current portfolio to the optimal target
          </div>
        </div>
        {/* Target toggle */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 9, padding: 3, gap: 2 }}>
          {([
            { id: 'sharpe' as const, label: 'Max Sharpe', color: '#f59e0b' },
            { id: 'vol'    as const, label: 'Min Vol',    color: '#60a5fa' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTarget(t.id)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                background: target === t.id ? t.color : 'transparent',
                color: target === t.id ? 'oklch(0.14 0.01 0)' : 'var(--ink-3)',
                border: 'none', transition: 'all 0.18s', cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Improvement metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <ImprovementBadge
          label="Sharpe Ratio"
          before={cur.sharpe}
          after={opt.sharpe}
          isGood={true}
        />
        <ImprovementBadge
          label="Annualised Volatility"
          before={cur.volatility}
          after={opt.volatility}
          isGood={false}
        />
        <ImprovementBadge
          label="Expected Return"
          before={cur.expectedReturn}
          after={opt.expectedReturn}
          isGood={true}
        />
      </div>

      {/* Two-column: sector shifts + trade table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        {/* Sector shifts */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card__head">
            <div>
              <div className="card__title" style={{ fontSize: 12 }}>Sector changes</div>
              <div className="card__sub">Aggregate exposure shifts by sector</div>
            </div>
          </div>
          <div style={{ padding: '12px 0' }}>
            {sectorShifts.length === 0 && (
              <div style={{ padding: '20px 20px', color: 'var(--ink-4)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                No significant sector changes needed.
              </div>
            )}
            {sectorShifts.map((s, i) => {
              const a = arrow(s.delta)
              const maxW = Math.max(...sectorShifts.map(x => Math.max(x.cur, x.tgt)))
              return (
                <div key={i} style={{
                  padding: '10px 18px',
                  borderBottom: i < sectorShifts.length - 1 ? '1px solid var(--line-soft)' : 'none',
                  animation: `row-in 0.35s ${i * 0.05}s cubic-bezier(0.22,1,0.36,1) both`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>{s.sector}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      <span style={{ color: 'var(--ink-3)' }}>{(s.cur * 100).toFixed(1)}%</span>
                      <span style={{ color: a.color, fontWeight: 700 }}>{a.sym}</span>
                      <span style={{ color: a.color, fontWeight: 600 }}>{(s.tgt * 100).toFixed(1)}%</span>
                      <span style={{ color: a.color, fontSize: 10, marginLeft: 2 }}>
                        ({s.delta > 0 ? '+' : ''}{(s.delta * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  {/* Dual bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-3)', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, right: `${(1 - s.cur / maxW) * 100}%`, background: 'var(--ink-3)', borderRadius: 2, opacity: 0.4 }} />
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-3)', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, right: `${(1 - s.tgt / maxW) * 100}%`, background: s.color, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Trade actions */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card__head">
            <div>
              <div className="card__title" style={{ fontSize: 12 }}>Trade actions</div>
              <div className="card__sub">
                {trades.length} trades · ~${totalTrades.toLocaleString('en-US', { maximumFractionDigits: 0 })} turnover ({turnoverPct.toFixed(1)}%)
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {trades.length === 0 ? (
              <div style={{ padding: '20px 20px', color: 'var(--ink-4)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                Portfolio is already near optimal.
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Sector</th>
                    <th className="num">Action</th>
                    <th className="num">Shares</th>
                    <th className="num">Value</th>
                    <th className="num">Weight Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => (
                    <tr key={t.ticker} style={{ animationDelay: `${i * 0.04}s` }}>
                      <td>
                        <div className="sym">
                          <div className="sym__logo" style={{ background: (SECTOR_COLORS[t.meta.sector] ?? '#475569') + '22', color: SECTOR_COLORS[t.meta.sector] ?? 'var(--ink-3)', borderColor: (SECTOR_COLORS[t.meta.sector] ?? '#475569') + '44', fontSize: 9 }}>
                            {t.ticker.slice(0, 2)}
                          </div>
                          <div>
                            <div className="sym__ticker">{t.ticker}</div>
                            <div className="sym__name">{t.meta.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--ink-3)', fontSize: 11 }}>{t.meta.sector}</td>
                      <td className="num">
                        <span style={{
                          padding: '2px 8px', borderRadius: 5,
                          fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                          background: t.action === 'Buy' ? 'var(--pos-soft)' : t.action === 'Sell' ? 'var(--neg-soft)' : 'var(--bg-2)',
                          color:      t.action === 'Buy' ? 'var(--pos)'      : t.action === 'Sell' ? 'var(--neg)'      : 'var(--ink-3)',
                          border:     `1px solid ${t.action === 'Buy' ? 'var(--pos-line)' : t.action === 'Sell' ? 'var(--neg-line)' : 'var(--line)'}`,
                        }}>
                          {t.action}
                        </span>
                      </td>
                      <td className={`num ${t.shareDelta > 0 ? 'pos' : t.shareDelta < 0 ? 'neg' : ''}`}>
                        {t.shareDelta > 0 ? '+' : ''}{t.shareDelta.toLocaleString()}
                      </td>
                      <td className={`num ${t.valueChange > 0 ? 'pos' : t.valueChange < 0 ? 'neg' : ''}`}>
                        {t.valueChange > 0 ? '+' : ''}${Math.abs(t.valueChange).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={`num ${t.delta > 0 ? 'pos' : t.delta < 0 ? 'neg' : ''}`}>
                        {t.delta > 0 ? '+' : ''}{(t.delta * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--line-soft)',
            fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)',
          }}>
            Share counts rounded. Based on current prices — verify before trading. Not financial advice.
          </div>
        </div>
      </div>
    </div>
  )
}

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
                <ScatterChart margin={{ top: 10, right: 30, bottom: 44, left: 54 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis
                    type="number" dataKey="volatility" name="Volatility"
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                    tickLine={false} axisLine={{ stroke: 'var(--line-soft)' }}
                    label={{ value: 'Annualised Volatility →', position: 'insideBottom', offset: -28, fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                  />
                  <YAxis
                    type="number" dataKey="expectedReturn" name="Expected Return"
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                    tickLine={false} axisLine={{ stroke: 'var(--line-soft)' }}
                    width={50}
                    label={{ value: '← Expected Return', angle: -90, position: 'insideLeft', offset: 16, fontSize: 11, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
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

            {/* Rebalancing roadmap */}
            <RebalancePanel
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
