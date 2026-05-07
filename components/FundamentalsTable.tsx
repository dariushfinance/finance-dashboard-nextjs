'use client'

import { useState, useEffect } from 'react'
import type { Position, Fundamentals } from '@/types'

interface Props { positions: Position[] }

function fmtMult(v?: number | null) { return v != null ? `${v.toFixed(1)}x` : '—' }
function fmtPct(v?: number | null)  { return v != null ? `${(v * 100).toFixed(1)}%` : '—' }

function valColor(val: number | null | undefined, col: string): string {
  if (val == null) return 'var(--ink-4)'
  if (['gross_margin', 'net_margin', 'roe', 'rev_growth', 'fcf_yield'].includes(col))
    return val > 0 ? 'var(--pos)' : 'var(--neg)'
  if (['pe', 'ev_ebitda', 'ps', 'debt_equity'].includes(col))
    return val < 15 ? 'var(--pos)' : val > 30 ? 'var(--neg)' : 'var(--warn)'
  return 'var(--ink)'
}

const COLS: { key: keyof Fundamentals; label: string; fmt: (v: number | null | undefined) => string; tip: string }[] = [
  { key: 'pe',          label: 'P/E',         fmt: fmtMult, tip: 'Price / Earnings — compare within sector. <15x cheap, >30x rich' },
  { key: 'ev_ebitda',   label: 'EV/EBITDA',   fmt: fmtMult, tip: 'Core IB valuation multiple. <10x cheap, >20x growth premium' },
  { key: 'ps',          label: 'P/S',          fmt: fmtMult, tip: 'Price / Sales — useful for unprofitable growth cos' },
  { key: 'gross_margin',label: 'Gross Margin', fmt: fmtPct,  tip: '>40% = strong pricing power' },
  { key: 'net_margin',  label: 'Net Margin',   fmt: fmtPct,  tip: 'Bottom-line profitability. >10% healthy' },
  { key: 'roe',         label: 'ROE',          fmt: fmtPct,  tip: 'Return on equity. >15% (Buffett benchmark)' },
  { key: 'debt_equity', label: 'D/E',          fmt: fmtMult, tip: 'Leverage ratio. <2x comfortable for PE' },
  { key: 'rev_growth',  label: 'Rev Growth',   fmt: fmtPct,  tip: 'YoY revenue growth' },
  { key: 'fcf_yield',   label: 'FCF Yield',    fmt: fmtPct,  tip: 'Free Cash Flow / Market Cap. >5% = PE-attractive' },
]

const th: React.CSSProperties = {
  padding:       '10px 14px',
  fontSize:      11,
  fontWeight:    600,
  color:         'var(--ink-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderBottom:  '1px solid var(--line-soft)',
  whiteSpace:    'nowrap',
  background:    'var(--bg-1)',
}

const td: React.CSSProperties = {
  padding:    '11px 14px',
  fontSize:   13,
  borderBottom: '1px solid var(--line-soft)',
  whiteSpace: 'nowrap',
}

export default function FundamentalsTable({ positions }: Props) {
  const [fundamentals, setFundamentals] = useState<Fundamentals[]>([])
  const [loading, setLoading]           = useState(false)
  const [loadingMsg, setLoadingMsg]     = useState('')
  const [error, setError]               = useState('')

  useEffect(() => {
    if (!positions.length) return
    const tickers = [...new Set(positions.map(p => p.ticker))]
    setLoading(true)
    setError('')
    setLoadingMsg(`Fetching ${tickers.length} ticker${tickers.length > 1 ? 's' : ''}… (~${tickers.length * 13}s due to API rate limit)`)
    fetch('/api/fundamentals', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tickers }),
    })
      .then(r => r.json())
      .then(setFundamentals)
      .catch(() => setError('Failed to load fundamentals'))
      .finally(() => { setLoading(false); setLoadingMsg('') })
  }, [positions])

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '16px 20px',
        borderBottom:   '1px solid var(--line-soft)',
      }}>
        <div>
          <div className="card__title">Company Fundamentals</div>
          <div className="card__sub">Valuation · Profitability · Growth · Leverage</div>
        </div>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="spinner" />
            {loadingMsg && <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>{loadingMsg}</span>}
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--neg)' }}>{error}</div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left', paddingLeft: 20 }}>Ticker</th>
              {COLS.map(c => (
                <th key={c.key} style={{ ...th, textAlign: 'right' }} title={c.tip}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fundamentals.map((row, i) => (
              <tr
                key={row.ticker}
                style={{ background: i % 2 === 0 ? 'transparent' : 'oklch(from var(--bg-1) l c h / 0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'oklch(from var(--bg-1) l c h / 0.4)')}
              >
                <td style={{ ...td, paddingLeft: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)' }}>
                      {row.ticker}
                    </span>
                    {row.rateLimited && (
                      <span style={{
                        fontSize:     10,
                        fontFamily:   'var(--font-mono)',
                        color:        'var(--warn)',
                        background:   'oklch(from var(--warn) l c h / 0.12)',
                        border:       '1px solid oklch(from var(--warn) l c h / 0.25)',
                        borderRadius: 4,
                        padding:      '1px 6px',
                      }} title="Alpha Vantage rate limit reached — retry in ~60s">
                        rate limit
                      </span>
                    )}
                  </div>
                </td>
                {COLS.map(c => {
                  const val = row[c.key] as number | null | undefined
                  const color = row.rateLimited ? 'var(--ink-4)' : valColor(val, c.key)
                  const text  = row.rateLimited ? '—' : c.fmt(val)
                  const isPositive = !row.rateLimited && val != null && color === 'var(--pos)'
                  const isNegative = !row.rateLimited && val != null && color === 'var(--neg)'
                  return (
                    <td key={c.key} style={{ ...td, textAlign: 'right' }}>
                      <span style={{
                        color,
                        fontFamily:   'var(--font-mono)',
                        fontSize:     13,
                        fontWeight:   val != null && !row.rateLimited ? 600 : 400,
                        background:   isPositive ? 'var(--pos-soft)' : isNegative ? 'var(--neg-soft)' : 'transparent',
                        borderRadius: 4,
                        padding:      val != null && !row.rateLimited ? '2px 6px' : undefined,
                      }}>
                        {text}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
            {!loading && fundamentals.length === 0 && !error && (
              <tr>
                <td colSpan={COLS.length + 1} style={{ ...td, textAlign: 'center', color: 'var(--ink-4)', padding: '32px 0' }}>
                  No data yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{
        padding:      '12px 20px',
        borderTop:    '1px solid var(--line-soft)',
        display:      'flex',
        gap:          20,
        flexWrap:     'wrap',
        fontSize:     11,
        color:        'var(--ink-4)',
        fontFamily:   'var(--font-mono)',
      }}>
        <span style={{ color: 'var(--pos)' }}>■</span> Attractive &nbsp;
        <span style={{ color: 'var(--warn)' }}>■</span> Neutral &nbsp;
        <span style={{ color: 'var(--neg)' }}>■</span> Expensive / Weak &nbsp;
        <span style={{ color: 'var(--ink-4)' }}>— Hover column headers for definitions</span>
      </div>
    </div>
  )
}
