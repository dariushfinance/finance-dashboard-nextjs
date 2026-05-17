'use client'

import { useState } from 'react'

export function CopyLinkButton({ anchor, label = 'Copy link' }: { anchor: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const onClick = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#${anchor}` : ''
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API blocked — fall back to selecting the text
      window.prompt('Copy this link', url)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        padding: '4px 10px',
        borderRadius: 6,
        border: '1px solid var(--line)',
        background: copied ? 'var(--accent-soft)' : 'var(--bg-2)',
        color: copied ? 'var(--accent)' : 'var(--ink-3)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
