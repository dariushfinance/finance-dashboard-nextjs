'use client'

interface Props {
  total_value: number
  total_invested: number
  total_pnl: number
  total_return: number
}

const fmtMoney = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MetricsRow({ total_value, total_invested, total_pnl, total_return }: Props) {
  const pnlPos = total_pnl >= 0
  const retPos = total_return >= 0

  return (
    <div className="metrics">
      <div className="metric">
        <div className="metric__label">Portfolio Value</div>
        <div className="metric__val">
          <span className="cur">$</span>
          {Math.floor(total_value).toLocaleString('en-US')}
          <span style={{ color: 'var(--ink-3)', fontSize: 18 }}>
            .{(total_value % 1).toFixed(2).slice(1)}
          </span>
        </div>
        <div className="metric__sub">
          <span>Current market value</span>
        </div>
      </div>

      <div className="metric">
        <div className="metric__label">Invested</div>
        <div className="metric__val">
          <span className="cur">$</span>
          {fmtMoney(total_invested)}
        </div>
        <div className="metric__sub">Total cost basis</div>
      </div>

      <div className="metric">
        <div className="metric__label">Unrealized P&amp;L</div>
        <div className="metric__val" style={{ color: pnlPos ? 'var(--pos)' : 'var(--neg)' }}>
          {pnlPos ? '+' : '−'}${fmtMoney(Math.abs(total_pnl))}
        </div>
        <div className="metric__sub">
          <span className={`chg ${pnlPos ? 'pos' : 'neg'}`}>
            {pnlPos ? '▲' : '▼'} {Math.abs(total_return).toFixed(2)}% vs cost basis
          </span>
        </div>
      </div>

      <div className="metric">
        <div className="metric__label">Total Return</div>
        <div className="metric__val" style={{ color: retPos ? 'var(--pos)' : 'var(--neg)' }}>
          {retPos ? '+' : ''}{total_return.toFixed(2)}%
        </div>
        <div className="metric__sub">
          <span>All-time performance</span>
        </div>
      </div>
    </div>
  )
}
