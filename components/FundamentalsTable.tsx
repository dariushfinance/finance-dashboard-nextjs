'use client'

import { useState, useEffect } from 'react'
import type { Position, Fundamentals } from '@/types'

interface Props { positions: Position[] }

function fmtMult(v?: number | null) { return v != null ? `${v.toFixed(1)}x` : '—' }
function fmtPct(v?: number | null) { return v != null ? `${(v * 100).toFixed(1)}%` : '—' }

function colorClass(val: number | null | undefined, col: string): string {
  if (val == null) return 'text-text-muted'
  if (['gross_margin', 'net_margin', 'roe', 'rev_growth', 'fcf_yield'].includes(col)) {
    return val > 0 ? 'text-brand-green' : 'neg'
  }
  if (['pe', 'ev_ebitda', 'ps', 'debt_equity'].includes(col)) {
    return val < 15 ? 'pos' : val > 30 ? 'neg' : 'text-brand-gold'
  }
  return 'text-text-primary'
}

const COLS: { key: keyof Fundamentals; label: string; fmt: (v: number | null | undefined) => string; tip: string }[] = [
  { key: 'pe', label: 'P/E', fmt: fmtMult, tip: 'Price / Earnings — compare within sector' },
  { key: 'ev_ebitda', label: 'EV/EBITDA', fmt: fmtMult, tip: 'Core IB valuation multiple. <10x cheap, >20x growth premium' },
  { key: 'ps', label: 'P/S', fmt: fmtMult, tip: 'Price / Sales — useful for unprofitable growth cos' },
  { key: 'gross_margin', label: 'Gross Margin', fmt: fmtPct, tip: '>40% = strong pricing power' },
  { key: 'net_margin', label: 'Net Margin', fmt: fmtPct, tip: 'Bottom-line profitability. >10% healthy' },
  { key: 'roe', label: 'ROE', fmt: fmtPct, tip: 'Return on equity. >15% (Buffett benchmark)' },
  { key: 'debt_equity', label: 'D/E', fmt: fmtMult, tip: 'Leverage ratio. <2x comfortable for PE' },
  { key: 'rev_growth', label: 'Rev Growth', fmt: fmtPct, tip: 'YoY revenue growth' },
  { key: 'fcf_yield', label: 'FCF Yield', fmt: fmtPct, tip: 'Free Cash Flow / Market Cap. >5% = PE-attractive' },
]

export default function FundamentalsTable({ positions }: Props) {
  const [fundamentals, setFundamentals] = useState<Fundamentals[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!positions.length) return
    const tickers = [...new Set(positions.map((p) => p.ticker))]
    setLoading(true)
    setError('')
    fetch('/api/fundamentals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers }),
    })
      .then((r) => r.json())
      .then(setFundamentals)
      .catch(() => setError('Failed to load fundamentals'))
      .finally(() => setLoading(false))
  }, [positions])

  return (
    <div className="fin-card overflow-hidden p-0">
      <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Company Fundamentals</h2>
        {loading && <span className="spinner" />}
      </div>

      {error && <div className="px-5 py-3 text-brand-red text-sm">{error}</div>}

      <div className="overflow-x-auto">
        <table className="fin-table">
          <thead>
            <tr>
              <th>Ticker</th>
              {COLS.map((c) => (
                <th key={c.key} className="text-right" title={c.tip}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fundamentals.map((row) => (
              <tr key={row.ticker}>
                <td className="font-semibold text-text-primary">{row.ticker}</td>
                {COLS.map((c) => {
                  const val = row[c.key] as number | null | undefined
                  return (
                    <td key={c.key} className={`text-right ${colorClass(val, c.key)}`}>
                      {c.fmt(val)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Metric guide */}
      <details className="px-5 py-4 border-t border-bg-border">
        <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
          Metric Guide
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="fin-table text-xs">
            <thead>
              <tr>
                <th>Metric</th>
                <th>What it means</th>
                <th>Benchmark</th>
              </tr>
            </thead>
            <tbody>
              {COLS.map((c) => (
                <tr key={c.key}>
                  <td className="font-semibold">{c.label}</td>
                  <td className="text-text-secondary">{c.tip}</td>
                  <td className="text-text-muted">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
