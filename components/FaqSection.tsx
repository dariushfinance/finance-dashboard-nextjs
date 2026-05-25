import type { FaqItem } from '@/lib/schema'

// Visible FAQ block. Pairs with FAQPage JSON-LD on the same page — answer
// engines (ChatGPT, Perplexity, Google AI Overviews) extract on-page text,
// so the questions are rendered as real content, not schema-only.
export default function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section style={{ position: 'relative', zIndex: 1, padding: '72px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.03em',
          textAlign: 'center', margin: '0 0 40px', color: 'var(--ink)',
        }}>
          Frequently asked
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(({ q, a }) => (
            <details
              key={q}
              style={{
                borderBottom: '1px solid var(--line-soft)',
                padding: '18px 4px',
              }}
            >
              <summary style={{
                fontFamily: 'var(--font-display)', fontWeight: 600,
                fontSize: 17, letterSpacing: '-0.01em', color: 'var(--ink)',
                cursor: 'pointer', listStyle: 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
              }}>
                {q}
                <span aria-hidden style={{ color: 'var(--ink-4)', fontSize: 20, lineHeight: 1, flexShrink: 0 }}>+</span>
              </summary>
              <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
