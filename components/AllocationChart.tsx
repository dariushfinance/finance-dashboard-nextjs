'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { Position } from '@/types'
import { getTickerMeta, SECTOR_COLORS } from '@/lib/ticker-meta'
import type { CurrencyConfig } from './Dashboard'
import { fmtCcyCompact, fmtCcy } from './Dashboard'

interface Props { positions: Position[]; ccy: CurrencyConfig }

type View = 'donut' | 'treemap' | 'bars' | 'stacked'

const PALETTE = ['#6366f1','#22d3a0','#f59e0b','#60a5fa','#f472b6','#34d399','#fb923c','#a78bfa','#38bdf8','#4ade80']

// ── Treemap (recursive binary split) ────────────────────────────────────────

interface TreeCell { name: string; value: number; x: number; y: number; w: number; h: number; color: string }

function buildTreemap(items: { name: string; value: number; color: string }[], x: number, y: number, w: number, h: number): TreeCell[] {
  if (items.length === 0) return []
  if (items.length === 1) return [{ ...items[0], x, y, w, h }]
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const total  = sorted.reduce((s, i) => s + i.value, 0)
  let splitIdx = 1, runningSum = 0, bestBalance = Infinity
  for (let i = 0; i < sorted.length - 1; i++) {
    runningSum += sorted[i].value
    const balance = Math.abs(runningSum / total - 0.5)
    if (balance < bestBalance) { bestBalance = balance; splitIdx = i + 1 }
  }
  const ratio = sorted.slice(0, splitIdx).reduce((s, i) => s + i.value, 0) / total
  if (w >= h) {
    const w1 = w * ratio
    return [...buildTreemap(sorted.slice(0, splitIdx), x, y, w1, h), ...buildTreemap(sorted.slice(splitIdx), x + w1, y, w - w1, h)]
  } else {
    const h1 = h * ratio
    return [...buildTreemap(sorted.slice(0, splitIdx), x, y, w, h1), ...buildTreemap(sorted.slice(splitIdx), x, y + h1, w, h - h1)]
  }
}

function TreemapView({ data, total, ccy }: { data: { name: string; value: number; color: string }[]; total: number; ccy: CurrencyConfig }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 600, h: 320 })
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(es => setDims({ w: es[0].contentRect.width, h: 320 }))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  const cells = useMemo(() => buildTreemap(data, 0, 0, dims.w, dims.h), [data, dims])
  return (
    <div ref={ref} style={{ width: '100%', height: 320, position: 'relative' }}>
      <svg width={dims.w} height={dims.h}>
        {cells.map((c, i) => {
          const pct = total > 0 ? (c.value / total) * 100 : 0
          const fontSize = c.w > 60 && c.h > 40 ? Math.min(13, c.w / 5) : 0
          return (
            <g key={i}>
              <rect x={c.x + 1} y={c.y + 1} width={c.w - 2} height={c.h - 2} fill={c.color} opacity={0.85} rx={6} />
              <rect x={c.x + 1} y={c.y + 1} width={c.w - 2} height={Math.min(c.h - 2, 3)} fill="oklch(1 0 0 / 0.15)" rx={6} />
              {fontSize > 0 && (
                <>
                  <text x={c.x + c.w / 2} y={c.y + c.h / 2 - 6} textAnchor="middle" dominantBaseline="middle"
                    fill="oklch(0.97 0.004 90)" fontSize={fontSize} fontWeight={700} fontFamily="var(--font-display)">
                    {c.name}
                  </text>
                  <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 10} textAnchor="middle" dominantBaseline="middle"
                    fill="oklch(0.97 0 0 / 0.7)" fontSize={Math.max(fontSize - 2, 8)} fontFamily="var(--font-mono)">
                    {pct.toFixed(1)}%
                  </text>
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Stacked bar by sector ────────────────────────────────────────────────────

function StackedView({ data, total, ccy }: { data: { name: string; value: number; color: string; sector: string }[]; total: number; ccy: CurrencyConfig }) {
  const sectors: Record<string, { value: number; color: string; tickers: string[] }> = {}
  for (const d of data) {
    if (!sectors[d.sector]) sectors[d.sector] = { value: 0, color: SECTOR_COLORS[d.sector] ?? '#475569', tickers: [] }
    sectors[d.sector].value   += d.value
    sectors[d.sector].tickers.push(d.name)
  }
  const sectorArr = Object.entries(sectors).sort((a, b) => b[1].value - a[1].value)
  return (
    <div style={{ padding: '20px 0 8px' }}>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 48, borderRadius: 10, overflow: 'hidden', gap: 2, marginBottom: 20 }}>
        {sectorArr.map(([sector, s]) => (
          <div key={sector} title={`${sector}: ${(s.value/total*100).toFixed(1)}%`} style={{
            flex: s.value / total, background: s.color,
            minWidth: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: 'oklch(0.97 0.004 90)', fontFamily: 'var(--font-mono)', fontWeight: 700,
            overflow: 'hidden',
          }}>
            {s.value / total > 0.07 ? `${(s.value/total*100).toFixed(0)}%` : ''}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {sectorArr.map(([sector, s]) => (
          <div key={sector} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--ink-2)' }}>{sector}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', fontSize: 11 }}>{(s.value/total*100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      {/* Sector breakdown table */}
      <table className="tbl" style={{ marginTop: 16 }}>
        <thead><tr><th>Sector</th><th className="num">Value ({ccy.code})</th><th className="num">Weight</th><th className="num">Positions</th></tr></thead>
        <tbody>
          {sectorArr.map(([sector, s]) => (
            <tr key={sector}>
              <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} /><span style={{ color: 'var(--ink-2)' }}>{sector}</span></div></td>
              <td className="num" style={{ color: 'var(--ink)' }}>{fmtCcy(s.value, ccy)}</td>
              <td className="num"><span style={{ color: 'var(--ink)', fontWeight: 600 }}>{(s.value/total*100).toFixed(1)}%</span></td>
              <td className="num">{s.tickers.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Donut tooltip ────────────────────────────────────────────────────────────

function DonutTip({ active, payload, total, ccy }: { active?: boolean; payload?: { payload: { name: string; value: number; sector: string } }[]; total: number; ccy: CurrencyConfig }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 11, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, boxShadow: 'var(--shadow-hi)' }}>
      <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{d.name}</div>
      <div style={{ color: 'var(--ink-2)', marginBottom: 2 }}>{fmtCcy(d.value, ccy)}</div>
      <div style={{ color: 'var(--pos)', fontWeight: 600 }}>{total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</div>
      <div style={{ color: 'var(--ink-4)', fontSize: 10.5, marginTop: 3 }}>{d.sector}</div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AllocationChart({ positions, ccy }: Props) {
  const [view, setView] = useState<View>('donut')
  if (!positions.length) return null

  const data = positions
    .map((p, i) => ({
      name:   p.ticker,
      value:  +(p.current_value ?? 0).toFixed(2),
      sector: getTickerMeta(p.ticker).sector,
      color:  SECTOR_COLORS[getTickerMeta(p.ticker).sector] ?? PALETTE[i % PALETTE.length],
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((s, d) => s + d.value, 0)

  const VIEW_LABELS: { id: View; label: string }[] = [
    { id: 'donut',   label: 'Donut'   },
    { id: 'treemap', label: 'Treemap' },
    { id: 'bars',    label: 'Bars'    },
    { id: 'stacked', label: 'Stacked' },
  ]

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="card__head">
        <div>
          <div className="card__title">Allocation</div>
          <div className="card__sub">{data.length} holdings · {ccy.code}</div>
        </div>
        <div className="range-tabs">
          {VIEW_LABELS.map(v => (
            <button key={v.id} className={`range-tab ${view === v.id ? 'active' : ''}`} onClick={() => setView(v.id)}>{v.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 22px 22px' }}>
        {/* Donut */}
        {view === 'donut' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 0, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 220, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius="58%" outerRadius="84%" paddingAngle={2} dataKey="value" stroke="none">
                    {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<DonutTip total={total} ccy={ccy} />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-4)' }}>Total</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginTop: 3, letterSpacing: '-0.02em' }}>{fmtCcyCompact(total, ccy)}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.map((d, i) => {
                const pct = total > 0 ? (d.value / total) * 100 : 0
                return (
                  <div key={d.name} style={{ display: 'grid', gridTemplateColumns: '10px 60px 1fr 52px 48px', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)', fontSize: 12 }}>{d.name}</div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: d.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>{fmtCcyCompact(d.value, ccy)}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: d.color, fontWeight: 600, textAlign: 'right' }}>{pct.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Treemap */}
        {view === 'treemap' && <TreemapView data={data} total={total} ccy={ccy} />}

        {/* Bars */}
        {view === 'bars' && (
          <div style={{ height: Math.max(data.length * 38 + 60, 200) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.map(d => ({ name: d.name, value: +(d.value * ccy.rate).toFixed(ccy.dec), pct: +((d.value/total)*100).toFixed(1) }))} layout="vertical" margin={{ top: 4, right: 80, bottom: 4, left: 55 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--line-soft)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={v => `${ccy.symbol}${(v/1000).toFixed(1)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontWeight: 600 }} tickLine={false} axisLine={false} width={50} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 9, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>{d.name}</div>
                        <div style={{ color: 'var(--ink-2)' }}>{ccy.symbol}{d.value.toLocaleString('en-US')}</div>
                        <div style={{ color: 'var(--pos)', fontWeight: 600 }}>{d.pct}%</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                  {data.map((d, i) => <Cell key={i} fill={d.color} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stacked */}
        {view === 'stacked' && <StackedView data={data} total={total} ccy={ccy} />}
      </div>
    </div>
  )
}
