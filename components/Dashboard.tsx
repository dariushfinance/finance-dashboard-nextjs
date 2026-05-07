'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Position } from '@/types'

// ── Currency types ────────────────────────────────────────────

export type CurrencyCode = 'USD' | 'CHF' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'SGD'
export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  dec: number   // decimal places for display
  rate: number  // how many of this currency per 1 USD
}

const CURRENCIES: Omit<CurrencyConfig, 'rate'>[] = [
  { code: 'USD', symbol: '$',     dec: 2 },
  { code: 'CHF', symbol: 'Fr. ', dec: 2 },
  { code: 'EUR', symbol: '€',    dec: 2 },
  { code: 'GBP', symbol: '£',    dec: 2 },
  { code: 'JPY', symbol: '¥',    dec: 0 },
  { code: 'CAD', symbol: 'CA$',  dec: 2 },
  { code: 'SGD', symbol: 'S$',   dec: 2 },
]

/** Format a USD amount in the target currency */
export function fmtCcy(usd: number, ccy: CurrencyConfig, sign = false): string {
  const val = usd * ccy.rate
  const abs = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: ccy.dec, maximumFractionDigits: ccy.dec })
  const neg = val < 0 ? '−' : sign && val > 0 ? '+' : ''
  return `${neg}${ccy.symbol}${abs}`
}

/** Compact format (K / M) */
export function fmtCcyCompact(usd: number, ccy: CurrencyConfig): string {
  const val = Math.abs(usd * ccy.rate)
  if (val >= 1_000_000) return `${ccy.symbol}${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000)     return `${ccy.symbol}${(val / 1_000).toFixed(1)}K`
  return `${ccy.symbol}${val.toFixed(ccy.dec)}`
}
import MetricsRow from './MetricsRow'
import PortfolioTable from './PortfolioTable'
import AllocationChart from './AllocationChart'
import HistoryChart from './HistoryChart'
import BenchmarkChart from './BenchmarkChart'
import FundamentalsTable from './FundamentalsTable'
import AddPositionForm from './AddPositionForm'
import RiskTab from './RiskTab'
import StressTest from './StressTest'
import FrontierChart from './FrontierChart'
import HedgingTab from './HedgingTab'
import BreakdownTab from './BreakdownTab'
import DividendsTab from './DividendsTab'
import MarketsTab from './MarketsTab'
import CashflowsTab from './CashflowsTab'
import TickerTape from './TickerTape'
import CommandPalette from './CommandPalette'
import CsvImport from './CsvImport'
import YuhImport from './YuhImport'
import NeonImport from './NeonImport'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

type TabId = 'overview' | 'holdings' | 'history' | 'benchmark' | 'dividends' | 'fundamentals' | 'risk' | 'stress' | 'frontier' | 'hedging' | 'markets' | 'cashflows'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',     label: 'Overview',      icon: <IconGrid /> },
  { id: 'holdings',     label: 'Holdings',      icon: <IconPie /> },
  { id: 'history',      label: 'History',       icon: <IconHistory /> },
  { id: 'benchmark',    label: 'Benchmark',     icon: <IconTrend /> },
  { id: 'dividends',    label: 'Dividends',     icon: <IconCoins /> },
  { id: 'fundamentals', label: 'Fundamentals',  icon: <IconTable /> },
  { id: 'risk',         label: 'Risk',          icon: <IconWarning /> },
  { id: 'stress',       label: 'Stress Test',   icon: <IconActivity /> },
  { id: 'frontier',     label: 'Frontier',      icon: <IconScatter /> },
  { id: 'hedging',      label: 'Hedging',       icon: <IconShield /> },
  { id: 'markets',      label: 'Markets',       icon: <IconGlobe /> },
  { id: 'cashflows',    label: 'Cashflows',     icon: <IconCash /> },
]

// ── Icons ────────────────────────────────────────────────────────────────────

function Ico({ d, size = 16, sw = 1.6 }: { d: React.ReactNode; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  )
}
function IconGrid()     { return <Ico d={<><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>} /> }
function IconPie()      { return <Ico d={<><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></>} /> }
function IconHistory()  { return <Ico d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M3 12a9 9 0 0 1 9-9"/></>} /> }
function IconTrend()    { return <Ico d={<><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>} /> }
function IconTable()    { return <Ico d={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 9v12"/></>} /> }
function IconWarning()  { return <Ico d={<><path d="M12 3l9 16H3z"/><path d="M12 10v5"/><circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="none"/></>} /> }
function IconActivity() { return <Ico d={<path d="M3 12h3l2-8 4 16 2-8h7"/>} /> }
function IconScatter()  { return <Ico d={<><path d="M3 20c4-12 10-14 18-14"/><circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none"/><circle cx="14" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="7" r="1.5" fill="currentColor" stroke="none"/></>} /> }
function IconShield()   { return <Ico d={<><path d="M12 3l8 4v5c0 4.4-3.4 8.5-8 9.5C7.4 20.5 4 16.4 4 12V7z"/><path d="M9 12l2 2 4-4"/></>} /> }
function IconCoins()    { return <Ico d={<><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.7.71-2.82 2.82"/></>} /> }
function IconGlobe()    { return <Ico d={<><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></>} /> }
function IconCash()     { return <Ico d={<><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></>} /> }
function IconSearch()   { return <Ico d={<><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>} /> }
function IconPlus()     { return <Ico d={<path d="M12 5v14M5 12h14"/>} /> }
function IconRefresh()  { return <Ico d={<><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></>} /> }
function IconSun()      { return <Ico d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></>} /> }
function IconMoon()     { return <Ico d={<path d="M21 12.8A9 9 0 0 1 11.2 3a7 7 0 1 0 9.8 9.8z"/>} /> }
function IconMenu()     { return <Ico d={<><path d="M4 6h16M4 12h16M4 18h16"/></>} /> }
function IconClose()    { return <Ico d={<path d="M6 6l12 12M18 6L6 18"/>} sw={2} /> }
function IconUpload()   { return <Ico d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></>} /> }

// ── Market Status pills ───────────────────────────────────────────────────────

function MarketStatus() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const utcMs  = now.getTime()
  const day    = now.getUTCDay()   // 0=Sun, 6=Sat
  const month  = now.getUTCMonth() // 0-indexed
  const isWeekday = day >= 1 && day <= 5

  // DST offsets (month-based approximation)
  const chOffset = (month >= 2 && month <= 9) ? 2 : 1   // CEST / CET
  const etOffset = (month >= 2 && month <= 10) ? -4 : -5 // EDT / EST
  const ukOffset = (month >= 2 && month <= 9) ? 1 : 0    // BST / GMT

  function localTime(offsetH: number) {
    const d   = new Date(utcMs + offsetH * 3_600_000)
    const hh  = String(d.getUTCHours()).padStart(2, '0')
    const mm  = String(d.getUTCMinutes()).padStart(2, '0')
    const min = d.getUTCHours() * 60 + d.getUTCMinutes()
    return { str: `${hh}:${mm}`, min }
  }

  function isOpen(offsetH: number, openH: number, openM: number, closeH: number, closeM: number) {
    if (!isWeekday) return false
    const { min } = localTime(offsetH)
    return min >= openH * 60 + openM && min < closeH * 60 + closeM
  }

  const ch = localTime(chOffset)
  const et = localTime(etOffset)
  const uk = localTime(ukOffset)

  const markets = [
    {
      label: 'SIX',
      time:  ch.str,
      zone:  chOffset === 2 ? 'CEST' : 'CET',
      open:  isOpen(chOffset, 9, 0, 17, 30),
      title: 'SIX Swiss Exchange · 09:00–17:30 CEST',
    },
    {
      label: 'NYSE',
      time:  et.str,
      zone:  etOffset === -4 ? 'EDT' : 'EST',
      open:  isOpen(etOffset, 9, 30, 16, 0),
      title: 'NYSE · 09:30–16:00 ET',
    },
    {
      label: 'LSE',
      time:  uk.str,
      zone:  ukOffset === 1 ? 'BST' : 'GMT',
      open:  isOpen(ukOffset, 8, 0, 16, 30),
      title: 'London Stock Exchange · 08:00–16:30 BST',
    },
  ]

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {markets.map(m => (
        <div
          key={m.label}
          className={`pill ${m.open ? 'pill--open' : 'pill--closed'}`}
          title={m.title}
          style={{ cursor: 'default', userSelect: 'none', gap: 5 }}
        >
          <span className="pill__dot" />
          <span style={{ fontWeight: 700 }}>{m.label}</span>
          <span style={{ color: 'var(--ink-4)', fontSize: 10 }}>{m.time} {m.zone}</span>
        </div>
      ))}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [user, setUser]                   = useState<import('@supabase/supabase-js').User | null>(null)
  const [positions, setPositions]         = useState<Position[]>([])
  const [loading, setLoading]             = useState(false)
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [addModalOpen, setAddModalOpen]       = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importBroker, setImportBroker]       = useState<'csv' | 'yuh' | 'neon'>('yuh')
  const [paletteOpen, setPaletteOpen]         = useState(false)
  const [preFillTicker, setPreFillTicker] = useState('')
  const [activeTab, setActiveTab]         = useState<TabId>('overview')
  const [theme, setTheme]                 = useState<'dark' | 'light'>('dark')
  const [currencyCode, setCurrencyCode]   = useState<CurrencyCode>('USD')
  const [fxRates, setFxRates]             = useState<Record<string, number>>({ USD: 1 })
  const router   = useRouter()
  const [supabase] = useState(() => createBrowserSupabase())

  // Persist theme
  useEffect(() => {
    const stored = localStorage.getItem('pi_theme') as 'dark' | 'light' | null
    if (stored) setTheme(stored)
    const storedCcy = localStorage.getItem('pi_currency') as CurrencyCode | null
    if (storedCcy) setCurrencyCode(storedCcy)
  }, [])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('pi_theme', theme)
  }, [theme])
  useEffect(() => { localStorage.setItem('pi_currency', currencyCode) }, [currencyCode])

  // Fetch FX rates on mount (cached 15 min server-side)
  useEffect(() => {
    fetch('/api/fx')
      .then(r => r.json())
      .then(d => { if (d.rates) setFxRates(d.rates) })
      .catch(() => {}) // silently fall back to 1:1
  }, [])

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) router.push('/login')
    })
    return () => subscription.unsubscribe()
  }, [supabase, router])

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      // ⌘K or Ctrl+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }
      // Number keys 1-9 → tab switch
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= TABS.length) setActiveTab(TABS[n - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const fetchPortfolio = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portfolio')
      if (res.ok) setPositions(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPortfolio() }, [fetchPortfolio])

  const handleDelete = async (ticker: string) => {
    await fetch('/api/portfolio', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    })
    fetchPortfolio()
  }

  const handleClearAll = async () => {
    if (!confirm(`Remove all ${positions.length} positions? This cannot be undone.`)) return
    await fetch('/api/portfolio', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearAll: true }),
    })
    fetchPortfolio()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // When palette selects a ticker, pre-fill the add modal
  const handlePaletteSelect = (ticker: string) => {
    setPreFillTicker(ticker)
    setAddModalOpen(true)
  }

  const priced         = positions.filter(p => !p.price_error)
  const total_value    = priced.reduce((s, p) => s + (p.current_value ?? 0), 0)
  const total_invested = priced.reduce((s, p) => s + (p.invested ?? 0), 0)
  const total_pnl      = total_value - total_invested
  const total_return   = total_invested > 0 ? ((total_value / total_invested) - 1) * 100 : 0

  // Currency config — all monetary display goes through this
  const ccyDef   = CURRENCIES.find(c => c.code === currencyCode) ?? CURRENCIES[0]
  const ccy: CurrencyConfig = { ...ccyDef, rate: fxRates[currencyCode] ?? 1 }

  const activeLabel = TABS.find(t => t.id === activeTab)?.label ?? ''
  const initials    = user?.email ? user.email.slice(0, 2).toUpperCase() : 'DT'
  const displayName = user?.email?.split('@')[0] ?? 'User'

  return (
    <div className="app">
      <TickerTape />

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`side ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand__mark">P</div>
          <div>
            <div className="brand__name">Portfolio<br />Intelligence</div>
            <div className="brand__tag">Pro · v4.2</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav__label">Workspace</div>
          {TABS.map((t, i) => (
            <button
              key={t.id}
              className={`nav__item ${activeTab === t.id ? 'nav__item--active' : ''}`}
              onClick={() => { setActiveTab(t.id); setSidebarOpen(false) }}
            >
              <span style={{ color: activeTab === t.id ? 'var(--ink)' : 'var(--ink-3)', display: 'inline-flex' }}>
                {t.icon}
              </span>
              {t.label}
              <span className="kbd">{i + 1}</span>
            </button>
          ))}
        </nav>

        <div className="side__foot">
          <div className="user-card">
            <div className="user-card__avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-card__name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div className="user-card__plan">Pro · HSG &#39;26</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ fontSize: 11, color: 'var(--ink-4)', padding: '4px 8px', textAlign: 'left', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--neg)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-4)')}
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="icon-btn"
              style={{ display: 'none' }}
              onClick={() => setSidebarOpen(true)}
              id="mobile-menu-btn"
            >
              <IconMenu />
            </button>
            <div className="crumbs">
              <span>My Portfolio</span>
              <span>/</span>
              <strong>{activeLabel}</strong>
            </div>
          </div>

          <div className="topbar__tools">
            <MarketStatus />

            {/* Currency switcher */}
            <div className="currency-switcher" title="Display currency">
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  className={`currency-btn ${currencyCode === c.code ? 'active' : ''}`}
                  onClick={() => setCurrencyCode(c.code)}
                  title={`Display in ${c.code}`}
                >
                  {c.code}
                </button>
              ))}
            </div>

            {/* FX rate badge — shows when not USD */}
            {currencyCode !== 'USD' && fxRates[currencyCode] && (
              <div className="fx-badge" title={`Live FX rate from Yahoo Finance`}>
                1 USD = {ccy.rate.toFixed(currencyCode === 'JPY' ? 2 : 4)} {currencyCode}
              </div>
            )}

            {/* Clickable search → opens command palette */}
            <button
              className="topbar-search"
              onClick={() => setPaletteOpen(true)}
              title="Search symbols (⌘K)"
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <IconSearch />
              <span>Search symbols…</span>
              <span className="kbd">⌘K</span>
            </button>

            {loading && <span className="spinner" />}

            <button
              className="icon-btn"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
            <button className="btn btn--ghost" onClick={fetchPortfolio}>
              <IconRefresh /><span>Refresh</span>
            </button>
            <button className="btn btn--ghost" onClick={() => setImportModalOpen(true)}>
              <IconUpload /><span>Import</span>
            </button>
            <button className="btn btn--primary" onClick={() => { setPreFillTicker(''); setAddModalOpen(true) }}>
              <IconPlus /><span>Add position</span>
            </button>
          </div>
        </div>

        {/* Page */}
        <div className="page">
          {/* Tab bar */}
          <div className="tabbar">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tabbar__btn ${activeTab === t.id ? 'tabbar__btn--active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                {t.id === 'overview' && positions.length > 0 && (
                  <span className="count">{positions.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Markets tab works without positions */}
          {activeTab === 'markets' && <MarketsTab />}

          {/* Empty state — applies to all other tabs */}
          {activeTab !== 'markets' && positions.length === 0 && !loading ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state__icon">📊</div>
                <div className="empty-state__title">No positions yet</div>
                <div className="empty-state__sub">Add your first holding to get started tracking your portfolio.</div>
                <button className="btn btn--primary" style={{ marginTop: 20 }} onClick={() => setAddModalOpen(true)}>
                  <IconPlus /><span>Add position</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'markets' ? null : (
            <>
              {activeTab === 'overview' && (
                <>
                  <MetricsRow
                    total_value={total_value}
                    total_invested={total_invested}
                    total_pnl={total_pnl}
                    total_return={total_return}
                    ccy={ccy}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <PortfolioTable positions={positions} onDelete={handleDelete} onClearAll={handleClearAll} ccy={ccy} />
                    <AllocationChart positions={positions} ccy={ccy} />
                  </div>
                </>
              )}
              {activeTab === 'holdings'     && <BreakdownTab positions={positions} />}
              {activeTab === 'history'      && <HistoryChart positions={positions} />}
              {activeTab === 'benchmark'    && <BenchmarkChart positions={positions} />}
              {activeTab === 'dividends'    && <DividendsTab positions={positions} ccy={ccy} />}
              {activeTab === 'fundamentals' && <FundamentalsTable positions={positions} />}
              {activeTab === 'risk'         && <RiskTab positions={positions} />}
              {activeTab === 'stress'       && <StressTest positions={positions} />}
              {activeTab === 'frontier'     && <FrontierChart positions={positions} />}
              {activeTab === 'hedging'      && <HedgingTab positions={positions} />}
              {activeTab === 'cashflows'    && <CashflowsTab positions={positions} ccy={ccy} />}
            </>
          )}

          <div style={{
            marginTop: 40, paddingTop: 16,
            borderTop: '1px solid var(--line-soft)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)',
          }}>
            <span>Portfolio Intelligence · Built by Dariush Tahajomi</span>
            <span>Alpha Vantage · Yahoo Finance · Supabase</span>
          </div>
        </div>
      </main>

      {/* Add Position Modal */}
      {addModalOpen && (
        <div className="modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <div>
                <div className="modal__head-title">Add position</div>
                <div className="modal__head-sub">Track a new holding in your portfolio</div>
              </div>
              <button className="icon-btn" onClick={() => setAddModalOpen(false)}>
                <IconClose />
              </button>
            </div>
            <div className="modal__body">
              <AddPositionForm
                key={preFillTicker}
                onAdded={() => { fetchPortfolio(); setAddModalOpen(false) }}
                preFillTicker={preFillTicker}
              />
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="modal-backdrop" onClick={() => setImportModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <div>
                <div className="modal__head-title">Import positions</div>
                <div className="modal__head-sub">Import from your broker export</div>
              </div>
              <button className="icon-btn" onClick={() => setImportModalOpen(false)}>
                <IconClose />
              </button>
            </div>

            {/* Broker tab selector */}
            <div style={{ display: 'flex', gap: 4, padding: '0 20px 0', borderBottom: '1px solid var(--line-soft)' }}>
              {(['yuh', 'neon', 'csv'] as const).map(broker => (
                <button
                  key={broker}
                  onClick={() => setImportBroker(broker)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: importBroker === broker ? '2px solid var(--brand-green)' : '2px solid transparent',
                    color: importBroker === broker ? 'var(--ink-1)' : 'var(--ink-4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'color 0.15s',
                  }}
                >
                  {broker === 'csv' ? 'Generic CSV' : broker === 'yuh' ? 'Yuh' : 'Neon'}
                </button>
              ))}
            </div>

            <div className="modal__body">
              {importBroker === 'yuh'  && <YuhImport  onDone={() => { fetchPortfolio(); setImportModalOpen(false) }} />}
              {importBroker === 'neon' && <NeonImport onDone={() => { fetchPortfolio(); setImportModalOpen(false) }} />}
              {importBroker === 'csv'  && <CsvImport  onDone={() => { fetchPortfolio(); setImportModalOpen(false) }} />}
            </div>
          </div>
        </div>
      )}

      {/* Command palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handlePaletteSelect}
      />

      {/* Mobile menu visibility */}
      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: inline-grid !important; }
        }
      `}</style>
    </div>
  )
}
