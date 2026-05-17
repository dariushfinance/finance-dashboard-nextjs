'use client'

import { useState } from 'react'
import { PRO_INTERVALS, ADVISOR_INTERVALS, type IntervalKey } from '@/lib/stripe'

export function CTACards({ userTier = 'free' as 'free' | 'pro' | 'advisor' }) {
  const [interval, setInterval] = useState<IntervalKey>('yearly')
  const [advisorAccepted, setAdvisorAccepted] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pro = PRO_INTERVALS[interval]
  const advisor = ADVISOR_INTERVALS[interval]

  const handleCheckout = async (planKey: string, isAdvisor: boolean) => {
    setLoading(planKey)
    setError(null)
    try {
      if (isAdvisor) {
        if (!advisorAccepted) {
          setError('Accept the Advisor Terms to continue.')
          setLoading(null); return
        }
        const ack = await fetch('/api/advisor/accept-disclaimer', { method: 'POST' })
        const ackData = await ack.json()
        if (!ack.ok || !ackData.ok) { setError(ackData.error ?? 'Could not record acceptance.'); setLoading(null); return }
      }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else { setError(data.error ?? 'Checkout failed.'); setLoading(null) }
    } catch (e) {
      setError(String(e)); setLoading(null)
    }
  }

  return (
    <section
      id="cta"
      style={{
        marginTop: 48, scrollMarginTop: 80,
        padding: '32px 24px',
        border: '1px solid var(--line-soft)',
        borderRadius: 14,
        background: 'var(--bg-1)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
          Run the same analysis on your own portfolio
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
          Upload your ZKB, Yuh or Neon export — get the model output, the rebalancing decisions, the stress tests.
        </p>
      </div>

      {/* Interval toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
        <div style={{
          display: 'inline-flex', padding: 4,
          background: 'var(--bg-2)', border: '1px solid var(--line-soft)', borderRadius: 999,
        }}>
          {(['monthly', 'yearly'] as const).map(iv => {
            const active = interval === iv
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
                  border: 'none', cursor: 'pointer',
                }}
              >
                {iv === 'monthly' ? 'Monthly' : 'Yearly · −17%'}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {/* Pro */}
        <div style={{ border: '1.5px solid #C89B3C', borderRadius: 12, padding: 20, background: 'oklch(0.84 0.148 80 / 0.06)' }}>
          <div style={{ fontWeight: 700, color: '#C89B3C', fontSize: 15 }}>Pro</div>
          <div style={{ marginTop: 4, fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
            {pro.price}<span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{pro.period}</span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 10, lineHeight: 1.55 }}>
            Run the Markowitz frontier, stress tests, and Sharpe/Sortino/Beta/Alpha on your own portfolio.
          </p>
          <button
            type="button"
            disabled={loading !== null || userTier === 'pro'}
            onClick={() => handleCheckout(pro.planKey, false)}
            style={{
              marginTop: 14, width: '100%', padding: '10px 14px',
              background: '#C89B3C', color: '#000', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              opacity: userTier === 'pro' ? 0.5 : 1,
            }}
          >
            {userTier === 'pro' ? 'Current plan' : loading === pro.planKey ? 'Redirecting…' : `Get Pro ${interval === 'yearly' ? '(yearly)' : '(monthly)'}`}
          </button>
        </div>

        {/* Advisor */}
        <div style={{ border: '1.5px solid oklch(0.78 0.16 305)', borderRadius: 12, padding: 20, background: 'oklch(0.78 0.16 305 / 0.06)' }}>
          <div style={{ fontWeight: 700, color: 'oklch(0.82 0.15 305)', fontSize: 15 }}>Advisor</div>
          <div style={{ marginTop: 4, fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
            {advisor.price}<span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{advisor.period}</span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 10, lineHeight: 1.55 }}>
            Monthly walk-forward report: what the model computes on your portfolio — and, just as importantly, where it doesn&apos;t help and why.
          </p>

          {userTier !== 'advisor' && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={advisorAccepted}
                onChange={e => setAdvisorAccepted(e.target.checked)}
                style={{ marginTop: 2, accentColor: 'oklch(0.78 0.16 305)' }}
              />
              <span>
                I accept the <a href="/advisor-legal" target="_blank" rel="noopener noreferrer" style={{ color: 'oklch(0.82 0.15 305)', textDecoration: 'underline' }}>Advisor Terms &amp; Disclaimer</a>.
                Quantfoli provides quantitative analysis only — not investment advice.
              </span>
            </label>
          )}

          <button
            type="button"
            disabled={loading !== null || userTier === 'advisor' || !advisorAccepted}
            onClick={() => handleCheckout(advisor.planKey, true)}
            style={{
              marginTop: 14, width: '100%', padding: '10px 14px',
              background: 'oklch(0.78 0.16 305)', color: '#000', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13,
              cursor: advisorAccepted ? 'pointer' : 'not-allowed',
              opacity: userTier === 'advisor' || !advisorAccepted ? 0.5 : 1,
            }}
          >
            {userTier === 'advisor'
              ? 'Current plan'
              : loading === advisor.planKey ? 'Redirecting…' : `Get Advisor ${interval === 'yearly' ? '(yearly)' : '(monthly)'}`}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--neg)', marginTop: 14 }}>{error}</p>
      )}
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-4)', marginTop: 14 }}>
        Powered by Stripe · Cancel anytime
      </p>
    </section>
  )
}
