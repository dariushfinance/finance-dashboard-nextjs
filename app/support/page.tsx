'use client'

import { useState } from 'react'

export default function SupportPage() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to send. Please email dtahajomi2007@gmail.com directly.')
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 100px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px', background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 32, letterSpacing: '-0.02em',
            color: 'var(--ink)', margin: 0,
          }}>
            Support
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 10, lineHeight: 1.6 }}>
            Have a question, bug report, or feedback? Send us a message and we&apos;ll get back to you within 48 hours.
          </p>
        </div>

        <div style={{
          background: 'oklch(from var(--bg-1) l c h / 0.90)',
          border: '1px solid oklch(from var(--line) l c h / 0.80)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-hi)',
          backdropFilter: 'blur(20px)',
          padding: 28,
        }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                Message sent
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                Thanks {name || 'there'} — we&apos;ll reply to {email} as soon as possible.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-4)', display: 'block', marginBottom: 7 }}>
                  Name
                </label>
                <input
                  className="fin-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required disabled={loading}
                  maxLength={120}
                />
              </div>
              <div>
                <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-4)', display: 'block', marginBottom: 7 }}>
                  Email
                </label>
                <input
                  className="fin-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div>
                <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-4)', display: 'block', marginBottom: 7 }}>
                  Subject
                </label>
                <input
                  className="fin-input"
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required disabled={loading}
                  maxLength={200}
                />
              </div>
              <div>
                <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-4)', display: 'block', marginBottom: 7 }}>
                  Message
                </label>
                <textarea
                  className="fin-input"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required disabled={loading}
                  rows={6}
                  maxLength={5000}
                  style={{ resize: 'vertical', minHeight: 120, fontFamily: 'inherit' }}
                />
              </div>

              {error && (
                <div style={{ fontSize: 12, color: 'var(--neg)', padding: '8px 12px', background: 'var(--neg-soft)', border: '1px solid var(--neg-line)', borderRadius: 8 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '11px 16px', marginTop: 4,
                  fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 700,
                  background: loading ? 'var(--bg-3)' : 'linear-gradient(135deg, oklch(0.68 0.18 258), oklch(0.64 0.19 285))',
                  color: 'oklch(0.97 0 0)',
                  border: 'none', borderRadius: 10,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-4)', marginTop: 20 }}>
          Or email us directly at{' '}
          <a href="mailto:dtahajomi2007@gmail.com" style={{ color: 'var(--ink-3)' }}>
            dtahajomi2007@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}
