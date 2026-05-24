import type { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/LandingClient'

// Unified Quantfoli host landing — introduces both products (/portfolio + /learn).
// Hero copy is placeholder; Dariush + Hugo will refine.
// All FIDLEG-sensitive strings reviewed by @agent-fidleg-reviewer (2026-05-24).

export const metadata: Metadata = {
  title: 'Quantfoli — Portfolio Analytics & Finance Education',
  description:
    'Professional-grade portfolio analytics for the next generation. FX-corrected analytics on your ZKB depot, plus free structured finance courses.',
  alternates: { canonical: 'https://quantfoli.com' },
  openGraph: {
    type: 'website',
    siteName: 'Quantfoli',
    title: 'Quantfoli — Portfolio Analytics & Finance Education',
    description:
      'Professional-grade portfolio analytics for the next generation. FX-corrected analytics on your ZKB depot, plus free structured finance courses.',
    url: 'https://quantfoli.com',
    locale: 'en_CH',
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Quantfoli',
  url: 'https://quantfoli.com',
  logo: 'https://quantfoli.com/icon.svg',
  founder: [
    { '@type': 'Person', name: 'Dariush Tahajomi', url: 'https://www.linkedin.com/in/dariush-tahajomi-09348b370/' },
  ],
}

export default function UnifiedLanding() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--ink)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />

      {/* Ambient backdrop */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, var(--accent-pro-soft) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '55%', height: '55%', background: 'radial-gradient(ellipse, var(--accent-learn-soft) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, var(--lp-dot) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* Header */}
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
            <Link href="/portfolio" style={navLink}>Portfolio</Link>
            <Link href="/learn" style={navLink}>Learn</Link>
            <ThemeToggle />
            <Link href="/portfolio/login" style={{
              ...navLink, padding: '8px 16px', borderRadius: 9,
              background: 'var(--grad-brand)', color: 'oklch(0.97 0 0)', fontWeight: 600,
              boxShadow: '0 0 24px oklch(0.68 0.18 258 / 0.32), 0 2px 8px oklch(0 0 0 / 0.20)',
            }}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, padding: '120px 24px 64px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 14px', marginBottom: 32,
            borderRadius: 100,
            background: 'oklch(0.68 0.18 258 / 0.08)',
            border: '1px solid oklch(0.68 0.18 258 / 0.22)',
            fontSize: 12, fontFamily: 'var(--font-mono)',
            color: 'oklch(0.80 0.14 258)',
          }}>
            Built in Switzerland
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.04,
            margin: 0, color: 'var(--ink)',
          }}>
            Finance, built for the<br />
            <span className="lp-grad-text">next generation.</span>
          </h1>

          <p style={{
            marginTop: 26, fontSize: 'clamp(15px, 1.7vw, 19px)',
            lineHeight: 1.6, color: 'var(--ink-2)',
            maxWidth: 640, margin: '26px auto 0',
          }}>
            Two products. One mission: make professional-grade finance tools accessible.
          </p>
        </div>
      </section>

      {/* Product cards */}
      <section style={{ position: 'relative', zIndex: 1, padding: '24px 24px 96px' }}>
        <div style={{
          maxWidth: 1080, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {/* Portfolio Analytics card */}
          <ProductCard
            accent="var(--accent-pro)"
            accentSoft="var(--accent-pro-soft)"
            kicker="Portfolio Analytics"
            tagline="The tool your quant friend uses."
            bullets={[
              'Markowitz frontier, Sharpe, stress tests',
              'FX-adjusted (historical accuracy ±0.2% on ZKB depot sample data)',
              'Free tier. Pro from CHF 15/mo.',
            ]}
            ctaLabel="Open Portfolio Tool"
            ctaHref="/portfolio"
          />

          {/* Analysts Lens card */}
          <ProductCard
            accent="var(--accent-learn)"
            accentSoft="var(--accent-learn-soft)"
            kicker="Analysts Lens"
            tagline="Learn finance like an analyst. For free."
            bullets={[
              'Structured courses in finance fundamentals and valuation frameworks',
              'Built by students, for students',
              'Free forever',
            ]}
            ctaLabel="Start Learning"
            ctaHref="/learn"
          />
        </div>
      </section>

      {/* How the two products fit together */}
      <section style={{ position: 'relative', zIndex: 1, padding: '64px 24px 96px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-block', padding: '4px 12px', marginBottom: 16,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.10em', textTransform: 'uppercase',
              color: 'var(--ink-3)',
              border: '1px solid var(--line-soft)', borderRadius: 100,
            }}>
              One pipeline
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.03em',
              lineHeight: 1.1, margin: 0, color: 'var(--ink)',
            }}>
              Learn the theory.<br />
              <span className="lp-grad-text">Apply it on your own portfolio.</span>
            </h2>
            <p style={{
              marginTop: 18, fontSize: 'clamp(14px, 1.5vw, 17px)',
              lineHeight: 1.6, color: 'var(--ink-2)',
              maxWidth: 620, margin: '18px auto 0',
            }}>
              Analysts Lens teaches the frameworks institutional analysts use to evaluate companies and portfolios. Portfolio Analytics lets investors apply those same frameworks to their own positions, on real Swiss broker data.
            </p>
          </div>

          {/* Pipeline steps */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}>
            <PipelineStep
              step="01"
              accent="var(--accent-learn)"
              title="Learn"
              body="Structured courses in finance fundamentals, ratio analysis, and valuation frameworks. Built and reviewed by students preparing for analyst roles."
              tag="Analysts Lens · Free"
            />
            <PipelineStep
              step="02"
              accent="var(--ink-3)"
              title="Import"
              body="Connect by uploading a CSV export from ZKB, Yuh, or Neon. Positions are normalised, FX-converted to CHF, and matched against historical Yahoo Finance data."
              tag="Portfolio Analytics · Free"
            />
            <PipelineStep
              step="03"
              accent="var(--accent-pro)"
              title="Measure"
              body="Apply the frameworks: Sharpe, Sortino, beta, alpha, efficient frontier, historical stress tests. Optimisation runs in CHF, net of Swiss broker costs."
              tag="Portfolio Analytics · Pro"
            />
          </div>

          <p style={{
            marginTop: 40, textAlign: 'center', fontSize: 12,
            color: 'var(--ink-4)', fontFamily: 'var(--font-mono)',
          }}>
            Both products run on the same Swiss-first principles: transparent methodology, FIDLEG-compliant copy, no advisory language.
          </p>
        </div>
      </section>

      {/* Attribution + founders */}
      <section style={{ position: 'relative', zIndex: 1, padding: '24px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <FounderBadge initials="DT" accent="var(--accent-pro)" name="Dariush Tahajomi" role="Quantfoli" linkedin="https://www.linkedin.com/in/dariush-tahajomi-09348b370/" />
          <FounderBadge initials="HT" accent="var(--accent-learn)" name="Hugo Tautorat" role="Analysts Lens" />
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, fontFamily: 'var(--font-mono)' }}>
          Built in Switzerland.
        </p>
        <p style={{ marginTop: 22, fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
          Not investment advice. Past accuracy does not guarantee future precision.
        </p>
      </section>
    </main>
  )
}

function PipelineStep({ step, accent, title, body, tag }: {
  step: string
  accent: string
  title: string
  body: string
  tag: string
}) {
  return (
    <div style={{
      padding: 24,
      background: 'oklch(from var(--bg-1) l c h / 0.65)',
      border: '1px solid var(--line-soft)',
      borderRadius: 'var(--radius)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.08em', color: accent,
        }}>
          {step}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--ink-4)',
        }}>
          {tag}
        </span>
      </div>
      <h3 style={{
        margin: 0,
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
        letterSpacing: '-0.02em', color: 'var(--ink)',
      }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        {body}
      </p>
    </div>
  )
}

function FounderBadge({ initials, accent, name, role, linkedin }: {
  initials: string
  accent: string
  name: string
  role: string
  linkedin?: string
}) {
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: accent, color: 'oklch(0.99 0 0)',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
        letterSpacing: '-0.02em',
      }}>
        {initials}
      </div>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', lineHeight: 1.2 }}>{name}</div>
        <div style={{ fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{role}</div>
      </div>
    </div>
  )
  return linkedin
    ? <a href={linkedin} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{inner}</a>
    : inner
}

function ProductCard({
  accent, accentSoft, kicker, tagline, bullets, ctaLabel, ctaHref, footnote,
}: {
  accent: string
  accentSoft: string
  kicker: string
  tagline: string
  bullets: string[]
  ctaLabel: string
  ctaHref: string
  footnote?: string
}) {
  return (
    <div style={{
      position: 'relative',
      padding: 32,
      background: 'oklch(from var(--bg-1) l c h / 0.85)',
      border: `1px solid ${accentSoft}`,
      borderRadius: 'var(--radius-lg)',
      backdropFilter: 'blur(20px)',
      boxShadow: 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column', gap: 18,
      minHeight: 360,
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: '0.10em', textTransform: 'uppercase',
          color: accent,
        }}>
          {kicker}
        </div>
        <h2 style={{
          marginTop: 10, marginBottom: 0,
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 26, letterSpacing: '-0.02em', color: 'var(--ink)',
        }}>
          {tagline}
        </h2>
      </div>

      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <span aria-hidden style={{ flexShrink: 0, marginTop: 7, width: 5, height: 5, borderRadius: '50%', background: accent }} />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        style={{
          marginTop: 'auto',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 22px',
          fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
          background: accent, color: 'oklch(0.99 0 0)',
          border: 'none', borderRadius: 10,
          textDecoration: 'none',
          boxShadow: `0 0 24px ${accent.replace('var(--', 'oklch(0.68 0.18 258 / 0.32))').includes('var(') ? 'oklch(0 0 0 / 0.18)' : 'oklch(0 0 0 / 0.18)'}`,
        }}
      >
        {ctaLabel}
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </Link>

      {footnote && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
          {footnote}
        </p>
      )}
    </div>
  )
}

const navLink: React.CSSProperties = {
  fontSize: 13, fontWeight: 500,
  color: 'var(--ink-2)',
  padding: '8px 12px',
  textDecoration: 'none',
  borderRadius: 8,
  transition: 'color 0.15s, background 0.15s',
}
