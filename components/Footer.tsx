import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer
      style={{
        borderTop: '1px solid var(--line-soft)',
        padding: '20px 24px',
        fontSize: 12,
        color: 'var(--ink-4)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <span>© {year} Quantfoli</span>
      <span style={{ opacity: 0.4 }}>·</span>
      <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
      <span style={{ opacity: 0.4 }}>·</span>
      <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
      <span style={{ opacity: 0.4 }}>·</span>
      <Link href="/advisor-legal" style={{ color: 'inherit', textDecoration: 'none' }}>Advisor Terms</Link>
      <span style={{ opacity: 0.4 }}>·</span>
      <Link href="/support" style={{ color: 'inherit', textDecoration: 'none' }}>Support</Link>
      <span style={{ opacity: 0.4 }}>·</span>
      <span style={{ fontStyle: 'italic' }}>Not investment advice</span>
    </footer>
  )
}
