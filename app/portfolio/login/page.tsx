'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

interface TurnstileApi {
  render: (el: HTMLElement, opts: {
    sitekey: string
    callback?: (token: string) => void
    'expired-callback'?: () => void
    'error-callback'?: () => void
    theme?: 'light' | 'dark' | 'auto'
    appearance?: 'always' | 'execute' | 'interaction-only'
  }) => string
  reset: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

function LoginPageInner() {
  const searchParams = useSearchParams()
  const initialTab: 'signin' | 'signup' =
    searchParams.get('tab') === 'signup' ? 'signup' : 'signin'
  const [tab, setTab]         = useState<'signin' | 'signup'>(initialTab)
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [message, setMessage] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReady, setTurnstileReady] = useState(false)
  const turnstileContainer = useRef<HTMLDivElement | null>(null)
  const turnstileWidgetId  = useRef<string | null>(null)
  const router   = useRouter()
  const supabase = createBrowserSupabase()

  // Render Turnstile when on the signup tab + site key configured + script loaded.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    if (tab !== 'signup') return
    if (!turnstileReady) return
    if (!turnstileContainer.current) return
    if (turnstileWidgetId.current) return
    if (!window.turnstile) return

    turnstileWidgetId.current = window.turnstile.render(turnstileContainer.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(null),
      'error-callback':   () => setTurnstileToken(null),
      theme: 'dark',
      appearance: 'interaction-only',
    })
  }, [tab, turnstileReady])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setMessage('')
    if (tab === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else { router.push('/portfolio'); router.refresh() }
    } else {
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        setError('Please complete the verification challenge.')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/portfolio`,
          data: { full_name: name.trim() },
        },
      })
      if (error) {
        setError(error.message)
        if (window.turnstile && turnstileWidgetId.current) {
          window.turnstile.reset(turnstileWidgetId.current)
          setTurnstileToken(null)
        }
      } else {
        setMessage('Check your email to confirm, then sign in.')
        // Fire-and-forget welcome email — non-blocking, failure doesn't affect signup UX
        fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: name.trim(), turnstileToken }),
        }).catch(() => { /* swallow — signup already succeeded */ })
      }
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px',
      background: 'var(--bg)',
      position: 'relative', overflow: 'hidden',
    }}>
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileReady(true)}
        />
      )}
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, oklch(0.68 0.18 258 / 0.10) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(ellipse, oklch(0.82 0.156 162 / 0.07) 0%, transparent 65%)', borderRadius: '50%' }} />
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 0.025) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1, animation: 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
        {/* Back to landing */}
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--ink-3)',
            textDecoration: 'none', marginBottom: 20,
            transition: 'color 0.15s, transform 0.15s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.color = 'var(--brand-b)'
            e.currentTarget.style.transform = 'translateX(-2px)'
          }}
          onMouseOut={e => {
            e.currentTarget.style.color = 'var(--ink-3)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          ← Back to Quantfoli
        </Link>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'linear-gradient(135deg, oklch(0.68 0.18 258), oklch(0.64 0.19 285))',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'oklch(0.97 0 0)',
            letterSpacing: '-0.03em',
            boxShadow: '0 0 32px oklch(0.68 0.18 258 / 0.45), 0 4px 16px oklch(0 0 0 / 0.35)',
          }}>Q</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Quantfoli
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 2, letterSpacing: '0.04em' }}>
              Quant-grade portfolio analytics
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'oklch(from var(--bg-1) l c h / 0.90)',
          border: '1px solid oklch(from var(--line) l c h / 0.80)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-hi), 0 1px 0 oklch(1 0 0 / 0.06) inset',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', padding: '6px 6px 0', gap: 2, borderBottom: '1px solid var(--line-soft)' }}>
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(''); setMessage('') }}
                style={{
                  flex: 1, padding: '10px 14px 12px',
                  fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                  color: tab === t ? 'var(--ink)' : 'var(--ink-3)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  position: 'relative', borderRadius: '8px 8px 0 0',
                  transition: 'color 0.15s',
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
                {tab === t && (
                  <span style={{
                    position: 'absolute', left: '20%', right: '20%', bottom: -1, height: 2,
                    background: 'linear-gradient(90deg, oklch(0.68 0.18 258), oklch(0.64 0.19 285))',
                    borderRadius: 2,
                    boxShadow: '0 0 8px oklch(0.68 0.18 258 / 0.5)',
                    animation: 'tab-underline 0.22s cubic-bezier(0.22,1,0.36,1) both',
                    display: 'block',
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'signup' && (
              <div>
                <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-4)', display: 'block', marginBottom: 7 }}>
                  Name
                </label>
                <input
                  className="fin-input"
                  type="text"
                  placeholder="Max Muster"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required disabled={loading}
                  maxLength={120}
                  autoComplete="name"
                  autoFocus
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-4)', display: 'block', marginBottom: 7 }}>
                Email
              </label>
              <input
                className="fin-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required disabled={loading}
                autoComplete="email"
                autoFocus={tab === 'signin'}
              />
            </div>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-4)', display: 'block', marginBottom: 7 }}>
                Password
              </label>
              <input
                className="fin-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required minLength={6} disabled={loading}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {tab === 'signup' && TURNSTILE_SITE_KEY && (
              <div
                ref={turnstileContainer}
                style={{ minHeight: 65, display: 'flex', justifyContent: 'center' }}
              />
            )}

            {error && (
              <div style={{ fontSize: 12, color: 'var(--neg)', padding: '8px 12px', background: 'var(--neg-soft)', border: '1px solid var(--neg-line)', borderRadius: 8 }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ fontSize: 12, color: 'var(--pos)', padding: '8px 12px', background: 'var(--pos-soft)', border: '1px solid var(--pos-line)', borderRadius: 8 }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px 16px', marginTop: 4,
                fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em',
                background: loading ? 'var(--bg-3)' : 'linear-gradient(135deg, oklch(0.68 0.18 258), oklch(0.64 0.19 285))',
                color: 'oklch(0.97 0 0)',
                border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 24px oklch(0.68 0.18 258 / 0.35), 0 4px 16px oklch(0 0 0 / 0.25)',
                transition: 'transform 0.12s, box-shadow 0.15s, opacity 0.15s',
                opacity: loading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget.style.transform = 'translateY(-1.5px)') }}
              onMouseLeave={e => { (e.currentTarget.style.transform = '') }}
            >
              {loading ? <span className="spinner" style={{ borderTopColor: 'oklch(0.97 0 0)' }} /> : (
                tab === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>

            {/* Prose switch link — recovers users who landed on the wrong tab */}
            <div style={{
              textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)',
              marginTop: 6,
            }}>
              {tab === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('signup'); setError(''); setMessage('') }}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: 'oklch(0.80 0.14 258)', fontWeight: 600, cursor: 'pointer',
                      textDecoration: 'underline', textUnderlineOffset: 3,
                      fontSize: 'inherit', fontFamily: 'inherit',
                    }}
                  >
                    Create one →
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setTab('signin'); setError(''); setMessage('') }}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: 'oklch(0.80 0.14 258)', fontWeight: 600, cursor: 'pointer',
                      textDecoration: 'underline', textUnderlineOffset: 3,
                      fontSize: 'inherit', fontFamily: 'inherit',
                    }}
                  >
                    Sign in →
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-4)', marginTop: 20, fontFamily: 'var(--font-mono)' }}>
          Quantfoli · Dariush Tahajomi · HSG &#39;27
        </p>
      </div>
    </div>
  )
}

// useSearchParams() requires a Suspense boundary in Next 14 App Router builds.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}
