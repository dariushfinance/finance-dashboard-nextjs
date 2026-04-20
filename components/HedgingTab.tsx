'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import type { Position } from '@/types'

// ── Black-Scholes math ────────────────────────────────────────────────────────

function normCdf(x: number): number {
  const a1 =  0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 =  1.061405429, p  = 0.3275911
  const sign = x < 0 ? -1 : 1
  const xx = Math.abs(x) / Math.SQRT2
  const t  = 1 / (1 + p * xx)
  const y  = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-xx * xx)
  return 0.5 * (1 + sign * y)
}

function normPdf(x: number): number {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
}

interface BSResult {
  price: number
  delta: number
  gamma: number
  theta: number
  vega: number
}

function blackScholes(S: number, K: number, T: number, r: number, sigma: number, type: 'put' | 'call'): BSResult {
  if (T <= 0 || sigma <= 0) return { price: 0, delta: type === 'call' ? 0 : -1, gamma: 0, theta: 0, vega: 0 }
  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  const gamma = normPdf(d1) / (S * sigma * sqrtT)
  const vega  = S * normPdf(d1) * sqrtT / 100
  if (type === 'call') {
    const price = S * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2)
    const delta = normCdf(d1)
    const theta = (-S * normPdf(d1) * sigma / (2 * sqrtT) - r * K * Math.exp(-r * T) * normCdf(d2)) / 365
    return { price, delta, gamma, theta, vega }
  } else {
    const price = K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1)
    const delta = normCdf(d1) - 1
    const theta = (-S * normPdf(d1) * sigma / (2 * sqrtT) + r * K * Math.exp(-r * T) * normCdf(-d2)) / 365
    return { price, delta, gamma, theta, vega }
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiBox({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--bg)',
      border: '1px solid var(--line-soft)',
      borderRadius: 9,
    }}>
      <div style={{ fontSize: 10, color: 'var(--ink-4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 15, marginTop: 4,
        color: accent ? 'var(--pos)' : 'var(--ink)', fontWeight: 600,
      }}>
        {value}
      </div>
    </div>
  )
}

function SliderRow({
  label, value, onChange, min, max, unit = '', readOnly,
}: {
  label: string; value: number; onChange?: (v: number) => void
  min?: number; max?: number; unit?: string; readOnly?: boolean
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>
          {value}{unit}
        </span>
      </div>
      {!readOnly && (
        <input
          type="range" min={min} max={max} value={value}
          onChange={e => onChange?.(+e.target.value)}
          className="pi-slider"
          style={{ width: '100%' }}
        />
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '7px 0', borderBottom: '1px solid var(--line-soft)', fontSize: 12.5,
    }}>
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}

const STRATEGIES = [
  { id: 'put',        label: 'Protective puts',     desc: 'Buy OTM puts to cap downside at a fixed level' },
  { id: 'collar',     label: 'Zero-cost collar',    desc: 'Buy put + sell call — net premium ≈ 0' },
  { id: 'reduce-beta',label: 'Reduce beta',         desc: 'Rotate into low-beta / defensive names' },
  { id: 'cash',       label: 'Raise cash',          desc: 'Trim winners · hold 10–20% in T-bills' },
]

// ── Main component ────────────────────────────────────────────────────────────

interface Props { positions: Position[] }

export default function HedgingTab({ positions }: Props) {
  const [strategy,   setStrategy]   = useState('put')
  const [dte,        setDte]        = useState(60)
  const [moneyness,  setMoneyness]  = useState(95)
  const [sigma,      setSigma]      = useState(18)

  const priced      = positions.filter(p => !p.price_error)
  const totalValue  = priced.reduce((s, p) => s + (p.current_value ?? 0), 0)

  const S        = 528.40   // SPY proxy spot price
  const K        = S * moneyness / 100
  const T        = dte / 365
  const r        = 0.042
  const vol      = sigma / 100
  const optType  = strategy === 'collar' ? 'call' : 'put'
  const bs       = useMemo(() => blackScholes(S, K, T, r, vol, optType), [K, T, vol, optType])

  const contracts = totalValue > 0 ? Math.max(1, Math.ceil(totalValue / (S * 100) * 0.8)) : 1
  const cost      = bs.price * 100 * contracts
  const costBps   = totalValue > 0 ? (cost / totalValue) * 10000 : 0
  const breakeven = (K / S - 1) * 100 - (bs.price / S) * 100

  const payoffCurve = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 50; i++) {
      const spot           = S * (0.65 + (i / 50) * 0.7)
      const portfolioMove  = (spot / S - 1) * totalValue
      const putPayoff      = Math.max(K - spot, 0) * 100 * contracts - cost
      const hedged         = portfolioMove + (strategy === 'put' ? putPayoff : strategy === 'collar' ? putPayoff : -cost)
      pts.push({
        spot: Math.round(spot),
        Unhedged: +portfolioMove.toFixed(0),
        Hedged:   +hedged.toFixed(0),
      })
    }
    return pts
  }, [S, K, contracts, cost, totalValue, strategy])

  const PayoffTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--line)',
        borderRadius: 10, padding: '10px 14px',
        fontFamily: 'var(--font-mono)', fontSize: 12,
      }}>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.value >= 0 ? 'var(--pos)' : 'var(--neg)', marginBottom: 3 }}>
            {p.name}: {p.value >= 0 ? '+' : ''}${Math.abs(p.value).toLocaleString()}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Studio card */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card__head">
          <div>
            <div className="card__title">Hedging studio</div>
            <div className="card__sub">
              Black–Scholes put option pricing · educational only, not financial advice
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 10px',
            border: '1px solid var(--warn)', borderRadius: 6,
            color: 'var(--warn)', background: 'oklch(0.82 0.13 90 / 0.08)',
          }}>
            Simulated
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Strategy selector */}
          <div style={{ padding: 22, borderRight: '1px solid var(--line-soft)' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Strategy</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STRATEGIES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  style={{
                    padding: '12px 16px',
                    border: `1px solid ${strategy === s.id ? 'var(--ink)' : 'var(--line)'}`,
                    borderRadius: 10,
                    background: strategy === s.id ? 'var(--bg-2)' : 'var(--bg-1)',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 13.5, color: 'var(--ink)' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }}>{s.desc}</div>
                  </div>
                  <div style={{ fontSize: 16, color: strategy === s.id ? 'var(--pos)' : 'var(--ink-4)' }}>
                    {strategy === s.id ? '●' : '○'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Parameters</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <SliderRow label="Underlying" value={0} unit="SPY" readOnly />
              <SliderRow label="Days to expiry" value={dte} onChange={setDte} min={7} max={365} unit="d" />
              <SliderRow label="Strike (% of spot)" value={moneyness} onChange={setMoneyness} min={70} max={110} unit="%" />
              <SliderRow label="Implied vol (annual)" value={sigma} onChange={setSigma} min={8} max={80} unit="%" />
            </div>

            {/* Greeks */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
              marginTop: 22, paddingTop: 22, borderTop: '1px solid var(--line-soft)',
            }}>
              <KpiBox label="Contracts" value={contracts} />
              <KpiBox label="Total premium" value={`$${cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
              <KpiBox label="Cost of hedge" value={`${costBps.toFixed(0)} bps`} accent />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 10 }}>
              <KpiBox label="Δ Delta"  value={bs.delta.toFixed(3)} />
              <KpiBox label="Γ Gamma"  value={bs.gamma.toFixed(4)} />
              <KpiBox label="Θ Theta"  value={`${bs.theta.toFixed(2)}/d`} />
              <KpiBox label="ν Vega"   value={`${bs.vega.toFixed(2)}/%`} />
            </div>
          </div>
        </div>
      </div>

      {/* Payoff chart */}
      <div className="card">
        <div className="card__head">
          <div>
            <div className="card__title">Payoff at expiry</div>
            <div className="card__sub">
              Portfolio P&amp;L under each SPY scenario · hedged vs unhedged · K = ${K.toFixed(0)}
            </div>
          </div>
        </div>
        <div style={{ padding: '22px 22px 12px' }}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payoffCurve} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="grad-hedged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--pos)" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="var(--pos)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-unhedged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--ink-3)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--ink-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="spot"
                  tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                  tickLine={false} axisLine={false}
                  tickFormatter={v => `$${v}`}
                  label={{ value: 'SPY at expiry', position: 'insideBottom', offset: -4, fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
                  tickLine={false} axisLine={false}
                  tickFormatter={v => v >= 0 ? `+$${(Math.abs(v)/1000).toFixed(0)}K` : `-$${(Math.abs(v)/1000).toFixed(0)}K`}
                  width={60}
                />
                <ReferenceLine y={0} stroke="var(--line)" strokeDasharray="4 4" />
                <ReferenceLine x={Math.round(S)} stroke="var(--ink-4)" strokeDasharray="3 4" />
                <ReferenceLine x={Math.round(K)} stroke="var(--pos)" strokeDasharray="3 4" />
                <Tooltip content={<PayoffTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}
                />
                <Area
                  type="monotone" dataKey="Unhedged"
                  stroke="var(--ink-3)" strokeWidth={1.6} strokeDasharray="5 4"
                  fill="url(#grad-unhedged)"
                />
                <Area
                  type="monotone" dataKey="Hedged"
                  stroke="var(--pos)" strokeWidth={2.2}
                  fill="url(#grad-hedged)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two column summary */}
      <div className="two-col">
        <div className="card card--pad">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Risk reduction summary</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
            color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 16, lineHeight: 1.3,
          }}>
            If SPY falls −15%, this hedge saves you $
            {Math.max(0, (K - S * 0.85) * 100 * contracts - cost).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <InfoRow label="Portfolio value"    value={`$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
          <InfoRow label="Contracts bought"   value={`${contracts} × 100 shares`} />
          <InfoRow label="Coverage (approx.)" value="≈ 80% equity exposure" />
          <InfoRow label="Breakeven move"      value={`${breakeven.toFixed(2)}%`} />
          <InfoRow label="Put option premium"  value={`$${bs.price.toFixed(2)} per share`} />
          <InfoRow label="Total hedge cost"    value={`$${cost.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${costBps.toFixed(0)} bps)`} />
        </div>

        <div className="card card--pad">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Other ways to lower risk</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { k: 'Add defensive ETFs',   v: 'XLU, XLP, XLV — Utilities · Staples · Healthcare' },
              { k: 'Duration barbell',     v: 'Short T-bills + long 10Y Treasuries' },
              { k: 'Gold / BTC sleeve',    v: '5–10% to uncorrelated stores of value' },
              { k: 'Low-beta rotation',    v: 'Target portfolio β ≤ 0.75 via tilts' },
              { k: 'Trailing stops',       v: 'Preserve gains on concentrated positions' },
              { k: 'Covered calls',        v: 'Generate yield on existing large holdings' },
            ].map((it, i) => (
              <div key={i} style={{
                padding: '10px 12px', border: '1px solid var(--line-soft)',
                borderRadius: 8, display: 'flex', justifyContent: 'space-between',
                gap: 12, fontSize: 12.5,
              }}>
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{it.k}</span>
                <span style={{ color: 'var(--ink-3)', textAlign: 'right', fontSize: 11.5 }}>{it.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
