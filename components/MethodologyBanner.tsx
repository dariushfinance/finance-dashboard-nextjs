'use client'

import { useState, useEffect } from 'react'

export function MethodologyBanner() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem('methodology-banner-dismissed') === 'true')
  }, [])

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem('methodology-banner-dismissed', 'true')
    setDismissed(true)
  }

  return (
    <div
      data-tier="advisor"
      style={{
        background: 'var(--accent-advisor-bg, rgba(124, 58, 237, 0.08))',
        borderBottom: '1px solid var(--accent-advisor, #7c3aed)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
    >
      <div style={{ flex: 1, color: 'var(--ink-2)' }}>
        <strong>Methodology update in progress:</strong>{' '}
        We're refining FX handling for non-CHF instruments in the
        Conservative and Growth ETF backtests. Absolute Sharpe and return
        levels may revise after the fix. The relative model-vs-benchmark
        statistics shown on this page are unaffected by the in-progress
        refinement.
      </div>
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--ink-3)',
          cursor: 'pointer',
          fontSize: '20px',
          lineHeight: 1,
          padding: '0 4px',
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}