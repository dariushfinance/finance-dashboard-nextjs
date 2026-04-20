'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { SearchQuote } from '@/app/api/search/route'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (ticker: string) => void
}

const POPULAR = [
  { symbol: 'AAPL', label: 'Apple' }, { symbol: 'MSFT', label: 'Microsoft' },
  { symbol: 'NVDA', label: 'Nvidia' }, { symbol: 'GOOGL', label: 'Alphabet' },
  { symbol: 'AMZN', label: 'Amazon' }, { symbol: 'META', label: 'Meta' },
  { symbol: 'TSLA', label: 'Tesla' }, { symbol: 'SPY', label: 'S&P 500 ETF' },
  { symbol: 'QQQ', label: 'Nasdaq ETF' }, { symbol: 'VTI', label: 'Total Mkt' },
  { symbol: 'GLD', label: 'Gold ETF' }, { symbol: 'BND', label: 'Bond ETF' },
  { symbol: 'ASML', label: 'ASML' }, { symbol: 'NVO', label: 'Novo Nordisk' },
]

const TYPE_LABELS: Record<string, string> = {
  EQUITY: 'Stock', ETF: 'ETF', MUTUALFUND: 'Fund', INDEX: 'Index',
}

export default function CommandPalette({ open, onClose, onSelect }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchQuote[]>([])
  const [loading, setLoading] = useState(false)
  const [active,  setActive]  = useState(0)
  const inputRef  = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery(''); setResults([]); setActive(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => { setResults(d.quotes ?? []); setActive(0) })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 280)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = query ? results : POPULAR.map(p => ({ symbol: p.symbol, shortname: p.label, exchange: '', quoteType: 'EQUITY' }))
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, list.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && list[active]) { select(list[active].symbol) }
    if (e.key === 'Escape') onClose()
  }

  const select = (ticker: string) => {
    onSelect(ticker)
    onClose()
  }

  if (!open) return null

  const displayList: { symbol: string; shortname: string; exchange: string; quoteType: string }[] =
    query.trim() ? results : POPULAR.map(p => ({ symbol: p.symbol, shortname: p.label, exchange: '', quoteType: 'EQUITY' }))

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'oklch(0 0 0 / 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'grid', placeItems: 'start center',
        paddingTop: '14vh',
        animation: 'fade-in 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(560px, 92vw)',
          background: 'var(--bg-1)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-hi)',
          overflow: 'hidden',
          animation: 'modal-in 0.18s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--line-soft)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Search ticker or company…"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontFamily: 'var(--font-mono)', fontSize: 14,
              color: 'var(--ink)', outline: 'none',
            }}
          />
          {loading && <span className="spinner" />}
          <span className="kbd" style={{ fontSize: 11 }}>ESC</span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {!query.trim() && (
            <div style={{
              padding: '8px 18px 6px',
              fontSize: 10, fontWeight: 600, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--ink-4)',
            }}>Popular</div>
          )}
          {query.trim() && results.length === 0 && !loading && (
            <div style={{ padding: '20px 18px', color: 'var(--ink-3)', fontSize: 13, textAlign: 'center' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {displayList.map((r, i) => (
            <button
              key={r.symbol + i}
              onMouseDown={() => select(r.symbol)}
              onMouseEnter={() => setActive(i)}
              style={{
                width: '100%', textAlign: 'left',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 18px', gap: 12,
                background: i === active ? 'var(--bg-2)' : 'transparent',
                transition: 'background 0.1s',
                cursor: 'pointer', border: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--bg-3)', border: '1px solid var(--line)',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: 10, color: 'var(--ink-2)',
                  flexShrink: 0,
                }}>
                  {r.symbol.slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>
                    {r.symbol}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{r.shortname}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {r.exchange && (
                  <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>{r.exchange}</span>
                )}
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 5,
                  border: '1px solid var(--line)', color: 'var(--ink-3)',
                  fontFamily: 'var(--font-mono)', background: 'var(--bg-2)',
                }}>
                  {TYPE_LABELS[r.quoteType] ?? r.quoteType}
                </span>
                {i === active && (
                  <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>↵ add</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{
          display: 'flex', gap: 16, padding: '10px 18px',
          borderTop: '1px solid var(--line-soft)',
          fontSize: 10.5, color: 'var(--ink-4)',
          fontFamily: 'var(--font-mono)',
        }}>
          <span><span className="kbd">↑↓</span> navigate</span>
          <span><span className="kbd">↵</span> add to portfolio</span>
          <span><span className="kbd">ESC</span> close</span>
        </div>
      </div>
    </div>
  )
}
