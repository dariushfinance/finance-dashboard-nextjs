'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Position } from '@/types'
import type { DividendInfo } from '@/app/api/dividends/route'
import type { CurrencyConfig } from './Dashboard'
import { fmtCcy } from './Dashboard'

interface Props { positions: Position[]; ccy: CurrencyConfig }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function projectCalendar(infos: DividendInfo[], portfolioPositions: Position[]): { month: string; usd: number; label: string }[] {
  const now = new Date()
  const calendar: number[] = Array(12).fill(0)

  for (const info of infos) {
    if (!info.annualDPS || info.frequency === 'None') continue
    const pos = portfolioPositions.find(p => p.ticker === info.ticker)
    if (!pos) continue

    const annualIncome = info.annualDPS * pos.shares

    // Project based on frequency
    const paymentsPerYear = info.frequency === 'Monthly' ? 12
      : info.frequency === 'Quarterly' ? 4
      : info.frequency === 'Semi-Annual' ? 2
      : 1
    const perPayment = annualIncome / paymentsPerYear

    // Estimate which months based on last known payment date
    const lastPay = info.payments[info.payments.length - 1]
    const baseMonth = lastPay ? new Date(lastPay.date).getMonth() : 0
    const intervalMonths = Math.round(12 / paymentsPerYear)

    for (let p = 0; p < paymentsPerYear; p++) {
      const payMonth = (baseMonth + p * intervalMonths) % 12
      // Offset to future: only show next 12 months from now
      const futureMonth = (payMonth - now.getMonth() + 12) % 12
      calendar[futureMonth] += perPayment
    }
  }

  return MONTHS.map((m, i) => ({
    month: m,
    usd:   calendar[i],
    label: calendar[i] > 0 ? `$${calendar[i].toFixed(0)}` : '',
  }))
}

export default function DividendsTab({ positions, ccy }: Props) {
  const [infos, setInfos]     = useState<DividendInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const tickers = useMemo(() => [...new Set(positions.map(p => p.ticker))], [positions])

  useEffect(() => {
    if (!tickers.length) return
    setLoading(true); setError('')
    fetch('/api/dividends', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers }),
    })
      .then(r => r.json())
      .then(setInfos)
      .catch(() => setError('Failed to load dividend data'))
      .finally(() => setLoading(false))
  }, [tickers.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  // Merge dividend info with position data
  const enriched = useMemo(() => infos
    .filter(d => d.annualDPS > 0)
    .map(d => {
      const pos = positions.find(p => p.ticker === d.ticker)
      const shares = pos?.shares ?? 0
      const annualIncome = d.annualDPS * shares
      return { ...d, shares, annualIncome, weight: 0 }
    })
    .sort((a, b) => b.annualIncome - a.annualIncome)
  , [infos, positions])

  const totalAnnualUSD = enriched.reduce((s, d) => s + d.annualIncome, 0)
  const totalValueUSD  = positions.filter(p => !p.price_error).reduce((s, p) => s + (p.current_value ?? 0), 0)
  const portYield      = totalValueUSD > 0 ? totalAnnualUSD / totalValueUSD : 0

  const calendar = useMemo(() => projectCalendar(infos, positions), [infos, positions])
  const maxMonth  = Math.max(...calendar.map(m => m.usd), 1)

  const upcoming = useMemo(() =>
    infos
      .filter(d => d.lastExDate)
      .sort((a, b) => (a.lastExDate ?? '').localeCompare(b.lastExDate ?? ''))
      .slice(0, 6)
  , [infos])

  if (!positions.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Metric cards ── */}
      <div className="three-col">
        <div className="metric metric--neutral" style={{ animation: 'fade-up 0.4s both' }}>
          <div className="metric__label">Annual projected income
            <div className="metric__icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>
            </div>
          </div>
          <div className="metric__val">{fmtCcy(totalAnnualUSD, ccy)}</div>
          <div className="metric__sub">Based on last 12-mo payments</div>
        </div>
        <div className="metric metric--neutral" style={{ animation: 'fade-up 0.4s 80ms both' }}>
          <div className="metric__label">Portfolio yield
            <div className="metric__icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><path d="M16 8L8 16"/></svg>
            </div>
          </div>
          <div className="metric__val">{(portYield * 100).toFixed(2)}%</div>
          <div className="metric__sub">{enriched.length} dividend-paying positions</div>
        </div>
        <div className="metric metric--neutral" style={{ animation: 'fade-up 0.4s 160ms both' }}>
          <div className="metric__label">Avg monthly income
            <div className="metric__icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
          </div>
          <div className="metric__val">{fmtCcy(totalAnnualUSD / 12, ccy)}</div>
          <div className="metric__sub">≈ {fmtCcy(totalAnnualUSD / 365, ccy)} / day</div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-3)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span className="spinner" /> Fetching dividend data…
        </div>
      )}
      {error && <div style={{ color: 'var(--neg)', fontSize: 13, padding: '10px 0' }}>{error}</div>}

      {/* ── 12-month calendar ── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card__head">
          <div>
            <div className="card__title">Projected income calendar · next 12 months</div>
            <div className="card__sub">Based on historical payment frequency · indicative only</div>
          </div>
        </div>
        <div style={{ padding: '22px 22px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180 }}>
            {calendar.map((m, i) => {
              const h   = maxMonth > 0 ? (m.usd / maxMonth) * 140 + 8 : 8
              const isNow = i === new Date().getMonth() % 12
              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {m.usd > 0 && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-2)', fontWeight: 600 }}>
                      {fmtCcy(m.usd, { ...ccy, dec: 0 })}
                    </div>
                  )}
                  <div style={{
                    width: '100%', height: h,
                    background: m.usd > 0
                      ? `linear-gradient(180deg, var(--pos) 0%, oklch(0.82 0.156 162 / 0.4) 100%)`
                      : 'var(--bg-3)',
                    borderRadius: '5px 5px 0 0',
                    boxShadow: m.usd > 0 ? '0 0 12px var(--pos-glow)' : 'none',
                    opacity: isNow ? 1 : 0.75,
                    border: isNow ? '1.5px solid var(--pos)' : '1.5px solid transparent',
                    minWidth: 14,
                    transition: 'height 0.4s ease',
                  }} />
                  <div style={{ fontSize: 10, color: isNow ? 'var(--ink)' : 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontWeight: isNow ? 700 : 400 }}>
                    {m.month}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* ── Top contributors ── */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card__head">
            <div className="card__title">Top dividend contributors</div>
          </div>
          {enriched.length === 0 && !loading ? (
            <div style={{ padding: '32px 22px', color: 'var(--ink-3)', fontSize: 13, textAlign: 'center' }}>
              No dividend-paying positions found.
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th className="num">Yield</th>
                  <th className="num">DPS / yr</th>
                  <th className="num">Annual income</th>
                  <th className="num">Frequency</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map(d => (
                  <tr key={d.ticker}>
                    <td>
                      <div className="sym">
                        <div className="sym__logo" style={{ background: 'var(--pos-soft)', color: 'var(--pos)', borderColor: 'var(--pos-line)', fontSize: 9 }}>
                          {d.ticker.slice(0, 2)}
                        </div>
                        <div className="sym__ticker">{d.ticker}</div>
                      </div>
                    </td>
                    <td className="num pos">{(d.yield * 100).toFixed(2)}%</td>
                    <td className="num" style={{ color: 'var(--ink)' }}>${d.annualDPS.toFixed(4)}</td>
                    <td className="num pos">{fmtCcy(d.annualIncome, ccy)}</td>
                    <td className="num" style={{ color: 'var(--ink-3)', fontSize: 11 }}>{d.frequency}</td>
                  </tr>
                ))}
              </tbody>
              {enriched.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ padding: '12px 16px', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>Total annual income</td>
                    <td className="num pos" style={{ fontWeight: 700 }}>{fmtCcy(totalAnnualUSD, ccy)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        {/* ── Upcoming ex-dates ── */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card__head">
            <div>
              <div className="card__title">Last known ex-dates</div>
              <div className="card__sub">Verify upcoming dates with your broker</div>
            </div>
          </div>
          {upcoming.length === 0 && !loading ? (
            <div style={{ padding: '32px 22px', color: 'var(--ink-3)', fontSize: 13, textAlign: 'center' }}>
              No ex-date data available.
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {upcoming.map(d => {
                const pos = positions.find(p => p.ticker === d.ticker)
                const income = d.payments[d.payments.length - 1]?.amount ?? 0
                return (
                  <div key={d.ticker} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 18px', borderBottom: '1px solid var(--line-soft)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, color: 'var(--pos)' }}>
                        {d.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)', fontSize: 13 }}>{d.ticker}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 2 }}>{d.frequency}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>{d.lastExDate}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--pos)', marginTop: 2 }}>
                        ${income.toFixed(4)}/sh · {fmtCcy(income * (pos?.shares ?? 0), ccy)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Income bar chart */}
      {enriched.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card__head">
            <div className="card__title">Annual income by position ({ccy.code})</div>
          </div>
          <div style={{ height: 280, padding: '20px 12px 8px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enriched.map(d => ({ name: d.ticker, income: +(d.annualIncome * ccy.rate).toFixed(2) }))} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 60 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--line-soft)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={v => `${ccy.symbol}${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontWeight: 600 }} tickLine={false} axisLine={false} width={55} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 9, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        <div style={{ color: 'var(--pos)', fontWeight: 700 }}>{ccy.symbol}{payload[0].value}</div>
                        <div style={{ color: 'var(--ink-3)', fontSize: 10.5 }}>annual income</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="income" fill="var(--pos)" radius={[0, 4, 4, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', padding: '4px 0' }}>
        Dividend projections are estimates based on historical payment data. Ex-dates, amounts, and frequency may change.
        Always verify with your broker before making investment decisions.
      </div>
    </div>
  )
}
