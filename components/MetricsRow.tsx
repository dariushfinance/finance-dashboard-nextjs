'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  total_value: number
  total_invested: number
  total_pnl: number
  total_return: number
}

// ── Cubic ease-out count-up ───────────────────────────────────

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [v, setV] = useState(0)
  const rafRef    = useRef<number | null>(null)
  useEffect(() => {
    if (target === 0) { setV(0); return }
    const t0 = setTimeout(() => {
      let start: number | null = null
      const step = (ts: number) => {
        if (!start) start = ts
        const p = Math.min((ts - start) / duration, 1)
        setV(target * (1 - Math.pow(1 - p, 3)))
        if (p < 1) rafRef.current = requestAnimationFrame(step)
      }
      rafRef.current = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(t0); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, delay])
  return v
}

// ── Icons ─────────────────────────────────────────────────────

const I = ({ d, s = 14 }: { d: React.ReactNode; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const IcoWallet   = () => <I d={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H4L2 7"/><circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/></>} />
const IcoDollar   = () => <I d={<><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>} />
const IcoTrend    = () => <I d={<><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>} />
const IcoPercent  = () => <I d={<><circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><path d="M16 8L8 16"/></>} />

const fmtNum = (n: number, d = 2) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

// ── Supporting metric card ────────────────────────────────────

function SupportCard({
  label, value, sub, variant, icon, delay,
}: {
  label: string; value: string; sub: string
  variant: 'neutral' | 'pos' | 'neg'; icon: React.ReactNode; delay: number
}) {
  return (
    <div
      className={`metric metric--${variant}`}
      style={{ animation: `fade-up 0.5s ${delay}ms cubic-bezier(0.22,1,0.36,1) both` }}
    >
      <div className="metric__label">
        {label}
        <div className="metric__icon">{icon}</div>
      </div>
      <div className={`metric__val${variant === 'pos' ? ' is-pos' : variant === 'neg' ? ' is-neg' : ''}`}>
        {value}
      </div>
      <div className="metric__sub">{sub}</div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────

export default function MetricsRow({ total_value, total_invested, total_pnl, total_return }: Props) {
  const pnlPos = total_pnl >= 0
  const retPos = total_return >= 0

  const animValue    = useCountUp(total_value,            1300, 0)
  const animInvested = useCountUp(total_invested,         1100, 100)
  const animPnl      = useCountUp(Math.abs(total_pnl),   1100, 180)
  const animReturn   = useCountUp(Math.abs(total_return), 1000, 260)

  const heroInt = Math.floor(animValue).toLocaleString('en-US')
  const heroDec = (animValue % 1).toFixed(2).slice(1)

  return (
    <div className="metrics-hero">

      {/* ── Hero card — large portfolio value ── */}
      <div
        className="metric metric--neutral"
        style={{
          padding: '28px 32px 0',
          animation: 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
          display: 'flex', flexDirection: 'column',
          gridRow: '1',
        }}
      >
        {/* Top */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'var(--ink-4)',
            marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <div className="metric__icon"><IcoWallet /></div>
            Total Portfolio Value · USD
          </div>

          <div className="metric__val-hero">
            <span className="cur">$</span>
            {heroInt}
            <span className="dec">{heroDec}</span>
          </div>

          <div className="metric__delta-row">
            <span
              className="delta-chip"
              style={{
                background: pnlPos ? 'var(--pos-soft)' : 'var(--neg-soft)',
                color:      pnlPos ? 'var(--pos)'      : 'var(--neg)',
                border:     `1px solid ${pnlPos ? 'var(--pos-line)' : 'var(--neg-line)'}`,
              }}
            >
              {pnlPos ? '▲' : '▼'} {Math.abs(total_return).toFixed(2)}%
            </span>
            <span className="metric__delta-muted">
              {pnlPos ? '+' : '−'}${fmtNum(Math.abs(total_pnl))} unrealised P&amp;L
            </span>
          </div>
        </div>

        {/* Stat strip at bottom */}
        <div className="stat-strip" style={{ margin: '20px -32px 0' }}>
          <div className="stat-strip__item">
            <div className="stat-strip__label">Invested</div>
            <div className="stat-strip__val">${fmtNum(total_invested, 0)}</div>
          </div>
          <div className="stat-strip__item">
            <div className="stat-strip__label">Gain / Loss</div>
            <div className={`stat-strip__val ${pnlPos ? 'pos' : 'neg'}`}>
              {pnlPos ? '+' : '−'}${fmtNum(Math.abs(total_pnl))}
            </div>
          </div>
          <div className="stat-strip__item">
            <div className="stat-strip__label">Return</div>
            <div className={`stat-strip__val ${retPos ? 'pos' : 'neg'}`}>
              {retPos ? '+' : ''}{total_return.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Supporting cards ── */}
      <SupportCard
        label="Invested"
        value={`$${fmtNum(animInvested, 0)}`}
        sub="Total cost basis"
        variant="neutral"
        icon={<IcoDollar />}
        delay={100}
      />
      <SupportCard
        label="Unrealised P&L"
        value={`${pnlPos ? '+' : '−'}$${fmtNum(animPnl)}`}
        sub={`${Math.abs(total_return).toFixed(2)}% vs cost`}
        variant={pnlPos ? 'pos' : 'neg'}
        icon={<IcoTrend />}
        delay={180}
      />
      <SupportCard
        label="Total Return"
        value={`${retPos ? '+' : ''}${animReturn.toFixed(2)}%`}
        sub="All-time performance"
        variant={retPos ? 'pos' : 'neg'}
        icon={<IcoPercent />}
        delay={260}
      />
    </div>
  )
}
