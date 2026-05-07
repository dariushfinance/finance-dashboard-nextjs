'use client'

import { useState } from 'react'
import { PLANS, type PlanKey } from '@/lib/stripe'

interface Props {
  onClose: () => void
  hasSubscription?: boolean
}

function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
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

export default function UpgradeModal({ onClose, hasSubscription = false }: Props) {
  const [loading, setLoading] = useState<PlanKey | null>(null)
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
    setLoading('pro')
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(null)
    }
  }

  const plans: { key: 'free' | PlanKey; highlighted?: boolean }[] = [
    { key: 'free' },
    { key: 'pro', highlighted: true },
    { key: 'pro_max' },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 760, width: '95vw' }}
      >
        <div className="modal__head">
          <div>
            <div className="modal__head-title">Upgrade your plan</div>
            <div className="modal__head-sub">Unlock quant-grade analytics for your portfolio</div>
          </div>
          <button className="icon-btn" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="modal__body" style={{ paddingTop: 8 }}>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 12,
          }}>
            {plans.map(({ key, highlighted }) => {
              const plan = PLANS[key]
              const isPro    = key === 'pro'
              const isProMax = key === 'pro_max'
              const isFree   = key === 'free'

              return (
                <div
                  key={key}
                  style={{
                    border:       highlighted
                      ? '1.5px solid var(--brand-green)'
                      : '1px solid var(--line-soft)',
                    borderRadius: 12,
                    padding:      20,
                    display:      'flex',
                    flexDirection: 'column',
                    gap:          12,
                    position:     'relative',
                    background:   highlighted ? 'rgba(0,200,110,0.04)' : 'var(--surface)',
                  }}
                >
                  {highlighted && (
                    <div style={{
                      position:     'absolute',
                      top:          -11,
                      left:         '50%',
                      transform:    'translateX(-50%)',
                      background:   'var(--brand-green)',
                      color:        '#000',
                      fontSize:     10,
                      fontWeight:   700,
                      padding:      '2px 10px',
                      borderRadius: 20,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink-1)' }}>
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

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--ink-2)' }}>
                        <span style={{ color: 'var(--brand-green)', marginTop: 1, flexShrink: 0 }}><CheckIcon /></span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isFree ? (
                    <div style={{
                      textAlign:  'center',
                      fontSize:   12,
                      color:      'var(--ink-4)',
                      padding:    '8px 0',
                      borderTop:  '1px solid var(--line-soft)',
                      marginTop:  4,
                    }}>
                      Your current plan
                    </div>
                  ) : hasSubscription ? (
                    <button
                      className="btn btn--ghost"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={handlePortal}
                      disabled={loading !== null}
                    >
                      Manage subscription
                    </button>
                  ) : (
                    <button
                      className={`btn ${highlighted ? 'btn--primary' : 'btn--ghost'}`}
                      style={{ width: '100%', justifyContent: 'center' }}
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
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-4)', marginTop: 8 }}>
            Powered by Stripe · Apple Pay & Google Pay supported · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}
