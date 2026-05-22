'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { PRO_INTERVALS, ADVISOR_INTERVALS, type IntervalKey } from '@/lib/stripe'

// ── Theme toggle ─────────────────────────────────────────────────────────────

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('pi_theme') as 'dark' | 'light' | null
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('pi_theme', theme)
  }, [theme])

  return (
    <button
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      style={{
        width: 34, height: 34,
        borderRadius: 9,
        border: '1px solid var(--line-soft)',
        background: 'var(--bg-2)',
        color: 'var(--ink-3)',
        display: 'grid', placeItems: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      }}
    >
      {theme === 'dark' ? (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={12} cy={12} r={5} />
          <line x1={12} y1={1} x2={12} y2={3} />
          <line x1={12} y1={21} x2={12} y2={23} />
          <line x1={4.22} y1={4.22} x2={5.64} y2={5.64} />
          <line x1={18.36} y1={18.36} x2={19.78} y2={19.78} />
          <line x1={1} y1={12} x2={3} y2={12} />
          <line x1={21} y1={12} x2={23} y2={12} />
          <line x1={4.22} y1={19.78} x2={5.64} y2={18.36} />
          <line x1={18.36} y1={5.64} x2={19.78} y2={4.22} />
        </svg>
      ) : (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

// ── Animated frontier chart visual ──────────────────────────────────────────

export function HeroChart() {
  return (
    <div style={{
      maxWidth: 880, margin: '64px auto 0',
      padding: 24,
      background: 'oklch(from var(--bg-1) l c h / 0.50)',
      border: '1px solid var(--line-soft)',
      borderRadius: 'var(--radius-lg)',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 24px 80px -16px oklch(0 0 0 / 0.70), 0 0 60px oklch(0.68 0.18 258 / 0.10)',
      position: 'relative',
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, paddingBottom: 12,
        borderBottom: '1px solid var(--line-soft)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={dotPill('#FF5F57')} />
          <span style={dotPill('#FEBC2E')} />
          <span style={dotPill('#28C840')} />
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--ink-4)', letterSpacing: '0.08em',
        }}>
          quantfoli · efficient frontier
        </div>
        <div style={{ width: 60 }} />
      </div>

      <svg viewBox="0 0 800 320" style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stopColor="oklch(0.68 0.18 258)" />
            <stop offset="100%" stopColor="oklch(0.64 0.19 285)" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="oklch(0.68 0.18 258 / 0.30)" />
            <stop offset="100%" stopColor="oklch(0.68 0.18 258 / 0.00)" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0, 1, 2, 3, 4].map(i => (
          <line key={`h${i}`}
            x1="40" x2="780"
            y1={40 + i * 60} y2={40 + i * 60}
            stroke="oklch(0.260 0.013 255)" strokeWidth="0.6" strokeDasharray="2 4"
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <line key={`v${i}`}
            y1="40" y2="280"
            x1={40 + i * 124} x2={40 + i * 124}
            stroke="oklch(0.260 0.013 255)" strokeWidth="0.6" strokeDasharray="2 4"
          />
        ))}

        {/* Axis labels */}
        <text x="40"  y="305" fill="var(--ink-4)" fontSize="10" fontFamily="var(--font-mono)">Low risk</text>
        <text x="700" y="305" fill="var(--ink-4)" fontSize="10" fontFamily="var(--font-mono)">High risk</text>
        <text x="10"  y="50"  fill="var(--ink-4)" fontSize="10" fontFamily="var(--font-mono)" transform="rotate(-90, 10, 50)">Return</text>

        {/* Scattered Monte Carlo portfolios */}
        {SCATTER.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5}
            fill="oklch(0.570 0.014 255 / 0.5)"
            style={{ animation: `scatter-in 0.5s ${0.4 + i * 0.025}s cubic-bezier(0.22,1,0.36,1) both` }}
          />
        ))}

        {/* Frontier curve fill */}
        <path
          d={`${FRONTIER_PATH} L 780 280 L 40 280 Z`}
          fill="url(#fillGrad)"
          style={{ animation: 'fade-in 1.6s 1.4s both' }}
        />

        {/* Frontier curve */}
        <path
          d={FRONTIER_PATH}
          stroke="url(#curveGrad)" strokeWidth="2.5" fill="none"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="1200" strokeDashoffset="1200"
          style={{ animation: 'dash-draw 1.8s 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}
        />

        {/* "Your portfolio" star */}
        <g style={{ animation: 'fade-in 0.6s 2.2s both, star-pulse 3s 2.4s ease-in-out infinite' }}>
          <circle cx="430" cy="118" r="9" fill="oklch(0.82 0.156 162)" stroke="oklch(0.118 0.012 255)" strokeWidth="2.5" />
          <circle cx="430" cy="118" r="9" fill="none" stroke="oklch(0.82 0.156 162 / 0.4)" strokeWidth="1">
            <animate attributeName="r" from="9" to="20" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
        <g style={{ animation: 'fade-up 0.6s 2.5s both' }}>
          <rect x="448" y="98" width="118" height="40" rx="8"
            fill="oklch(from var(--bg-1) l c h / 0.95)"
            stroke="oklch(0.82 0.156 162 / 0.40)" strokeWidth="1"
          />
          <text x="458" y="115" fill="var(--ink)" fontSize="11" fontWeight="700" fontFamily="var(--font-display)">
            Your portfolio
          </text>
          <text x="458" y="130" fill="var(--ink-3)" fontSize="10" fontFamily="var(--font-mono)">
            σ 14.2% · μ 11.8%
          </text>
        </g>
      </svg>
    </div>
  )
}

// Pre-computed frontier curve (cubic curve, concave-down)
const FRONTIER_PATH =
  'M 60 240 ' +
  'C 140 230, 200 190, 280 160 ' +
  'S 440 100, 540 80 ' +
  'S 720 60, 770 55'

// Pre-computed scatter (deterministic, looks random)
const SCATTER = [
  { x: 100, y: 252 }, { x: 130, y: 245 }, { x: 170, y: 236 }, { x: 200, y: 228 },
  { x: 230, y: 215 }, { x: 260, y: 207 }, { x: 280, y: 198 }, { x: 310, y: 188 },
  { x: 340, y: 175 }, { x: 360, y: 168 }, { x: 380, y: 160 }, { x: 410, y: 148 },
  { x: 440, y: 138 }, { x: 470, y: 128 }, { x: 500, y: 118 }, { x: 530, y: 108 },
  { x: 560, y: 100 }, { x: 590, y: 92 },  { x: 620, y: 86 },  { x: 650, y: 82 },
  { x: 680, y: 78 },  { x: 710, y: 74 },  { x: 740, y: 72 },
  // noisier cloud above/below
  { x: 200, y: 250 }, { x: 280, y: 220 }, { x: 360, y: 195 }, { x: 440, y: 170 },
  { x: 520, y: 145 }, { x: 600, y: 125 }, { x: 680, y: 105 },
  { x: 150, y: 270 }, { x: 220, y: 260 }, { x: 290, y: 245 }, { x: 370, y: 220 },
  { x: 450, y: 195 }, { x: 530, y: 170 }, { x: 610, y: 150 }, { x: 690, y: 130 },
  { x: 175, y: 222 }, { x: 255, y: 192 }, { x: 335, y: 162 }, { x: 415, y: 135 },
  { x: 495, y: 110 }, { x: 575, y: 90 },  { x: 655, y: 76 },
]

function dotPill(color: string): React.CSSProperties {
  return {
    width: 11, height: 11, borderRadius: '50%',
    background: color,
    boxShadow: `0 0 4px ${color}`,
  }
}

// ── Mouse-tracking feature card ─────────────────────────────────────────────

export function FeatureCard({ title, desc, accent, delay = 0 }: {
  title: string; desc: string; accent: 'a' | 'b'; delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <Reveal delay={delay}>
      <div
        ref={ref}
        className="lp-feature-card"
        onMouseMove={onMove}
        style={{
          position: 'relative',
          padding: '28px 24px',
          background: 'oklch(from var(--bg-1) l c h / 0.80)',
          border: '1px solid var(--line-soft)',
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: accent === 'a'
            ? 'linear-gradient(90deg, transparent, oklch(0.68 0.18 258 / 0.70), transparent)'
            : 'linear-gradient(90deg, transparent, oklch(0.64 0.19 285 / 0.70), transparent)',
        }} />
        <div style={{
          position: 'relative', zIndex: 1,
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 17, letterSpacing: '-0.015em',
          color: 'var(--ink)', marginBottom: 10,
        }}>
          {title}
        </div>
        <div style={{ position: 'relative', zIndex: 1, fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-3)' }}>
          {desc}
        </div>
      </div>
    </Reveal>
  )
}

// ── Pricing cards with monthly/yearly toggle ────────────────────────────────

export function PricingCards() {
  const [interval, setInterval] = useState<IntervalKey>('yearly')
  const meta         = PRO_INTERVALS[interval]
  const advisorMeta  = ADVISOR_INTERVALS[interval]

  return (
    <>
      {/* Toggle */}
      <Reveal>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', padding: 5,
            background: 'oklch(from var(--bg-1) l c h / 0.70)',
            border: '1px solid var(--line-soft)',
            borderRadius: 999,
            backdropFilter: 'blur(10px)',
          }}>
            {(['monthly', 'yearly'] as const).map(iv => {
              const active = interval === iv
              const m = PRO_INTERVALS[iv]
              return (
                <button
                  key={iv}
                  type="button"
                  onClick={() => setInterval(iv)}
                  style={{
                    padding: '8px 20px', borderRadius: 999,
                    fontSize: 13, fontWeight: 600,
                    fontFamily: 'var(--font-ui)',
                    background: active ? 'var(--grad-brand)' : 'transparent',
                    color: active ? 'oklch(0.97 0 0)' : 'var(--ink-3)',
                    boxShadow: active ? '0 0 20px oklch(0.68 0.18 258 / 0.40)' : 'none',
                    transition: 'all 0.22s',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                  {m.savings && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 7px', borderRadius: 5,
                      background: active ? 'oklch(0.97 0 0 / 0.22)' : 'oklch(0.82 0.156 162 / 0.16)',
                      color: active ? 'oklch(0.97 0 0)' : 'oklch(0.82 0.156 162)',
                      letterSpacing: '0.05em',
                    }}>
                      Save 17%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </Reveal>

      <div style={{
        display: 'grid', gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      }}>
        {/* Free */}
        <Reveal>
          <div style={pricingCardBase()}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink-2)' }}>
              Free
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.025em' }}>CHF 0</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
              Forever free
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: 'oklch(0.82 0.156 162)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
              No credit card · No trial expiry
            </div>
            <ul style={featureList}>
              {[
                'Portfolio tracker & P&L',
                'EOD prices (Yahoo Finance)',
                'S&P 500 benchmark',
                'CSV + Swiss broker import',
                'Multi-currency display',
              ].map(f => <FeatureLi key={f}>{f}</FeatureLi>)}
            </ul>
            <Link href="/login?tab=signup" className="lp-ghost" style={{ ...ctaGhost, width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
              Start free
            </Link>
          </div>
        </Reveal>

        {/* Pro */}
        <Reveal delay={120}>
          <div className="lp-pro-card" style={{ ...pricingCardBase(true), borderRadius: 'var(--radius-lg)' }}>
            <div style={{
              position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--grad-brand)', color: 'oklch(0.97 0 0)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '4px 12px', borderRadius: 20,
              boxShadow: '0 0 16px oklch(0.68 0.18 258 / 0.55)',
              zIndex: 2,
            }}>
              Most Popular
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'oklch(0.80 0.15 258)' }}>
              Pro
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{
                fontSize: 40, fontWeight: 800, letterSpacing: '-0.025em',
                transition: 'opacity 0.2s', display: 'inline-block',
              }} key={meta.price}>
                {meta.price}
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>{meta.period}</span>
            </div>
            <div style={{
              marginTop: 6, fontSize: 12, height: 18,
              fontFamily: 'var(--font-mono)',
              color: meta.savings ? 'oklch(0.82 0.156 162)' : 'var(--ink-4)',
            }}>
              {meta.savings ?? 'Billed monthly'}
            </div>
            <ul style={featureList}>
              {[
                'Everything in Free',
                'Sharpe · Sortino · Beta · Alpha',
                'Efficient Frontier (Markowitz MPT)',
                'Historical Stress Testing',
                'Risk Tab — VaR, CVaR, correlation matrix',
                'Rolling volatility regime',
              ].map(f => <FeatureLi key={f}>{f}</FeatureLi>)}
            </ul>
            <Link href="/login?tab=signup&plan=pro" className="lp-cta" style={{ ...ctaPrimary, width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
              Get Pro {interval === 'yearly' ? '(yearly)' : '(monthly)'}
            </Link>
          </div>
        </Reveal>

        {/* Advisor */}
        <Reveal delay={240}>
          <div className="lp-pro-card" style={{ ...pricingCardBase(true), borderRadius: 'var(--radius-lg)', borderColor: 'oklch(0.78 0.16 305 / 0.35)' }}>
            <div style={{
              position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(90deg, oklch(0.78 0.16 305), oklch(0.72 0.18 320))',
              color: 'oklch(0.97 0 0)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '4px 12px', borderRadius: 20,
              boxShadow: '0 0 16px oklch(0.78 0.16 305 / 0.55)',
              zIndex: 2,
            }}>
              Premium
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'oklch(0.82 0.15 305)' }}>
              Advisor
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{
                fontSize: 40, fontWeight: 800, letterSpacing: '-0.025em',
                transition: 'opacity 0.2s', display: 'inline-block',
              }} key={advisorMeta.price}>
                {advisorMeta.price}
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>{advisorMeta.period}</span>
            </div>
            <div style={{
              marginTop: 6, fontSize: 12, height: 18,
              fontFamily: 'var(--font-mono)',
              color: advisorMeta.savings ? 'oklch(0.82 0.156 162)' : 'var(--ink-4)',
            }}>
              {advisorMeta.savings ?? 'Billed monthly'}
            </div>
            <ul style={featureList}>
              {[
                'Everything in Pro',
                'Monthly quantitative portfolio report',
                'Model-optimal weights (Markowitz, historical covariance)',
                'Factor exposure breakdown (Fama-French)',
                'Quarterly weight-drift analysis',
                'Priority support · 24h response',
              ].map(f => <FeatureLi key={f}>{f}</FeatureLi>)}
            </ul>
            <Link href="/login?tab=signup&plan=advisor" className="lp-cta" style={{
              ...ctaPrimary, width: '100%', justifyContent: 'center', marginTop: 'auto',
              background: 'linear-gradient(135deg, oklch(0.78 0.16 305), oklch(0.72 0.18 320))',
              boxShadow: '0 0 32px oklch(0.78 0.16 305 / 0.45), 0 6px 20px oklch(0 0 0 / 0.30)',
            }}>
              Get Advisor {interval === 'yearly' ? '(yearly)' : '(monthly)'}
            </Link>
          </div>
        </Reveal>
      </div>
    </>
  )
}

const ctaPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '13px 22px', fontFamily: 'var(--font-ui)',
  fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
  background: 'var(--grad-brand)',
  color: 'oklch(0.97 0 0)',
  border: 'none', borderRadius: 11, textDecoration: 'none',
  boxShadow: '0 0 32px oklch(0.68 0.18 258 / 0.45), 0 6px 20px oklch(0 0 0 / 0.30)',
  transition: 'transform 0.18s, box-shadow 0.18s',
  cursor: 'pointer',
}

const ctaGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '13px 22px', fontFamily: 'var(--font-ui)',
  fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
  background: 'oklch(from var(--bg-2) l c h / 0.60)',
  color: 'var(--ink-2)',
  border: '1px solid var(--line)', borderRadius: 11,
  textDecoration: 'none',
  backdropFilter: 'blur(8px)',
  transition: 'background 0.18s, border-color 0.18s, transform 0.18s',
  cursor: 'pointer',
}

const featureList: React.CSSProperties = {
  listStyle: 'none', padding: 0, margin: '20px 0 24px',
  display: 'flex', flexDirection: 'column', gap: 9,
  flex: 1,
}

function pricingCardBase(highlighted = false): React.CSSProperties {
  return {
    position: 'relative',
    display: 'flex', flexDirection: 'column',
    padding: '32px 28px', height: '100%',
    background: highlighted
      ? 'oklch(from var(--bg-1) l c h / 0.92)'
      : 'oklch(from var(--bg-1) l c h / 0.65)',
    border: '1.5px solid var(--line-soft)',
    borderRadius: 'var(--radius-lg)',
    backdropFilter: 'blur(12px)',
    boxShadow: highlighted ? '0 0 56px oklch(0.68 0.18 258 / 0.18)' : 'none',
  }
}

function FeatureLi({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
      <span style={{ color: 'oklch(0.82 0.156 162)', marginTop: 2, flexShrink: 0 }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
      {children}
    </li>
  )
}

// ── Scroll-triggered reveal wrapper ─────────────────────────────────────────

export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`lp-reveal ${shown ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
