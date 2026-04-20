'use client'

import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Position } from '@/types'
import type { CurrencyConfig } from './Dashboard'
import { fmtCcy } from './Dashboard'

interface Props { positions: Position[]; ccy: CurrencyConfig }

export default function CashflowsTab({ positions, ccy }: Props) {
  // Sort positions chronologically
  const sorted = useMemo(() =>
    [...positions].sort((a, b) => a.buy_date.localeCompare(b.buy_date))
  , [positions])

  // Build cumulative invested capital timeline
  const timeline = useMemo(() => {
    let cumulative = 0
    const events = sorted.map(p => {
      const invested = p.shares * p.buy_price
      cumulative += invested
      return {
        date:       p.buy_date,
        ticker:     p.ticker,
        shares:     p.shares,
        buyPrice:   p.buy_price,
        invested,
        cumInvested: cumulative,
        currentValue: p.current_value ?? 0,
        pnl:          p.pnl ?? 0,
        returnPct:    p.return_pct ?? 0,
        priceError:   p.price_error ?? false,
      }
    })
    return events
  }, [sorted])

  // Build chart data: one point per event + today's current value
  const chartData = useMemo(() => {
    const points = timeline.map(e => ({
      date:        e.date,
      invested:    e.cumInvested,
      label:       e.ticker,
    }))
    // Add today's point with current total value
    const totalCurrentValue = positions.filter(p => !p.price_error).reduce((s, p) => s + (p.current_value ?? 0), 0)
    const totalInvested     = positions.reduce((s, p) => s + p.shares * p.buy_price, 0)
    if (points.length > 0) {
      points.push({ date: new Date().toISOString().split('T')[0], invested: totalInvested, label: 'Today' })
    }
    return { points, totalCurrentValue, totalInvested }
  }, [timeline, positions])

  const { totalCurrentValue, totalInvested } = chartData
  const totalPnL     = totalCurrentValue - totalInvested
  const totalReturn  = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  if (!positions.length) return (
    <div className="card"><div className="empty-state"><div className="empty-state__icon">💸</div><div className="empty-state__title">No positions yet</div><div className="empty-state__sub">Add positions to see your cashflow history.</div></div></div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Summary metrics ── */}
      <div className="metrics">
        <div className="metric metric--neutral" style={{ animation: 'fade-up 0.4s both' }}>
          <div className="metric__label">Total deployed</div>
          <div className="metric__val">{fmtCcy(totalInvested, ccy)}</div>
          <div className="metric__sub">Across {positions.length} positions</div>
        </div>
        <div className="metric metric--neutral" style={{ animation: 'fade-up 0.4s 80ms both' }}>
          <div className="metric__label">Current value</div>
          <div className="metric__val">{fmtCcy(totalCurrentValue, ccy)}</div>
          <div className="metric__sub">Mark-to-market</div>
        </div>
        <div className={`metric metric--${totalPnL >= 0 ? 'pos' : 'neg'}`} style={{ animation: 'fade-up 0.4s 160ms both' }}>
          <div className="metric__label">Unrealised P&amp;L</div>
          <div className={`metric__val ${totalPnL >= 0 ? 'is-pos' : 'is-neg'}`}>{fmtCcy(totalPnL, ccy, true)}</div>
          <div className="metric__sub">{totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}% total return</div>
        </div>
        <div className="metric metric--neutral" style={{ animation: 'fade-up 0.4s 240ms both' }}>
          <div className="metric__label">Avg cost / position</div>
          <div className="metric__val">{fmtCcy(positions.length > 0 ? totalInvested / positions.length : 0, ccy)}</div>
          <div className="metric__sub">Mean deployed per ticker</div>
        </div>
      </div>

      {/* ── Deployed capital chart ── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card__head">
          <div>
            <div className="card__title">Deployed capital over time</div>
            <div className="card__sub">Cumulative invested at each position open date · {ccy.code}</div>
          </div>
        </div>
        <div style={{ height: 300, padding: '20px 12px 8px 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.points} margin={{ top: 8, right: 20, bottom: 8, left: 64 }}>
              <defs>
                <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--brand-a)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--brand-a)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--line-soft)" vertical={false} />
              <XAxis dataKey="date" interval="preserveStartEnd" tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => fmtCcy(v, { ...ccy, dec: 0 })} width={60} tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const ev = chartData.points.find(p => p.date === label)
                  return (
                    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, boxShadow: 'var(--shadow-hi)' }}>
                      <div style={{ color: 'var(--ink-3)', marginBottom: 4, fontSize: 11 }}>{label}</div>
                      {ev?.label && ev.label !== 'Today' && <div style={{ color: 'var(--ink)', fontWeight: 700, marginBottom: 3 }}>← {ev.label} opened</div>}
                      <div style={{ color: 'var(--brand-a)', fontWeight: 700 }}>{fmtCcy(payload[0].value as number, ccy)} deployed</div>
                    </div>
                  )
                }}
              />
              <Area type="stepAfter" dataKey="invested" stroke="var(--brand-a)" strokeWidth={2.5} fill="url(#cashGrad)" dot={(props) => {
                const p = chartData.points[props.index]
                if (!p || p.label === 'Today') return <g key={props.index} />
                return <circle key={props.index} cx={props.cx} cy={props.cy} r={4} fill="var(--brand-a)" stroke="var(--bg-1)" strokeWidth={2} />
              }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Investment ledger ── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card__head">
          <div>
            <div className="card__title">Investment ledger</div>
            <div className="card__sub">All positions opened · {ccy.code} · sorted by date</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ticker</th>
                <th className="num">Shares</th>
                <th className="num">Buy price</th>
                <th className="num">Deployed ({ccy.code})</th>
                <th className="num">Current value</th>
                <th className="num">P&amp;L</th>
                <th className="num">Return</th>
                <th className="num">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((e, i) => {
                const isPos = e.pnl >= 0
                return (
                  <tr key={i}>
                    <td style={{ color: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{e.date}</td>
                    <td>
                      <div className="sym">
                        <div className="sym__logo" style={{ background: 'var(--bg-3)', color: 'var(--ink-2)', borderColor: 'var(--line)', fontSize: 9 }}>
                          {e.ticker.slice(0, 2)}
                        </div>
                        <div className="sym__ticker">{e.ticker}</div>
                      </div>
                    </td>
                    <td className="num">{e.shares}</td>
                    <td className="num">${e.buyPrice.toFixed(2)}</td>
                    <td className="num" style={{ color: 'var(--ink)' }}>{fmtCcy(e.invested, ccy)}</td>
                    <td className="num" style={{ color: 'var(--ink)' }}>
                      {e.priceError ? <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>—</span> : fmtCcy(e.currentValue, ccy)}
                    </td>
                    <td className={`num ${isPos ? 'pos' : 'neg'}`}>
                      {e.priceError ? '—' : fmtCcy(e.pnl, ccy, true)}
                    </td>
                    <td className={`num ${isPos ? 'pos' : 'neg'}`}>
                      {e.priceError ? '—' : `${e.returnPct >= 0 ? '+' : ''}${e.returnPct.toFixed(2)}%`}
                    </td>
                    <td className="num" style={{ color: 'var(--ink-2)' }}>{fmtCcy(e.cumInvested, ccy)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ padding: '12px 16px', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>Total</td>
                <td className="num" style={{ fontWeight: 700, color: 'var(--ink)' }}>{fmtCcy(totalInvested, ccy)}</td>
                <td className="num" style={{ fontWeight: 700, color: 'var(--ink)' }}>{fmtCcy(totalCurrentValue, ccy)}</td>
                <td className={`num ${totalPnL >= 0 ? 'pos' : 'neg'}`} style={{ fontWeight: 700 }}>{fmtCcy(totalPnL, ccy, true)}</td>
                <td className={`num ${totalReturn >= 0 ? 'pos' : 'neg'}`} style={{ fontWeight: 700 }}>{totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', padding: '4px 0' }}>
        Only buy events are tracked. Sell transactions require a dedicated transaction history table.
        Current values use latest available prices.
      </div>
    </div>
  )
}
