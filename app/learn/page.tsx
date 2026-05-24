import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Analysts Lens — Coming Soon · Quantfoli',
  description: 'Structured courses in finance fundamentals and valuation frameworks. Built by students, for students. Free forever.',
  alternates: { canonical: 'https://quantfoli.com/learn' },
  robots: { index: false, follow: true },
}

export default function LearnPlaceholder() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '64px 24px',
    }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', padding: '4px 12px', marginBottom: 24,
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase',
          color: 'var(--accent-learn)',
          border: '1px solid var(--accent-learn-soft)', borderRadius: 100,
        }}>
          Coming soon
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: '-0.03em', lineHeight: 1.05,
          margin: 0,
        }}>
          Analysts Lens
        </h1>
        <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          Structured courses in finance fundamentals and valuation frameworks. Built by students, for students. Free forever.
        </p>
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-3)' }}>
          Hugo is building this. Check back soon.
        </p>
        <Link
          href="/"
          style={{
            marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none',
          }}
        >
          ← Back to Quantfoli
        </Link>
      </div>
    </main>
  )
}
