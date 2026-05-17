'use client'

import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

interface NavSeries { dates: string[]; navs: number[] }

interface PortfolioData {
  range: { start: string; end: string }
  rebalances: { date: string }[]
  series: {
    model: NavSeries
    benchmarks: Record<string, NavSeries>
  }
}

const SERIES_META: Record<string, { label: string; color: string }> = {
  model:                 { label: 'Model (walk-forward)',   color: 'var(--accent)' },
  'equal-weight':        { label: 'Equal-weighted',         color: '#60a5fa' },
  'starting-allocation': { label: 'Starting allocation',    color: '#f59e0b' },
  'market-cap':          { label: 'Market-cap benchmark',   color: 'var(--ink-3)' },
}

export function HeroChart({ data, height = 360 }: { data: PortfolioData; height?: number }) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())

  const points = useMemo(() => {
    // Build a unified frame indexed by date
    const dateMap = new Map<string, Record<string, number>>()
    const addSeries = (key: string, s: NavSeries) => {
      for (let i = 0; i < s.dates.length; i++) {
        const d = s.dates[i]
        const row = dateMap.get(d) ?? { date: d } as Record<string, number | string>
        ;(row as Record<string, number>)[key] = s.navs[i]
        dateMap.set(d, row as Record<string, number>)
      }
    }
    addSeries('model', data.series.model)
    for (const [k, s] of Object.entries(data.series.benchmarks)) addSeries(k, s)
    return Array.from(dateMap.values()).sort((a: any, b: any) => a.date.localeCompare(b.date))
  }, [data])

  const seriesKeys = useMemo(() =>
    ['model', ...Object.keys(data.series.benchmarks)],
    [data])

  const toggle = (key: string) => {
    setHiddenKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  return (
    <div>
      {/* Legend / toggle */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 10, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
        {seriesKeys.map(k => {
          const meta = SERIES_META[k] ?? { label: k, color: 'var(--ink-3)' }
          const off = hiddenKeys.has(k)
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'transparent', border: 'none', cursor: 'pointer',
                opacity: off ? 0.35 : 1, padding: 0,
              }}
            >
              <span style={{ width: 12, height: 3, background: meta.color, borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: 'var(--ink-3)' }}>{meta.label}</span>
            </button>
          )
        })}
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points as any} margin={{ top: 8, right: 20, bottom: 28, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
              tickLine={false} axisLine={{ stroke: 'var(--line-soft)' }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}
              tickLine={false} axisLine={{ stroke: 'var(--line-soft)' }}
              tickFormatter={(v: number) => v.toFixed(2)}
              width={42}
              domain={['auto', 'auto']}
            />
            <Tooltip
              cursor={{ stroke: 'var(--line)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div style={{
                    background: 'var(--bg-2)', border: '1px solid var(--line)',
                    borderRadius: 10, padding: '8px 12px',
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    boxShadow: 'var(--shadow-hi)',
                  }}>
                    <div style={{ color: 'var(--ink-3)', marginBottom: 4 }}>{label}</div>
                    {payload.map((p: any) => (
                      <div key={p.dataKey} style={{ color: p.stroke }}>
                        {SERIES_META[p.dataKey]?.label ?? p.dataKey}: {Number(p.value).toFixed(3)}
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            {data.rebalances.map(r => (
              <ReferenceLine key={r.date} x={r.date} stroke="var(--line-soft)" strokeDasharray="2 4" />
            ))}
            {seriesKeys.map(k => {
              if (hiddenKeys.has(k)) return null
              const meta = SERIES_META[k] ?? { label: k, color: 'var(--ink-3)' }
              return (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={meta.color}
                  strokeWidth={k === 'model' ? 2.2 : 1.4}
                  dot={false}
                  isAnimationActive={false}
                />
              )
            })}
            <Legend content={() => null} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
