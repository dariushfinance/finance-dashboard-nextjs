'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Position } from '@/types'

const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#8b5cf6', '#14b8a6',
]

interface Props { positions: Position[] }

export default function AllocationChart({ positions }: Props) {
  if (!positions.length) return null

  const data = positions.map((p) => ({
    name: p.ticker,
    value: +(p.current_value ?? 0).toFixed(2),
  })).filter((d) => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
      <div className="bg-bg-elevated border border-bg-border rounded-lg p-3 text-xs font-mono">
        <div className="font-semibold text-text-primary mb-1">{item.name}</div>
        <div className="text-text-secondary">${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div className="text-brand-green">{total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%</div>
      </div>
    )
  }

  return (
    <div className="fin-card">
      <h2 className="font-semibold text-text-primary mb-4">Allocation</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-text-secondary font-mono">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
