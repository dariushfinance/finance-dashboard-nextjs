'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  total_value: number
  total_invested: number
  total_pnl: number
  total_return: number
}

// ── Spring count-up ───────────────────────────────────────────

function useCountUp(target: number, duration = 1100, delay = 0) {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef   = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const timeout = setTimeout(() => {
      startRef.current = null
      const step = (ts: number) => {
        if (!startRef.current) startRef.current = ts
        const progress = Math.min((ts - startRef.current) / duration, 1)
        // cubic ease-out
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(target * eased)
        if (progress < 1) rafRef.current = requestAnimationFrame(step)
      }
      rafRef.current = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(timeout)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, delay])

  return value
}

// ── Icons ─────────────────────────────────────────────────────

function Ico({ d, size = 14 }: { d: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  )
}
const IconWallet   = () => <Ico d={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H4L2 7"/><path d="M16 11h2"/></>} />
const IconInvested = () => <Ico d={<><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>} />
const IconPnl      = () => <Ico d={<><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>} />
const IconReturn   = () => <Ico d={<><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></>} />

// ── Single metric card ────────────────────────────────────────

interface CardProps {
  label: string
  animatedValue: number
  rawValue: number
  formatValue: (n: number) => string
  sub: string
  variant: 'neutral' | 'pos' | 'neg'
  icon: React.ReactNode
  stagger?: number
}

function MetricCard({ label, animatedValue, rawValue, formatValue, sub, variant, icon, stagger = 0 }: CardProps) {
  return (
    <div
      className={`metric metric--${variant}`}
      style={{ animationDelay: `${stagger}ms`, animation: 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
    >
      <div className="metric__label">
        {label}
        <div className="metric__icon">{icon}</div>
      </div>
      <div className={`metric__val${variant === 'pos' ? ' is-pos' : variant === 'neg' ? ' is-neg' : ''}`}>
        {formatValue(rawValue === 0 ? animatedValue : animatedValue)}
      </div>
      <div className="metric__sub">
        <span>{sub}</span>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────

export default function MetricsRow({ total_value, total_invested, total_pnl, total_return }: Props) {
  const pnlPos = total_pnl >= 0
  const retPos = total_return >= 0

  const animValue    = useCountUp(total_value,    1100, 0)
  const animInvested = useCountUp(total_invested, 1100, 80)
  const animPnl      = useCountUp(Math.abs(total_pnl), 1100, 160)
  const animReturn   = useCountUp(Math.abs(total_return), 1000, 240)

  const fmtLarge = (n: number) => {
    const int = Math.floor(n).toLocaleString('en-US')
    const dec = (n % 1).toFixed(2).slice(1)
    return `$${int}${dec}`
  }
  const fmtPnl = (n: number) => {
    const sign = pnlPos ? '+' : '−'
    return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  const fmtReturn = (n: number) => `${retPos ? '+' : ''}${n.toFixed(2)}%`

  return (
    <div className="metrics">
      <MetricCard
        label="Portfolio Value"
        animatedValue={animValue}
        rawValue={total_value}
        formatValue={fmtLarge}
        sub="Current market value"
        variant="neutral"
        icon={<IconWallet />}
        stagger={0}
      />
      <MetricCard
        label="Invested"
        animatedValue={animInvested}
        rawValue={total_invested}
        formatValue={n => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        sub="Total cost basis"
        variant="neutral"
        icon={<IconInvested />}
        stagger={80}
      />
      <MetricCard
        label="Unrealized P&L"
        animatedValue={animPnl}
        rawValue={Math.abs(total_pnl)}
        formatValue={fmtPnl}
        sub={`${Math.abs(total_return).toFixed(2)}% vs cost basis`}
        variant={pnlPos ? 'pos' : 'neg'}
        icon={<IconPnl />}
        stagger={160}
      />
      <MetricCard
        label="Total Return"
        animatedValue={animReturn}
        rawValue={Math.abs(total_return)}
        formatValue={fmtReturn}
        sub="All-time performance"
        variant={retPos ? 'pos' : 'neg'}
        icon={<IconReturn />}
        stagger={240}
      />
    </div>
  )
}
