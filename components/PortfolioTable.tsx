'use client'

import { useState } from 'react'
import type { Position } from '@/types'
import type { CurrencyConfig } from './Dashboard'
import { fmtCcy } from './Dashboard'
import { getTickerMeta } from '@/lib/ticker-meta'

interface Props {
  positions: Position[]
  onDelete: (ticker: string) => void
  ccy: CurrencyConfig
}

const TICKER_COLORS: Record<string, string> = {
  AAPL: '#6366f1', NVDA: '#22c55e', MSFT: '#3b82f6', AMZN: '#f59e0b',
  TSLA: '#ef4444', META: '#06b6d4', GOOGL: '#8b5cf6', GOOG: '#8b5cf6',
  BRK: '#d97706', JPM: '#0ea5e9', V: '#10b981', MA: '#f472b6',
}
function tickerColor(sym: string) {
  return TICKER_COLORS[sym] ?? 'var(--ink-3)'
}

export default function PortfolioTable({ positions, onDelete, ccy }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (ticker: string, lotCount = 1) => {
    const msg = lotCount > 1
      ? `Remove all ${lotCount} lots of ${ticker}?`
      : `Remove ${ticker}?`
    if (!confirm(msg)) return
    setDeleting(ticker)
    await onDelete(ticker)
    setDeleting(null)
  }

  if (!positions.length) return null

  const cashCount = positions.filter(p => p.ticker === 'CASH' || p.ticker === 'USD').length
  const totalCash = positions
    .filter(p => p.ticker === 'CASH' || p.ticker === 'USD')
    .reduce((s, p) => s + (p.current_value ?? 0), 0)

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card__head">
        <div>
          <div className="card__title">Positions</div>
          <div className="card__sub">
            {positions.length} holdings
            {cashCount > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--pos)', fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>
                · {fmtCcy(totalCash, ccy)} cash
              </span>
            )}
          </div>
        </div>
        {ccy.code !== 'USD' && (
          <div className="fx-badge">
            Values in {ccy.code} · 1 USD = {ccy.rate.toFixed(ccy.code === 'JPY' ? 2 : 4)} {ccy.code}
          </div>
        )}
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Ticker</th>
              <th className="num">Shares</th>
              <th className="num">Buy Price</th>
              <th className="num">Current</th>
              <th className="num">Invested ({ccy.code})</th>
              <th className="num">Value ({ccy.code})</th>
              <th className="num">P&amp;L ({ccy.code})</th>
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
              const isCash = pos.ticker === 'CASH' || pos.ticker === 'USD'
              const meta   = getTickerMeta(pos.ticker)

              return (
                <tr key={pos.id} className={isCash ? 'is-cash' : ''} style={pos.price_error ? { opacity: 0.55 } : {}}>
                  <td>
                    <div className="sym">
                      <div className="sym__logo" style={{ background: color + '22', color, borderColor: color + '44' }}>
                        {pos.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="sym__ticker">
                          {pos.ticker}
                          {isCash && <span style={{ marginLeft: 5, fontSize: 9.5, background: 'var(--pos-soft)', color: 'var(--pos)', border: '1px solid var(--pos-line)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>CASH</span>}
                          {(pos.lot_count ?? 1) > 1 && <span style={{ marginLeft: 5, fontSize: 9.5, background: 'var(--ink-1)', color: 'var(--ink-3)', border: '1px solid var(--line)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{pos.lot_count} lots</span>}
                          {pos.price_error && <span title="Price unavailable" style={{ color: 'var(--neg)', marginLeft: 5, fontSize: 11 }}>⚠</span>}
                        </div>
                        <div className="sym__name">{meta.name !== pos.ticker ? meta.name : meta.sector}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num">{isCash ? '—' : pos.shares.toFixed(4)}</td>
                  <td className="num">{ccy.symbol}{(pos.buy_price * ccy.rate).toFixed(ccy.dec)}</td>
                  <td className="num" style={{ color: 'var(--ink)' }}>
                    {pos.price_error
                      ? <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>unavailable</span>
                      : isCash ? <span style={{ color: 'var(--ink-4)' }}>—</span>
                      : `${ccy.symbol}${((pos.current_price ?? 0) * ccy.rate).toFixed(ccy.dec)}`}
                  </td>
                  <td className="num">{fmtCcy(pos.invested ?? 0, ccy)}</td>
                  <td className="num" style={{ color: 'var(--ink)' }}>
                    {pos.price_error
                      ? <span style={{ color: 'var(--ink-4)' }}>—</span>
                      : fmtCcy(pos.current_value ?? 0, ccy)}
                  </td>
                  <td className={`num ${pnl == null ? '' : isPos ? 'pos' : 'neg'}`}>
                    {pnl == null ? '—' : fmtCcy(pnl, ccy, true)}
                  </td>
                  <td className={`num ${ret == null ? '' : isPos ? 'pos' : 'neg'}`}>
                    {ret == null ? '—' : `${isPos ? '+' : ''}${ret.toFixed(2)}%`}
                  </td>
                  <td className="num" style={{ color: 'var(--ink-4)', fontSize: 11 }}>{pos.buy_date}</td>
                  <td>
                    <button
                      className="row-action"
                      onClick={() => handleDelete(pos.ticker, pos.lot_count)}
                      disabled={deleting === pos.ticker}
                      title={`Remove ${pos.ticker}${(pos.lot_count ?? 1) > 1 ? ` (${pos.lot_count} lots)` : ''}`}
                    >
                      {deleting === pos.ticker ? <span className="spinner" /> : (
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
