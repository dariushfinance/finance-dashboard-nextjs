'use client'

import { useState, useEffect } from 'react'
import type { MarketQuote } from '@/app/api/markets/route'

type Category = 'indices' | 'sectors' | 'bonds' | 'commodities' | 'crypto' | 'global'

const CATEGORY_LABELS: Record<Category, string> = {
  indices:    'Major Indices',
  sectors:    'US Sectors',
  bonds:      'Fixed Income',
  commodities:'Commodities',
  crypto:     'Crypto',
  global:     'Global Equity',
}

const SECTOR_NAMES: Record<string, string> = {
  XLK: 'Technology', XLF: 'Financials', XLV: 'Healthcare', XLE: 'Energy',
  XLI: 'Industrials', XLP: 'Cons. Staples', XLU: 'Utilities', XLC: 'Comm. Services',
  XLRE: 'Real Estate', XLB: 'Materials',
}

function QuoteRow({ q }: { q: MarketQuote }) {
  const up = q.changePct >= 0
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto auto auto',
      alignItems: 'center', gap: 16,
      padding: '11px 18px', borderBottom: '1px solid var(--line-soft)',
      transition: 'background 0.14s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
          {q.symbol}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 2 }}>
          {SECTOR_NAMES[q.symbol] ?? q.name}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', textAlign: 'right' }}>
        ${q.price.toFixed(2)}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: up ? 'var(--pos)' : 'var(--neg)', textAlign: 'right', minWidth: 64 }}>
        {up ? '+' : ''}{q.change.toFixed(2)}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700,
        color: up ? 'var(--pos)' : 'var(--neg)',
        background: up ? 'var(--pos-soft)' : 'var(--neg-soft)',
        border: `1px solid ${up ? 'var(--pos-line)' : 'var(--neg-line)'}`,
        padding: '3px 9px', borderRadius: 6, textAlign: 'right', minWidth: 68,
      }}>
        {up ? '+' : ''}{q.changePct.toFixed(2)}%
      </div>
    </div>
  )
}

function SectorHeatmap({ sectors }: { sectors: MarketQuote[] }) {
  const max = Math.max(...sectors.map(s => Math.abs(s.changePct)), 2)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
      {sectors.map(s => {
        const intensity = Math.min(Math.abs(s.changePct) / max, 1)
        const up = s.changePct >= 0
        const bg = up
          ? `oklch(${0.22 + intensity * 0.24} ${intensity * 0.15} 160)`
          : `oklch(${0.22 + intensity * 0.22} ${intensity * 0.17} 25)`
        return (
          <div key={s.symbol} style={{
            background: bg, borderRadius: 10,
            padding: '14px 12px', textAlign: 'center',
            border: '1px solid oklch(1 0 0 / 0.06)',
            transition: 'transform 0.15s',
            cursor: 'default',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}
            title={`${s.name} — $${s.price.toFixed(2)}`}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11.5, color: 'oklch(0.97 0.004 90)', marginBottom: 4 }}>{s.symbol}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: up ? 'oklch(0.95 0.10 160)' : 'oklch(0.95 0.10 25)' }}>
              {up ? '+' : ''}{s.changePct.toFixed(2)}%
            </div>
            <div style={{ fontSize: 9.5, color: 'oklch(0.97 0 0 / 0.55)', marginTop: 3 }}>
              {SECTOR_NAMES[s.symbol] ?? s.symbol}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function MarketsTab() {
  const [data, setData]       = useState<Record<Category, MarketQuote[]> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [activeTab, setActiveTab] = useState<Category>('indices')
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('pi_watchlist') ?? '["AAPL","MSFT","NVDA","TSM","ASML"]') } catch { return [] }
  })
  const [wInput, setWInput] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMarkets = () => {
    setLoading(true); setError('')
    fetch('/api/markets')
      .then(r => r.json())
      .then(d => { setData(d); setLastUpdated(new Date()) })
      .catch(() => setError('Failed to fetch market data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMarkets() }, [])
  useEffect(() => { localStorage.setItem('pi_watchlist', JSON.stringify(watchlist)) }, [watchlist])

  const addToWatchlist = () => {
    const t = wInput.trim().toUpperCase()
    if (t && !watchlist.includes(t)) { setWatchlist(w => [...w, t]) }
    setWInput('')
  }

  // All market quotes flat
  const allQuotes = data ? Object.values(data).flat() : []

  // Build watchlist quotes from all fetched data
  const watchlistQuotes = watchlist.map(sym => {
    const found = allQuotes.find(q => q.symbol === sym)
    return found ?? { symbol: sym, name: sym, price: 0, change: 0, changePct: 0, category: 'watchlist' }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Sector heatmap (always visible) ── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card__head">
          <div>
            <div className="card__title">US Sector Heatmap</div>
            <div className="card__sub">Today&apos;s performance by sector ETF</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {loading && <span className="spinner" />}
            {lastUpdated && <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
            <button className="btn btn--ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={fetchMarkets}>↻ Refresh</button>
          </div>
        </div>
        <div style={{ padding: 18 }}>
          {data?.sectors ? <SectorHeatmap sectors={data.sectors} /> : (
            <div style={{ height: 120, display: 'grid', placeItems: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              {loading ? 'Loading market data…' : error || 'No data'}
            </div>
          )}
        </div>
      </div>

      {/* ── Market data tabs + watchlist ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Market tabs */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card__head">
            <div className="range-tabs">
              {(Object.keys(CATEGORY_LABELS) as Category[]).map(c => (
                <button key={c} className={`range-tab ${activeTab === c ? 'active' : ''}`} onClick={() => setActiveTab(c)}>
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          <div>
            {data?.[activeTab]?.length ? (
              data[activeTab].map(q => <QuoteRow key={q.symbol} q={q} />)
            ) : (
              <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                {loading ? 'Loading…' : 'No data'}
              </div>
            )}
          </div>
        </div>

        {/* Watchlist */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card__head">
            <div>
              <div className="card__title">Watchlist</div>
              <div className="card__sub">Prices from live market data</div>
            </div>
          </div>

          {/* Add ticker */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: 8 }}>
            <input
              className="fin-input"
              style={{ flex: 1, textTransform: 'uppercase', fontSize: 12 }}
              placeholder="Add ticker…"
              value={wInput}
              onChange={e => setWInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && addToWatchlist()}
            />
            <button className="btn btn--primary" style={{ fontSize: 11, padding: '6px 10px' }} onClick={addToWatchlist}>+</button>
          </div>

          {watchlistQuotes.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12 }}>Add tickers above</div>
          ) : (
            watchlistQuotes.map(q => (
              <div key={q.symbol} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderBottom: '1px solid var(--line-soft)',
                gap: 8,
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--ink)' }}>{q.symbol}</div>
                  {q.price > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1 }}>${q.price.toFixed(2)}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {q.price > 0 ? (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700,
                      color: q.changePct >= 0 ? 'var(--pos)' : 'var(--neg)',
                      background: q.changePct >= 0 ? 'var(--pos-soft)' : 'var(--neg-soft)',
                      border: `1px solid ${q.changePct >= 0 ? 'var(--pos-line)' : 'var(--neg-line)'}`,
                      padding: '2px 7px', borderRadius: 5,
                    }}>
                      {q.changePct >= 0 ? '+' : ''}{q.changePct.toFixed(2)}%
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>no data</span>
                  )}
                  <button
                    style={{ color: 'var(--ink-4)', fontSize: 12, padding: '2px 6px', borderRadius: 5, transition: 'color 0.15s' }}
                    onClick={() => setWatchlist(w => w.filter(s => s !== q.symbol))}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--neg)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-4)')}
                    title="Remove"
                  >✕</button>
                </div>
              </div>
            ))
          )}
          <div style={{ padding: '10px 14px', fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
            Watchlist saved locally in browser
          </div>
        </div>
      </div>

      {error && <div style={{ color: 'var(--neg)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{error}</div>}
    </div>
  )
}
