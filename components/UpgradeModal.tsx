'use client'

import { useState } from 'react'
import {
  PLANS,
  PRO_INTERVALS,
  PRO_FEATURE_LIST,
  ADVISOR_INTERVALS,
  ADVISOR_FEATURE_LIST,
  type IntervalKey,
  type PlanKey,
} from '@/lib/stripe'

interface Props {
  onClose:     () => void
  userTier?:   'free' | 'pro' | 'advisor'
}

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
  const [loading,            setLoading]            = useState<string | null>(null)
  const [error,              setError]              = useState<string | null>(null)
  const [interval,           setInterval]           = useState<IntervalKey>('yearly')
  const [advisorAccepted,    setAdvisorAccepted]    = useState(false)
  const [advisorAcceptError, setAdvisorAcceptError] = useState<string | null>(null)

  const proInterval     = PRO_INTERVALS[interval]
  const advisorInterval = ADVISOR_INTERVALS[interval]

  const handleUpgrade = async (planKey: PlanKey) => {
    setLoading(planKey)
    setError(null)
    try {
      const isAdvisor = planKey === 'advisor' || planKey === 'advisor_yearly'

      if (isAdvisor) {
        if (!advisorAccepted) {
          setAdvisorAcceptError('You must accept the Advisor Terms to continue.')
          setLoading(null)
          return
        }
        const ack = await fetch('/api/advisor/accept-disclaimer', { method: 'POST' })
        const ackData = await ack.json()
        if (!ack.ok || !ackData.ok) {
          setError(ackData.error ?? 'Could not record acceptance.')
          setLoading(null)
          return
        }
      }

      const res  = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: planKey }),
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
          {/* Interval toggle */}
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 16,
          }}>
            <div style={{
              display: 'inline-flex', padding: 4,
              background: 'var(--bg-2)',
              border: '1px solid var(--line-soft)',
              borderRadius: 999,
              position: 'relative',
            }}>
              {(['monthly', 'yearly'] as const).map(iv => {
                const active = interval === iv
                const meta = PRO_INTERVALS[iv]
                return (
                  <button
                    key={iv}
                    type="button"
                    onClick={() => setInterval(iv)}
                    style={{
                      padding: '6px 16px', borderRadius: 999,
                      fontSize: 12, fontWeight: 600,
                      background: active ? 'var(--grad-brand)' : 'transparent',
                      color: active ? 'oklch(0.97 0 0)' : 'var(--ink-3)',
                      boxShadow: active ? '0 0 16px oklch(0.68 0.18 258 / 0.35)' : 'none',
                      transition: 'all 0.18s',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {meta.label}
                    {meta.savings && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '2px 6px', borderRadius: 4,
                        background: active ? 'oklch(0.97 0 0 / 0.20)' : 'oklch(0.82 0.156 162 / 0.15)',
                        color: active ? 'oklch(0.97 0 0)' : 'oklch(0.82 0.156 162)',
                        letterSpacing: '0.04em',
                      }}>
                        −17%
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
            {/* Free card */}
            <PlanCard
              isCurrent={userTier === 'free'}
              accent="var(--ink-3)"
              border="var(--line-soft)"
              badge={null}
              title={PLANS.free.name}
              price={PLANS.free.price}
              period={null}
              features={[...PLANS.free.features]}
              cta={
                userTier === 'free'
                  ? <DimNote>Current plan</DimNote>
                  : <DimNote>Downgrade via portal</DimNote>
              }
            />

            {/* Pro card */}
            <PlanCard
              isCurrent={userTier === 'pro'}
              accent="#C89B3C"
              border="#C89B3C"
              bg="oklch(0.84 0.148 80 / 0.06)"
              glow="0 0 32px oklch(0.84 0.148 80 / 0.18)"
              badge={userTier === 'pro' ? 'Your Plan' : 'Most Popular'}
              title={PLANS.pro.name}
              price={proInterval.price}
              period={proInterval.period}
              savings={proInterval.savings}
              features={PRO_FEATURE_LIST}
              cta={
                userTier === 'pro' ? (
                  <button
                    className="btn btn--ghost"
                    style={{ width: '100%', justifyContent: 'center', borderColor: '#C89B3C', color: '#C89B3C' }}
                    onClick={handlePortal}
                    disabled={loading !== null}
                  >
                    {loading === 'portal' ? 'Opening…' : 'Manage subscription'}
                  </button>
                ) : userTier === 'advisor' ? (
                  <DimNote>Downgrade via portal</DimNote>
                ) : (
                  <button
                    className="btn"
                    style={{
                      width: '100%', justifyContent: 'center',
                      background: '#C89B3C', color: '#000', border: 'none', fontWeight: 700,
                    }}
                    onClick={() => handleUpgrade(proInterval.planKey)}
                    disabled={loading !== null}
                  >
                    {loading === proInterval.planKey
                      ? 'Redirecting…'
                      : `Get Pro ${interval === 'yearly' ? '(yearly)' : '(monthly)'}`}
                  </button>
                )
              }
            />

            {/* Advisor card */}
            <PlanCard
              isCurrent={userTier === 'advisor'}
              accent="oklch(0.78 0.16 305)"
              border="oklch(0.78 0.16 305)"
              bg="oklch(0.78 0.16 305 / 0.06)"
              glow="0 0 32px oklch(0.78 0.16 305 / 0.18)"
              badge={userTier === 'advisor' ? 'Your Plan' : 'Premium'}
              title={PLANS.advisor.name}
              price={advisorInterval.price}
              period={advisorInterval.period}
              savings={advisorInterval.savings}
              features={ADVISOR_FEATURE_LIST}
              cta={
                userTier === 'advisor' ? (
                  <button
                    className="btn btn--ghost"
                    style={{ width: '100%', justifyContent: 'center', borderColor: 'oklch(0.78 0.16 305)', color: 'oklch(0.78 0.16 305)' }}
                    onClick={handlePortal}
                    disabled={loading !== null}
                  >
                    {loading === 'portal' ? 'Opening…' : 'Manage subscription'}
                  </button>
                ) : (
                  <button
                    className="btn"
                    style={{
                      width: '100%', justifyContent: 'center',
                      background: 'oklch(0.78 0.16 305)', color: '#000', border: 'none', fontWeight: 700,
                      opacity: advisorAccepted ? 1 : 0.55,
                      cursor: advisorAccepted ? 'pointer' : 'not-allowed',
                    }}
                    onClick={() => handleUpgrade(advisorInterval.planKey)}
                    disabled={loading !== null || !advisorAccepted}
                    title={advisorAccepted ? '' : 'Accept the Advisor Terms below first'}
                  >
                    {loading === advisorInterval.planKey
                      ? 'Redirecting…'
                      : `Get Advisor ${interval === 'yearly' ? '(yearly)' : '(monthly)'}`}
                  </button>
                )
              }
            />
          </div>

          {userTier !== 'advisor' && (
            <div style={{
              marginTop: 16,
              padding: '12px 14px',
              border: '1px solid oklch(0.78 0.16 305 / 0.45)',
              background: 'oklch(0.78 0.16 305 / 0.06)',
              borderRadius: 10,
              fontSize: 12,
              lineHeight: 1.55,
              color: 'var(--ink-2)',
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={advisorAccepted}
                  onChange={e => { setAdvisorAccepted(e.target.checked); setAdvisorAcceptError(null) }}
                  style={{ marginTop: 3, flexShrink: 0, accentColor: 'oklch(0.78 0.16 305)' }}
                />
                <span>
                  Required for Advisor: I have read and accept the{' '}
                  <a
                    href="/advisor-legal"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'oklch(0.82 0.15 305)', textDecoration: 'underline' }}
                  >
                    Advisor Terms & Disclaimer
                  </a>
                  . I understand Quantfoli provides quantitative analysis only — not investment advice — and that
                  every trading decision is my own.
                </span>
              </label>
              {advisorAcceptError && (
                <div style={{ marginTop: 6, color: 'var(--neg)', fontSize: 11 }}>
                  {advisorAcceptError}
                </div>
              )}
            </div>
          )}

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

// ── Card primitive ────────────────────────────────────────────────────────

function PlanCard({
  isCurrent, accent, border, bg, glow, badge,
  title, price, period, savings, features, cta,
}: {
  isCurrent: boolean
  accent:    string
  border:    string
  bg?:       string
  glow?:     string
  badge:     string | null
  title:     string
  price:     string
  period:    string | null
  savings?:  string | null
  features:  string[]
  cta:       React.ReactNode
}) {
  return (
    <div style={{
      border:        `1.5px solid ${isCurrent ? accent : border}`,
      borderRadius:  12, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative',
      background: isCurrent ? (bg ?? 'transparent') : 'var(--bg-1)',
      boxShadow: isCurrent ? (glow ?? 'none') : 'none',
      transition: 'box-shadow 0.2s',
    }}>
      {badge && (
        <div style={{
          position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
          background: accent, color: '#000',
          fontSize: 10, fontWeight: 700,
          padding: '2px 10px', borderRadius: 20,
          letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          {badge}
        </div>
      )}
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: isCurrent ? accent : 'var(--ink-2)' }}>
          {title}
        </div>
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>{price}</span>
          {period && <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{period}</span>}
        </div>
        {savings && (
          <div style={{
            marginTop: 6, fontSize: 11, fontWeight: 600,
            color: 'oklch(0.82 0.156 162)',
          }}>
            {savings}
          </div>
        )}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--ink-3)' }}>
            <span style={{ color: accent, marginTop: 1, flexShrink: 0 }}>
              <CheckIcon />
            </span>
            {f}
          </li>
        ))}
      </ul>
      {cta}
    </div>
  )
}

function DimNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      textAlign: 'center', fontSize: 12, color: 'var(--ink-4)',
      padding: '8px 0', borderTop: '1px solid var(--line-soft)', marginTop: 4,
    }}>
      {children}
    </div>
  )
}
