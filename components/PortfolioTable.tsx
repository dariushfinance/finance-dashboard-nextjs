'use client'

import { useState } from 'react'
import type { Position } from '@/types'

interface Props {
  positions: Position[]
  onDelete: (id: number) => void
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
    <div className="fin-card overflow-hidden p-0">
      <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Positions</h2>
        <span className="text-xs text-text-muted">{positions.length} holdings</span>
      </div>
      <div className="overflow-x-auto">
        <table className="fin-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th className="text-right">Shares</th>
              <th className="text-right">Buy Price</th>
              <th className="text-right">Current</th>
              <th className="text-right">Invested</th>
              <th className="text-right">Value</th>
              <th className="text-right">P&L</th>
              <th className="text-right">Return</th>
              <th className="text-right">Since</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => {
              const pnl = pos.pnl ?? 0
              const ret = pos.return_pct ?? 0
              const isPos = pnl >= 0
              return (
                <tr key={pos.id}>
                  <td>
                    <span className="font-semibold text-text-primary text-sm">{pos.ticker}</span>
                  </td>
                  <td className="text-right text-text-secondary">{pos.shares}</td>
                  <td className="text-right text-text-secondary">
                    ${pos.buy_price.toFixed(2)}
                  </td>
                  <td className="text-right text-text-primary font-medium">
                    ${(pos.current_price ?? 0).toFixed(2)}
                  </td>
                  <td className="text-right text-text-secondary">
                    ${(pos.invested ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right text-text-primary">
                    ${(pos.current_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`text-right font-medium ${isPos ? 'pos' : 'neg'}`}>
                    {isPos ? '+' : ''}{pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' })}
                  </td>
                  <td className={`text-right font-medium ${isPos ? 'pos' : 'neg'}`}>
                    {isPos ? '+' : ''}{ret.toFixed(2)}%
                  </td>
                  <td className="text-right text-text-muted text-xs">{pos.buy_date}</td>
                  <td className="text-right">
                    <button
                      className="text-text-muted hover:text-brand-red transition-colors text-xs px-2 py-1 rounded hover:bg-brand-red/10"
                      onClick={() => handleDelete(pos.id)}
                      disabled={deleting === pos.id}
                    >
                      {deleting === pos.id ? <span className="spinner" /> : '✕'}
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
