'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Position } from '@/types'
import { getTickerMeta, SECTOR_COLORS } from '@/lib/ticker-meta'

interface Props { positions: Position[] }

const PALETTE = [
  '#6366f1','#22d3a0','#f59e0b','#60a5fa','#f472b6',
  '#34d399','#fb923c','#a78bfa','#38bdf8','#4ade80',
]

export default function AllocationChart({ positions }: Props) {
  if (!positions.length) return null

  const data = positions
    .map(p => ({
      name:   p.ticker,
      value:  +(p.current_value ?? 0).toFixed(2),
      sector: getTickerMeta(p.ticker).sector,
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((s, d) => s + d.value, 0)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof data[0] }[] }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
    return (
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--line)',
        borderRadius: 11, padding: '10px 14px',
        fontFamily: 'var(--font-mono)', fontSize: 12,
        boxShadow: 'var(--shadow-hi)',
      }}>
        <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{d.name}</div>
        <div style={{ color: 'var(--ink-2)', marginBottom: 2 }}>
          ${d.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ color: 'var(--pos)', fontWeight: 600 }}>{pct}%</div>
        <div style={{ color: 'var(--ink-4)', fontSize: 10.5, marginTop: 3 }}>{d.sector}</div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="card__head">
        <div>
          <div className="card__title">Allocation</div>
          <div className="card__sub">By position · {data.length} holdings</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 0, padding: '20px 22px', alignItems: 'center' }}>
        {/* Donut */}
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data} cx="50%" cy="50%"
                innerRadius="58%" outerRadius="84%"
                paddingAngle={2} dataKey="value" stroke="none"
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={SECTOR_COLORS[d.sector] ?? PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div style={{
            position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
            pointerEvents: 'none', textAlign: 'center',
          }}>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-4)' }}>
                Total
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginTop: 3, letterSpacing: '-0.02em' }}>
                ${total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Legend table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((d, i) => {
            const color = SECTOR_COLORS[d.sector] ?? PALETTE[i % PALETTE.length]
            const pct   = total > 0 ? (d.value / total) * 100 : 0
            return (
              <div key={d.name} style={{ display: 'grid', gridTemplateColumns: '10px 60px 1fr 52px 48px', alignItems: 'center', gap: 10, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)', fontSize: 12 }}>{d.name}</div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>
                  ${d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : d.value.toFixed(0)}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, fontWeight: 600, textAlign: 'right' }}>
                  {pct.toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
