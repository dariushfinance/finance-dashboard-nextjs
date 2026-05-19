'use client'

import { useEffect, useState } from 'react'
import type { Position } from '@/types'

interface Props { positions: Position[] }

export default function FrontierHeadline({ positions }: Props) {
  const [ret, setRet] = useState<number | null>(null)
  const [vol, setVol] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const priced = positions.filter(p => !p.price_error && (p.current_price ?? 0) > 0)

  useEffect(() => {
    if (!priced.length) { setLoading(false); return }
    fetch('/api/frontier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positions: priced.map(p => ({
          ticker: p.ticker, shares: p.shares, current_price: p.current_price,
        })),
      }),
    })
      .then(r => r.json())
      .then(d => {
        const cur = d?.current
        if (cur && typeof cur.expectedReturn === 'number' && typeof cur.volatility === 'number') {
          setRet(cur.expectedReturn)
          setVol(cur.volatility)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [priced.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const retStr = ret != null ? `${(ret * 100).toFixed(1)}%` : (loading ? '…' : '—')
  const volStr = vol != null ? `${(vol * 100).toFixed(1)}%` : (loading ? '…' : '—')

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div className="stat-box" style={{ animation: 'fade-up 0.4s both', maxWidth: 420 }}>
        <div className="stat-box__label">Your portfolio</div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Historical-mean return
            </div>
            <div className="stat-box__val" style={{ color: 'var(--ink)' }}>{retStr}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Volatility
            </div>
            <div className="stat-box__val" style={{ color: 'var(--ink)' }}>{volStr}</div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.55 }}>
        Your current allocation&apos;s annualised historical-mean return and volatility, computed from trailing returns of your held positions.
      </div>
    </div>
  )
}
