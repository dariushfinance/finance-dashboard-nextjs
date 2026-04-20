'use client'

import { useState } from 'react'
import type { Position } from '@/types'

interface Props {
  positions: Position[]
  onDelete: (id: number) => void
}

const TICKER_COLORS: Record<string, string> = {
  AAPL: '#6366f1', NVDA: '#22c55e', MSFT: '#3b82f6', AMZN: '#f59e0b',
  TSLA: '#ef4444', META: '#06b6d4', GOOGL: '#8b5cf6', GOOG: '#8b5cf6',
  BRK: '#d97706', JPM: '#0ea5e9', V: '#10b981', MA: '#f472b6',
}
function tickerColor(sym: string) {
  return TICKER_COLORS[sym] ?? 'var(--ink-3)'
}

export default function PortfolioTable({ positions, onDelete }: Props) {
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this position?')) return
    setDeleting(id)
    await onDelete(id)
    setDeleting(null)
  }

  if (!positions.length) return null

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card__head">
        <div>
          <div className="card__title">Positions</div>
          <div className="card__sub">{positions.length} holdings tracked</div>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Ticker</th>
              <th className="num">Shares</th>
              <th className="num">Buy Price</th>
              <th className="num">Current</th>
              <th className="num">Invested</th>
              <th className="num">Value</th>
              <th className="num">P&amp;L</th>
              <th className="num">Return</th>
              <th className="num">Since</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => {
              const pnl    = pos.pnl ?? null
              const ret    = pos.return_pct ?? null
              const isPos  = (pnl ?? 0) >= 0
              const color  = tickerColor(pos.ticker)

              return (
                <tr key={pos.id} style={pos.price_error ? { opacity: 0.55 } : {}}>
                  <td>
                    <div className="sym">
                      <div className="sym__logo" style={{ background: color + '22', color, borderColor: color + '44' }}>
                        {pos.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="sym__ticker">
                          {pos.ticker}
                          {pos.price_error && (
                            <span title="Price unavailable" style={{ color: 'var(--neg)', marginLeft: 5, fontSize: 11 }}>⚠</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="num">{pos.shares}</td>
                  <td className="num">${pos.buy_price.toFixed(2)}</td>
                  <td className="num" style={{ color: 'var(--ink)' }}>
                    {pos.price_error
                      ? <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>unavailable</span>
                      : `$${(pos.current_price ?? 0).toFixed(2)}`}
                  </td>
                  <td className="num">
                    ${(pos.invested ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="num" style={{ color: 'var(--ink)' }}>
                    {pos.price_error
                      ? <span style={{ color: 'var(--ink-4)' }}>—</span>
                      : `$${(pos.current_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </td>
                  <td className={`num ${pnl == null ? '' : isPos ? 'pos' : 'neg'}`}>
                    {pnl == null ? '—' : `${isPos ? '+' : ''}${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' })}`}
                  </td>
                  <td className={`num ${ret == null ? '' : isPos ? 'pos' : 'neg'}`}>
                    {ret == null ? '—' : `${isPos ? '+' : ''}${ret.toFixed(2)}%`}
                  </td>
                  <td className="num" style={{ color: 'var(--ink-4)', fontSize: 11 }}>{pos.buy_date}</td>
                  <td>
                    <button
                      className="row-action"
                      onClick={() => handleDelete(pos.id)}
                      disabled={deleting === pos.id}
                      title="Remove position"
                    >
                      {deleting === pos.id ? <span className="spinner" /> : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/>
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
