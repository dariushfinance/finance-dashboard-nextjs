'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const KEY = 'quantfoli:backtest-disclaimer:dismissed'

export function Disclaimer({ termsVersion }: { termsVersion: string }) {
  const [mobileExpanded, setMobileExpanded] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = window.localStorage.getItem(KEY)
    if (dismissed === '1' && window.matchMedia('(max-width: 720px)').matches) {
      setMobileExpanded(false)
    }
  }, [])

  const collapse = () => {
    setMobileExpanded(false)
    try { window.localStorage.setItem(KEY, '1') } catch {}
  }

  return (
    <aside
      style={{
        marginTop: 40,
        border: '1px solid oklch(0.78 0.16 305 / 0.45)',
        background: 'oklch(0.78 0.16 305 / 0.06)',
        borderRadius: 12,
        padding: 20,
        fontSize: 12.5,
        lineHeight: 1.65,
        color: 'var(--ink-2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--brand-b, oklch(0.82 0.15 305))', letterSpacing: '0.01em', textTransform: 'uppercase' }}>
          Backtest disclaimer
        </strong>
        <button
          type="button"
          onClick={collapse}
          className="mobile-only"
          style={{
            display: 'none',
            background: 'transparent', border: '1px solid var(--line)',
            borderRadius: 6, padding: '3px 8px',
            fontSize: 10, color: 'var(--ink-4)', cursor: 'pointer',
          }}
        >
          Collapse
        </button>
      </div>
      <div className={mobileExpanded ? '' : 'mobile-collapsed'}>
        Backtest results shown on this page are simulated and do not represent actual trading.
        Past performance does not predict future returns.
        Quantfoli does not provide personalised investment advice and is not a licensed financial adviser under FINIG / FIDLEG.
        Backtested performance does not account for tax effects beyond Swiss stamp duty, behavioural execution differences, slippage during fast markets, or extreme market dislocations.
        Full Advisor terms:{' '}
        <Link href="/advisor-legal" style={{ color: 'oklch(0.82 0.15 305)', textDecoration: 'underline' }}>
          Advisor Terms &amp; Disclaimer ({termsVersion})
        </Link>.
      </div>
    </aside>
  )
}
