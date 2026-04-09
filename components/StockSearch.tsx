'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { SearchQuote } from '@/app/api/search/route'

// Popular stocks shown as quick-pick chips before the user types anything
const POPULAR: { symbol: string; label: string }[] = [
  { symbol: 'AAPL',  label: 'Apple' },
  { symbol: 'MSFT',  label: 'Microsoft' },
  { symbol: 'NVDA',  label: 'Nvidia' },
  { symbol: 'GOOGL', label: 'Alphabet' },
  { symbol: 'AMZN',  label: 'Amazon' },
  { symbol: 'META',  label: 'Meta' },
  { symbol: 'TSLA',  label: 'Tesla' },
  { symbol: 'SPY',   label: 'S&P 500 ETF' },
  { symbol: 'QQQ',   label: 'Nasdaq ETF' },
  { symbol: 'VTI',   label: 'Total Market' },
  { symbol: 'GLD',   label: 'Gold ETF' },
  { symbol: 'BND',   label: 'Bond ETF' },
  { symbol: 'BRK-B', label: 'Berkshire B' },
  { symbol: 'JPM',   label: 'JPMorgan' },
  { symbol: 'V',     label: 'Visa' },
]

interface Props {
  value: string
  onChange: (ticker: string) => void
  disabled?: boolean
}

export default function StockSearch({ value, onChange, disabled }: Props) {
  const [query, setQuery]       = useState(value)
  const [results, setResults]   = useState<SearchQuote[]>([])
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const containerRef            = useRef<HTMLDivElement>(null)
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep input in sync when parent resets value
  useEffect(() => { setQuery(value) }, [value])

  // Click-outside closes dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback((q: string) => {
    if (!q || q.length < 1) { setResults([]); setOpen(false); return }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.quotes ?? [])
        setOpen(true)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setQuery(val)
    onChange(val) // keep parent in sync as user types

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const handleSelect = (symbol: string) => {
    setQuery(symbol)
    onChange(symbol)
    setOpen(false)
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setResults([]) }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="relative">
        <input
          className="fin-input uppercase pr-7"
          placeholder="Search ticker or company…"
          value={query}
          onChange={handleInput}
          onFocus={() => { if (results.length) setOpen(true) }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 spinner scale-75" />
        )}
      </div>

      {/* Search results dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-bg-card border border-bg-border rounded-xl shadow-card overflow-hidden">
          {results.map((q) => (
            <button
              key={q.symbol}
              type="button"
              onMouseDown={() => handleSelect(q.symbol)}
              className="w-full text-left px-3 py-2.5 hover:bg-bg-elevated flex items-center justify-between gap-2 transition-colors"
            >
              <div>
                <span className="text-xs font-mono font-semibold text-text-primary">{q.symbol}</span>
                <span className="text-xs text-text-muted ml-2 truncate">{q.shortname}</span>
              </div>
              <span className="text-xs text-text-muted flex-shrink-0">{q.exchange}</span>
            </button>
          ))}
        </div>
      )}

      {/* Popular quick-picks (shown when input is empty) */}
      {!query && (
        <div className="mt-2">
          <div className="text-xs text-text-muted mb-1.5">Popular</div>
          <div className="flex flex-wrap gap-1">
            {POPULAR.map(({ symbol, label }) => (
              <button
                key={symbol}
                type="button"
                onMouseDown={() => handleSelect(symbol)}
                disabled={disabled}
                title={label}
                className="px-2 py-1 text-xs font-mono bg-bg-elevated hover:bg-bg-border border border-bg-border
                           rounded-md text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
