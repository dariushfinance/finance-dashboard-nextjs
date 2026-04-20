'use client'

import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Position } from '@/types'
import {
  getTickerMeta,
  SECTOR_COLORS, COUNTRY_COLORS, REGION_COLORS, ASSET_TYPE_COLORS, MARKET_CAP_COLORS, MARKET_CAP_LABELS,
} from '@/lib/ticker-meta'

type View = 'sector' | 'country' | 'region' | 'marketcap' | 'assettype' | 'industry' | 'currency'

interface Props { positions: Position[] }

interface Group {
  name: string
  value: number
  pct: number
  count: number
  pnl: number
  color: string
  tickers: string[]
}

const VIEWS: { id: View; label: string }[] = [
  { id: 'sector',    label: 'Sector'     },
  { id: 'country',   label: 'Country'    },
  { id: 'region',    label: 'Region'     },
  { id: 'marketcap', label: 'Market Cap' },
  { id: 'assettype', label: 'Asset Type' },
  { id: 'industry',  label: 'Industry'   },
  { id: 'currency',  label: 'Currency'   },
]

function colorForView(view: View, key: string): string {
  if (view === 'sector')    return SECTOR_COLORS[key]    ?? '#475569'
  if (view === 'country')   return COUNTRY_COLORS[key]   ?? '#475569'
  if (view === 'region')    return REGION_COLORS[key]    ?? '#475569'
  if (view === 'assettype') return ASSET_TYPE_COLORS[key] ?? '#475569'
  if (view === 'marketcap') return MARKET_CAP_COLORS[key] ?? '#475569'
  // industry / currency — generate from hash
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0xffffffff
  const palette = ['#6366f1','#8b5cf6','#3b82f6','#22c55e','#f59e0b','#ef4444','#f97316','#10b981','#06b6d4','#14b8a6','#84cc16','#a855f7','#ec4899']
  return palette[Math.abs(h) % palette.length]
}

function keyForView(view: View, ticker: string): string {
  const m = getTickerMeta(ticker)
  if (view === 'sector')    return m.sector
  if (view === 'country')   return m.country
  if (view === 'region')    return m.region
  if (view === 'assettype') return m.assetType
  if (view === 'marketcap') return m.marketCap
  if (view === 'industry')  return m.industry
  if (view === 'currency')  return m.currency
  return 'Unknown'
}

function labelForView(view: View, key: string): string {
  if (view === 'marketcap') return MARKET_CAP_LABELS[key] ?? key
  return key
}

function fmtMoney(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

// Custom tooltip for donut
function DonutTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: Group }[] }) {
  if (!active || !payload?.length) return null
  const g = payload[0].payload
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--line)',
      borderRadius: 10, padding: '10px 14px',
      fontFamily: 'var(--font-mono)', fontSize: 12,
      boxShadow: 'var(--shadow-hi)',
    }}>
      <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{g.name}</div>
      <div style={{ color: 'var(--pos)' }}>{fmtMoney(g.value)}</div>
      <div style={{ color: 'var(--ink-3)' }}>{g.pct.toFixed(1)}% · {g.count} position{g.count !== 1 ? 's' : ''}</div>
    </div>
  )
}

export default function BreakdownTab({ positions }: Props) {
  const [view, setView] = useState<View>('sector')

  const priced = positions.filter(p => !p.price_error && (p.current_value ?? 0) > 0)
  const total  = priced.reduce((s, p) => s + (p.current_value ?? 0), 0)

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, { value: number; pnl: number; count: number; tickers: Set<string> }>()
    for (const p of priced) {
      const key = keyForView(view, p.ticker)
      const existing = map.get(key)
      const val  = p.current_value ?? 0
      const pnl_ = p.pnl ?? 0
      if (!existing) {
        map.set(key, { value: val, pnl: pnl_, count: 1, tickers: new Set([p.ticker]) })
      } else {
        existing.value += val
        existing.pnl   += pnl_
        existing.count++
        existing.tickers.add(p.ticker)
      }
    }
    return [...map.entries()]
      .map(([name, data]) => ({
        name,
        value: data.value,
        pct: total > 0 ? (data.value / total) * 100 : 0,
        count: data.count,
        pnl: data.pnl,
        color: colorForView(view, name),
        tickers: [...data.tickers],
      }))
      .sort((a, b) => b.value - a.value)
  }, [priced, view, total])

  const topGroup = groups[0]
  const topPct   = topGroup?.pct ?? 0
  const diversification = groups.length <= 1 ? 'Concentrated' : groups.length <= 3 ? 'Moderate' : 'Diversified'

  return (
    <div>
      {/* Summary metrics */}
      <div className="metrics" style={{ marginBottom: 20 }}>
        <div className="metric">
          <div className="metric__label">Categories</div>
          <div className="metric__val">{groups.length}</div>
          <div className="metric__sub">{diversification} portfolio</div>
        </div>
        <div className="metric">
          <div className="metric__label">Top position</div>
          <div className="metric__val" style={{ fontSize: 20 }}>{topGroup?.name ?? '—'}</div>
          <div className="metric__sub">
            <span className="mono" style={{ color: topPct > 50 ? 'var(--neg)' : 'var(--ink-3)' }}>
              {topPct.toFixed(1)}% of portfolio
            </span>
          </div>
        </div>
        <div className="metric">
          <div className="metric__label">Positions tracked</div>
          <div className="metric__val">{priced.length}</div>
          <div className="metric__sub">{positions.length - priced.length > 0 ? `${positions.length - priced.length} price errors` : 'All priced'}</div>
        </div>
        <div className="metric">
          <div className="metric__label">Portfolio value</div>
          <div className="metric__val" style={{ fontSize: 22 }}>
            <span className="cur">$</span>{Math.floor(total).toLocaleString('en-US')}
          </div>
          <div className="metric__sub">Current market value</div>
        </div>
      </div>

      <div className="card">
        {/* View switcher */}
        <div className="card__head">
          <div>
            <div className="card__title">Portfolio breakdown</div>
            <div className="card__sub">Slice your holdings by any dimension</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {VIEWS.map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 7,
                  fontSize: 11.5,
                  fontWeight: 500,
                  border: '1px solid var(--line)',
                  background: view === v.id ? 'var(--ink)' : 'var(--bg-2)',
                  color: view === v.id ? 'var(--bg)' : 'var(--ink-3)',
                  transition: 'all 0.15s',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart + table */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0 }}>
          {/* Donut */}
          <div style={{ padding: 22, borderRight: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 220, height: 220, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groups}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {groups.map((g, i) => (
                      <Cell key={i} fill={g.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut center */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'grid', placeItems: 'center',
                pointerEvents: 'none', textAlign: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ink-4)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {VIEWS.find(v => v.id === view)?.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginTop: 4, letterSpacing: '-0.02em' }}>
                    {groups.length}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>groups</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16, width: '100%' }}>
              {groups.slice(0, 6).map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: g.color }} />
                  <div style={{ flex: 1, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5 }}>{g.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>{g.pct.toFixed(1)}%</div>
                </div>
              ))}
              {groups.length > 6 && (
                <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 2 }}>+{groups.length - 6} more</div>
              )}
            </div>
          </div>

          {/* Ranked table */}
          <div style={{ overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>{VIEWS.find(v => v.id === view)?.label}</th>
                  <th className="num">Value</th>
                  <th className="num">Weight</th>
                  <th className="num">P&amp;L</th>
                  <th className="num">Positions</th>
                  <th style={{ width: 120 }}>Allocation bar</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: g.color }} />
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>
                            {labelForView(view, g.name)}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>
                            {g.tickers.slice(0, 4).join(' · ')}{g.tickers.length > 4 ? ' +' + (g.tickers.length - 4) : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="num" style={{ color: 'var(--ink)' }}>{fmtMoney(g.value)}</td>
                    <td className="num">
                      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{g.pct.toFixed(1)}%</span>
                    </td>
                    <td className={`num ${g.pnl >= 0 ? 'pos' : 'neg'}`}>
                      {g.pnl >= 0 ? '+' : ''}{fmtMoney(g.pnl)}
                    </td>
                    <td className="num">{g.count}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-3)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          width: `${g.pct}%`,
                          background: `linear-gradient(90deg, ${g.color}, ${g.color}88)`,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {groups.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                No priced positions to analyse.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Concentration warning */}
      {topPct > 50 && (
        <div style={{
          marginTop: 14, padding: '12px 16px',
          borderLeft: '3px solid var(--warn)',
          background: 'oklch(0.82 0.13 90 / 0.08)',
          borderRadius: '0 8px 8px 0',
          fontSize: 12.5, color: 'var(--ink-2)',
        }}>
          <strong style={{ color: 'var(--warn)' }}>High concentration:</strong>{' '}
          {topGroup.name} represents {topPct.toFixed(1)}% of your portfolio. Consider diversifying to reduce idiosyncratic risk.
        </div>
      )}
    </div>
  )
}
