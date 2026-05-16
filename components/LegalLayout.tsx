'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'

// Shared visual shell for legal pages (Privacy, Terms, Advisor Terms).
// Theme-aware via CSS variables, with a purple brand accent matching the
// Advisor tier color so all legal documents feel like one product surface.
export function LegalLayout({
  title,
  lastUpdated,
  versionNote,
  children,
}: {
  title:       string
  lastUpdated: string
  versionNote?: ReactNode
  children:    ReactNode
}) {
  return (
    <div
      style={{
        fontFamily:  'Inter, sans-serif',
        maxWidth:    760,
        margin:      '0 auto',
        padding:     '64px 24px',
        color:       'var(--ink-2)',
        lineHeight:  1.7,
      }}
    >
      <Link
        href="/"
        style={{
          fontSize:       13,
          color:          'var(--ink-3)',
          textDecoration: 'none',
          marginBottom:   40,
          display:        'inline-flex',
          alignItems:     'center',
          gap:            6,
          transition:     'color 0.15s',
        }}
        onMouseOver={e => (e.currentTarget.style.color = 'var(--brand-b)')}
        onMouseOut={e  => (e.currentTarget.style.color = 'var(--ink-3)')}
      >
        ← Back to Quantfoli
      </Link>

      {/* Purple accent strip above the title */}
      <div
        style={{
          width:         48,
          height:        3,
          borderRadius:  2,
          background:    'var(--grad-brand)',
          marginBottom:  18,
          boxShadow:     '0 0 18px oklch(0.64 0.190 285 / 0.45)',
        }}
      />

      <h1
        style={{
          fontSize:                28,
          fontWeight:              800,
          letterSpacing:           '-0.02em',
          marginBottom:            8,
          background:              'var(--grad-brand)',
          WebkitBackgroundClip:    'text',
          WebkitTextFillColor:     'transparent',
          backgroundClip:          'text',
          display:                 'inline-block',
        }}
      >
        {title}
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-4)', marginBottom: 40 }}>
        Last updated: {lastUpdated}
        {versionNote && (
          <span style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
            {versionNote}
          </span>
        )}
      </p>

      {children}
    </div>
  )
}

// Section heading with a small purple square-bullet — visible in both themes.
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontSize:      16,
          fontWeight:    700,
          color:         'var(--brand-b)',
          marginBottom:  12,
          display:       'flex',
          alignItems:    'center',
          gap:           10,
          letterSpacing: '-0.01em',
        }}
      >
        <span
          aria-hidden
          style={{
            display:       'inline-block',
            width:         8,
            height:        8,
            borderRadius:  2,
            background:    'var(--grad-brand)',
            boxShadow:     '0 0 8px oklch(0.64 0.190 285 / 0.55)',
            flexShrink:    0,
          }}
        />
        {title}
      </h2>
      <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>{children}</div>
    </section>
  )
}

// Purple-themed inline link helper for consistency across all legal pages.
export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      style={{
        color:          'var(--brand-b)',
        textDecoration: 'underline',
        textDecorationColor: 'oklch(0.64 0.190 285 / 0.5)',
        textUnderlineOffset: 3,
        transition:     'color 0.15s, text-decoration-color 0.15s',
      }}
    >
      {children}
    </a>
  )
}
