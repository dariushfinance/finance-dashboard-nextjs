'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Position } from '@/types'
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
import TickerTape from './TickerTape'
import CommandPalette from './CommandPalette'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

type TabId = 'overview' | 'holdings' | 'history' | 'benchmark' | 'fundamentals' | 'risk' | 'stress' | 'frontier' | 'hedging'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',     label: 'Overview',      icon: <IconGrid /> },
  { id: 'holdings',     label: 'Holdings',      icon: <IconPie /> },
  { id: 'history',      label: 'History',       icon: <IconHistory /> },
  { id: 'benchmark',    label: 'Benchmark',     icon: <IconTrend /> },
  { id: 'fundamentals', label: 'Fundamentals',  icon: <IconTable /> },
  { id: 'risk',         label: 'Risk',          icon: <IconWarning /> },
  { id: 'stress',       label: 'Stress Test',   icon: <IconActivity /> },
  { id: 'frontier',     label: 'Frontier',      icon: <IconScatter /> },
  { id: 'hedging',      label: 'Hedging',        icon: <IconShield /> },
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
function IconSearch()   { return <Ico d={<><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>} /> }
function IconPlus()     { return <Ico d={<path d="M12 5v14M5 12h14"/>} /> }
function IconRefresh()  { return <Ico d={<><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></>} /> }
function IconSun()      { return <Ico d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></>} /> }
function IconMoon()     { return <Ico d={<path d="M21 12.8A9 9 0 0 1 11.2 3a7 7 0 1 0 9.8 9.8z"/>} /> }
function IconMenu()     { return <Ico d={<><path d="M4 6h16M4 12h16M4 18h16"/></>} /> }
function IconClose()    { return <Ico d={<path d="M6 6l12 12M18 6L6 18"/>} sw={2} /> }

// ── Market Status pill (display-only) ────────────────────────────────────────

function MarketStatus() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const h   = now.getUTCHours()
  const day = now.getUTCDay()
  const open = day >= 1 && day <= 5 && h >= 13 && h < 20
  return (
    <div
      className={`pill ${open ? 'pill--open' : 'pill--closed'}`}
      title={open ? 'NYSE is currently open' : 'NYSE is currently closed'}
      style={{ cursor: 'default', userSelect: 'none' }}
    >
      <span className="pill__dot" />
      {open ? 'Market open' : 'After hours'}
      <span style={{ color: 'var(--ink-4)', marginLeft: 4 }}>
        {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} ET
      </span>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [user, setUser]                   = useState<import('@supabase/supabase-js').User | null>(null)
  const [positions, setPositions]         = useState<Position[]>([])
  const [loading, setLoading]             = useState(false)
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [addModalOpen, setAddModalOpen]   = useState(false)
  const [paletteOpen, setPaletteOpen]     = useState(false)
  const [preFillTicker, setPreFillTicker] = useState('')
  const [activeTab, setActiveTab]         = useState<TabId>('overview')
  const [theme, setTheme]                 = useState<'dark' | 'light'>('dark')
  const router   = useRouter()
  const [supabase] = useState(() => createBrowserSupabase())

  // Persist theme
  useEffect(() => {
    const stored = localStorage.getItem('pi_theme') as 'dark' | 'light' | null
    if (stored) setTheme(stored)
  }, [])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('pi_theme', theme)
  }, [theme])

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

  const handleDelete = async (id: number) => {
    await fetch('/api/portfolio', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
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

          {/* Empty state */}
          {positions.length === 0 && !loading ? (
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
          ) : (
            <>
              {activeTab === 'overview' && (
                <>
                  <MetricsRow
                    total_value={total_value}
                    total_invested={total_invested}
                    total_pnl={total_pnl}
                    total_return={total_return}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <PortfolioTable positions={positions} onDelete={handleDelete} />
                    <AllocationChart positions={positions} />
                  </div>
                </>
              )}
              {activeTab === 'holdings'     && <BreakdownTab positions={positions} />}
              {activeTab === 'history'      && <HistoryChart positions={positions} />}
              {activeTab === 'benchmark'    && <BenchmarkChart positions={positions} />}
              {activeTab === 'fundamentals' && <FundamentalsTable positions={positions} />}
              {activeTab === 'risk'         && <RiskTab positions={positions} />}
              {activeTab === 'stress'       && <StressTest positions={positions} />}
              {activeTab === 'frontier'     && <FrontierChart positions={positions} />}
              {activeTab === 'hedging'      && <HedgingTab positions={positions} />}
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
