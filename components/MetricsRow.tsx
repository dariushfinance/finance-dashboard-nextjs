'use client'

interface Props {
  total_value: number
  total_invested: number
  total_pnl: number
  total_return: number
}

function fmt(n: number, prefix = '$') {
  return `${prefix}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function MetricCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
}) {
  return (
    <div className="fin-card flex flex-col gap-1 hover:shadow-card-hover transition-shadow">
      <div className="text-xs font-medium text-text-muted uppercase tracking-widest">{label}</div>
      <div
        className={`fin-value ${
          positive === true ? 'pos' : positive === false ? 'neg' : 'text-text-primary'
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
    </div>
  )
}

export default function MetricsRow({ total_value, total_invested, total_pnl, total_return }: Props) {
  const pnlPositive = total_pnl >= 0
  const retPositive = total_return >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Portfolio Value"
        value={`$${total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        sub="Current market value"
      />
      <MetricCard
        label="Invested"
        value={`$${total_invested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        sub="Total cost basis"
      />
      <MetricCard
        label="P&L"
        value={`${pnlPositive ? '+' : '-'}${fmt(total_pnl)}`}
        sub="Unrealized gain/loss"
        positive={pnlPositive}
      />
      <MetricCard
        label="Return"
        value={`${retPositive ? '+' : ''}${total_return.toFixed(2)}%`}
        sub="vs. cost basis"
        positive={retPositive}
      />
    </div>
  )
}
