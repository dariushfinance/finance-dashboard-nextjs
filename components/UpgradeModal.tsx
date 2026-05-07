'use client'

import { useState } from 'react'
import { PLANS, type PlanKey } from '@/lib/stripe'

interface Props {
  onClose:     () => void
  userTier?:   'free' | 'pro' | 'pro_max'
}

const TIER_STYLE = {
  free:    { border: 'var(--line-soft)', bg: 'transparent',                     accent: 'var(--ink-3)',   glow: 'none' },
  pro:     { border: '#C89B3C',          bg: 'oklch(0.84 0.148 80 / 0.06)',     accent: '#C89B3C',        glow: '0 0 32px oklch(0.84 0.148 80 / 0.18)' },
  pro_max: { border: '#8B5CF6',          bg: 'oklch(0.62 0.21 290 / 0.07)',     accent: '#8B5CF6',        glow: '0 0 40px oklch(0.62 0.21 290 / 0.22)' },
} as const

function CheckIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export default function UpgradeModal({ onClose, userTier = 'free' }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const handleUpgrade = async (plan: PlanKey) => {
    setLoading(plan)
    setError(null)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Checkout failed — check Vercel logs')
        setLoading(null)
      }
    } catch (e) {
      setError(String(e))
      setLoading(null)
    }
  }

  const handlePortal = async () => {
    setLoading('portal')
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setLoading(null)
    } catch {
      setLoading(null)
    }
  }

  const cards: { key: 'free' | PlanKey; badge?: string }[] = [
    { key: 'free' },
    { key: 'pro',     badge: 'Most Popular' },
    { key: 'pro_max', badge: 'AI-Powered' },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 780, width: '95vw' }}
      >
        <div className="modal__head">
          <div>
            <div className="modal__head-title">
              {userTier === 'free' ? 'Upgrade your plan' : 'Manage your plan'}
            </div>
            <div className="modal__head-sub">Quant-grade analytics for serious investors</div>
          </div>
          <button className="icon-btn" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="modal__body" style={{ paddingTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {cards.map(({ key, badge }) => {
              const plan      = PLANS[key]
              const style     = TIER_STYLE[key]
              const isCurrent = userTier === key
              const isFree    = key === 'free'

              return (
                <div
                  key={key}
                  style={{
                    border:        `1.5px solid ${isCurrent ? style.accent : style.border}`,
                    borderRadius:  12,
                    padding:       20,
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           12,
                    position:      'relative',
                    background:    isCurrent ? style.bg : 'var(--bg-1)',
                    boxShadow:     isCurrent ? style.glow : 'none',
                    transition:    'box-shadow 0.2s',
                  }}
                >
                  {/* Badge */}
                  {badge && !isFree && (
                    <div style={{
                      position:      'absolute',
                      top:           -11,
                      left:          '50%',
                      transform:     'translateX(-50%)',
                      background:    style.accent,
                      color:         key === 'pro_max' ? '#fff' : '#000',
                      fontSize:      10,
                      fontWeight:    700,
                      padding:       '2px 10px',
                      borderRadius:  20,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      whiteSpace:    'nowrap',
                    }}>
                      {isCurrent ? 'Your Plan' : badge}
                    </div>
                  )}
                  {isFree && isCurrent && (
                    <div style={{
                      position:      'absolute',
                      top:           -11,
                      left:          '50%',
                      transform:     'translateX(-50%)',
                      background:    'var(--ink-4)',
                      color:         'var(--bg)',
                      fontSize:      10,
                      fontWeight:    700,
                      padding:       '2px 10px',
                      borderRadius:  20,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                    }}>
                      Your Plan
                    </div>
                  )}

                  {/* Plan name + price */}
                  <div>
                    <div style={{
                      fontWeight: 700,
                      fontSize:   15,
                      color:      isCurrent ? style.accent : 'var(--ink-2)',
                    }}>
                      {plan.name}
                    </div>
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
                        {plan.price}
                      </span>
                      {'period' in plan && plan.period && (
                        <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{plan.period}</span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--ink-3)' }}>
                        <span style={{ color: style.accent === 'var(--ink-3)' ? 'var(--ink-4)' : style.accent, marginTop: 1, flexShrink: 0 }}>
                          <CheckIcon />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    isFree ? (
                      <div style={{
                        textAlign:  'center',
                        fontSize:   12,
                        color:      'var(--ink-4)',
                        padding:    '8px 0',
                        borderTop:  '1px solid var(--line-soft)',
                        marginTop:  4,
                      }}>
                        Current plan
                      </div>
                    ) : (
                      <button
                        className="btn btn--ghost"
                        style={{ width: '100%', justifyContent: 'center', borderColor: style.accent, color: style.accent }}
                        onClick={handlePortal}
                        disabled={loading !== null}
                      >
                        {loading === 'portal' ? 'Opening…' : 'Manage subscription'}
                      </button>
                    )
                  ) : isFree ? (
                    <div style={{
                      textAlign: 'center',
                      fontSize:  12,
                      color:     'var(--ink-4)',
                      padding:   '8px 0',
                      borderTop: '1px solid var(--line-soft)',
                      marginTop: 4,
                    }}>
                      Downgrade via portal
                    </div>
                  ) : (
                    <button
                      className="btn"
                      style={{
                        width:           '100%',
                        justifyContent:  'center',
                        background:      style.accent,
                        color:           key === 'pro_max' ? '#fff' : '#000',
                        border:          'none',
                        fontWeight:      700,
                      }}
                      onClick={() => handleUpgrade(key as PlanKey)}
                      disabled={loading !== null}
                    >
                      {loading === key ? 'Redirecting…' : `Get ${plan.name}`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--neg)', marginTop: 12 }}>
              {error}
            </p>
          )}
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-4)', marginTop: 10 }}>
            Powered by Stripe · Apple Pay & Google Pay ready · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}
