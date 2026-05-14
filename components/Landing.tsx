import Link from 'next/link'
import { HeroChart, FeatureCard, Reveal, PricingCards } from './LandingClient'

const FEATURES = [
  {
    title: 'Markowitz Efficient Frontier',
    desc: 'See the optimal risk/return curve for your actual holdings. 5,000-portfolio Monte Carlo with per-asset weight caps.',
    accent: 'a' as const,
  },
  {
    title: 'Historical Stress Testing',
    desc: 'Simulate dot-com, 2008, COVID and 2022 drawdowns against your live positions. Know what you actually own.',
    accent: 'b' as const,
  },
  {
    title: 'Sharpe · Sortino · Beta · Alpha',
    desc: 'Annualised risk-adjusted returns, downside deviation, and regression-based market sensitivity vs. S&P 500.',
    accent: 'a' as const,
  },
  {
    title: 'Swiss Broker CSV Import',
    desc: 'One-click import for ZKB, Yuh and Neon. FX-aware to ±0.2% versus your bank statement.',
    accent: 'b' as const,
  },
  {
    title: 'Multi-Currency · FX-Aware',
    desc: 'Display in CHF, USD, EUR, GBP, JPY, CAD or SGD. Returns normalised by historical purchase-day exchange rates.',
    accent: 'a' as const,
  },
  {
    title: 'Risk Tab',
    desc: 'Correlation matrix, rolling volatility regime, VaR and CVaR. Built for investors who want signal, not narrative.',
    accent: 'b' as const,
  },
]

const STATS = [
  { value: '6+',     label: 'Risk metrics' },
  { value: '3',      label: 'Swiss brokers' },
  { value: '7',      label: 'Currencies' },
  { value: '±0.2%',  label: 'FX accuracy' },
]

export default function Landing() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient background — floating blobs + dot grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="lp-blob" style={{
          position: 'absolute', top: '-15%', left: '-10%', width: '55%', height: '60%',
          background: 'radial-gradient(ellipse, oklch(0.68 0.18 258 / 0.20) 0%, transparent 65%)',
          borderRadius: '50%', filter: 'blur(20px)',
        }} />
        <div className="lp-blob--b" style={{
          position: 'absolute', top: '20%', right: '-10%', width: '50%', height: '55%',
          background: 'radial-gradient(ellipse, oklch(0.64 0.19 285 / 0.18) 0%, transparent 65%)',
          borderRadius: '50%', filter: 'blur(20px)',
        }} />
        <div className="lp-blob--c" style={{
          position: 'absolute', bottom: '-10%', left: '15%', width: '60%', height: '50%',
          background: 'radial-gradient(ellipse, oklch(0.82 0.156 162 / 0.08) 0%, transparent 65%)',
          borderRadius: '50%', filter: 'blur(20px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 0.025) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }} />
      </div>

      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(20px)',
        background: 'oklch(from var(--bg) l c h / 0.65)',
        borderBottom: '1px solid var(--line-soft)',
      }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--grad-brand)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
              color: 'oklch(0.97 0 0)', letterSpacing: '-0.03em',
              boxShadow: '0 0 20px oklch(0.68 0.18 258 / 0.45)',
            }}>Q</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Quantfoli
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="#features" style={navLink}>Features</a>
            <a href="#pricing"  style={navLink}>Pricing</a>
            <Link href="/login" className="lp-cta" style={{
              ...navLink,
              padding: '8px 16px', borderRadius: 9,
              background: 'var(--grad-brand)',
              color: 'oklch(0.97 0 0)', fontWeight: 600,
              boxShadow: '0 0 24px oklch(0.68 0.18 258 / 0.32), 0 2px 8px oklch(0 0 0 / 0.20)',
            }}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px 56px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', animation: 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 14px', marginBottom: 32,
            borderRadius: 100,
            background: 'oklch(0.68 0.18 258 / 0.08)',
            border: '1px solid oklch(0.68 0.18 258 / 0.22)',
            fontSize: 12, fontFamily: 'var(--font-mono)',
            color: 'oklch(0.80 0.14 258)',
          }}>
            <span className="lp-status-dot" />
            Built in Switzerland · for self-directed investors
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(42px, 6.5vw, 78px)',
            fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.02,
            margin: 0, color: 'var(--ink)',
          }}>
            Institutional-grade<br />
            portfolio analytics.{' '}
            <span className="lp-grad-text">Retail price.</span>
          </h1>

          <p style={{
            marginTop: 28, fontSize: 'clamp(15px, 1.8vw, 19px)',
            lineHeight: 1.6, color: 'var(--ink-2)',
            maxWidth: 640, margin: '28px auto 0',
          }}>
            Markowitz frontier, stress tests, Sharpe, Sortino, Beta, Alpha — on top of your
            real ZKB, Yuh or Neon portfolio. FX-aware to ±0.2%. From CHF&nbsp;0.
          </p>

          <div style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="lp-cta" style={ctaPrimary}>
              Start free
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#features" className="lp-ghost" style={ctaGhost}>
              See features
            </a>
          </div>

          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
            Free tier · No credit card · Cancel Pro anytime
          </div>
        </div>

        {/* Hero visual */}
        <HeroChart />

        {/* Stats strip */}
        <Reveal>
          <div style={{
            maxWidth: 880, margin: '56px auto 0',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1,
            background: 'var(--line-soft)',
            border: '1px solid var(--line-soft)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            {STATS.map(s => (
              <div key={s.label} style={{
                background: 'oklch(from var(--bg-1) l c h / 0.85)',
                padding: '26px 16px', textAlign: 'center',
                backdropFilter: 'blur(8px)',
              }}>
                <div className="lp-grad-text" style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32,
                  letterSpacing: '-0.025em',
                }}>
                  {s.value}
                </div>
                <div style={{
                  marginTop: 4, fontSize: 11, color: 'var(--ink-4)',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.10em', textTransform: 'uppercase',
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '96px 24px 72px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={sectionEyebrow}>What you get</div>
              <h2 style={sectionTitle}>The toolkit your bank never built.</h2>
              <p style={sectionSub}>
                Six modules that actually move the needle on portfolio decisions — not vanity charts.
              </p>
            </div>
          </Reveal>

          <div style={{
            display: 'grid', gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}>
            {FEATURES.map((f, i) => (
              <FeatureCard
                key={f.title}
                title={f.title}
                desc={f.desc}
                accent={f.accent}
                delay={i * 60}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ position: 'relative', zIndex: 1, padding: '72px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={sectionEyebrow}>How it works</div>
              <h2 style={sectionTitle}>Sixty seconds to your first frontier.</h2>
            </div>
          </Reveal>
          <div style={{
            display: 'grid', gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}>
            {[
              { n: '01', t: 'Create an account', d: 'Email and password. No credit card.' },
              { n: '02', t: 'Import or add positions', d: 'ZKB · Yuh · Neon CSV, or add manually by ticker.' },
              { n: '03', t: 'See the math', d: 'Sharpe, frontier, stress test — instantly, on your actual book.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div style={{
                  padding: '26px 22px', height: '100%',
                  background: 'oklch(from var(--bg-1) l c h / 0.60)',
                  border: '1px solid var(--line-soft)',
                  borderRadius: 'var(--radius)',
                  backdropFilter: 'blur(8px)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 14, right: 18,
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 56, lineHeight: 1, letterSpacing: '-0.04em',
                    color: 'oklch(0.68 0.18 258 / 0.10)',
                  }}>{s.n}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    letterSpacing: '0.12em',
                    color: 'oklch(0.78 0.15 258)',
                    marginBottom: 16,
                  }}>STEP {s.n}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 8, position: 'relative' }}>
                    {s.t}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, position: 'relative' }}>
                    {s.d}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '72px 24px 96px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={sectionEyebrow}>Pricing</div>
              <h2 style={sectionTitle}>Simple. Honest. No fake tiers.</h2>
            </div>
          </Reveal>

          <PricingCards />

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-4)', marginTop: 28, fontFamily: 'var(--font-mono)' }}>
            Cancel anytime from your Stripe customer portal · No refunds on partial periods
          </p>
        </div>
      </section>

      {/* Founder note */}
      <section style={{ position: 'relative', zIndex: 1, padding: '64px 24px' }}>
        <Reveal>
          <div style={{
            maxWidth: 720, margin: '0 auto',
            padding: '44px 36px',
            background: 'oklch(from var(--bg-1) l c h / 0.75)',
            border: '1px solid var(--line-soft)',
            borderRadius: 'var(--radius-lg)',
            backdropFilter: 'blur(14px)',
            textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -1, left: '20%', right: '20%', height: 2,
              background: 'linear-gradient(90deg, transparent, oklch(0.68 0.18 258 / 0.50), transparent)',
            }} />
            <div style={sectionEyebrow}>Why this exists</div>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px, 2.4vw, 26px)',
              lineHeight: 1.45, letterSpacing: '-0.018em',
              color: 'var(--ink)', margin: '8px 0 24px',
              fontWeight: 500,
            }}>
              &ldquo;Swiss banks give you a static PDF and call it reporting.
              I wanted Bloomberg-style analytics on my own portfolio —
              so I built one.&rdquo;
            </p>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              Dariush Tahajomi · HSG St. Gallen &rsquo;27
            </div>
          </div>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '72px 24px 104px' }}>
        <Reveal>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05,
              margin: 0,
            }}>
              Stop guessing.<br />
              <span className="lp-grad-text">Start measuring.</span>
            </h2>
            <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login" className="lp-cta" style={ctaPrimary}>
                Create your account
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

// ── inline style helpers ────────────────────────────────────────────────────

const navLink: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: 'var(--ink-2)',
  textDecoration: 'none', padding: '8px 12px', borderRadius: 8,
  transition: 'color 0.15s, background 0.15s',
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

const sectionEyebrow: React.CSSProperties = {
  fontSize: 11, fontFamily: 'var(--font-mono)',
  letterSpacing: '0.16em', textTransform: 'uppercase',
  color: 'oklch(0.78 0.15 258)', marginBottom: 16,
  fontWeight: 600,
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(30px, 4.2vw, 48px)',
  fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1,
  margin: 0, color: 'var(--ink)',
}

const sectionSub: React.CSSProperties = {
  marginTop: 18, fontSize: 15, lineHeight: 1.6,
  color: 'var(--ink-3)', maxWidth: 580, margin: '18px auto 0',
}

