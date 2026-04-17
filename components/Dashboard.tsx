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
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function Dashboard() {
  const [user, setUser]           = useState<User | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading]     = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'benchmark' | 'fundamentals' | 'risk'>('overview')
  const router = useRouter()
  const [supabase] = useState(() => createBrowserSupabase())

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) router.push('/login')
    })
    return () => subscription.unsubscribe()
  }, [supabase, router])

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

  const total_value    = positions.reduce((s, p) => s + (p.current_value ?? 0), 0)
  const total_invested = positions.reduce((s, p) => s + (p.invested    ?? 0), 0)
  const total_pnl      = total_value - total_invested
  const total_return   = total_invested > 0 ? ((total_value / total_invested) - 1) * 100 : 0

  const TABS = [
    { id: 'overview',     label: 'Overview' },
    { id: 'history',      label: 'History' },
    { id: 'benchmark',    label: 'Benchmark' },
    { id: 'fundamentals', label: 'Fundamentals' },
    { id: 'risk',         label: 'Risk' },
  ] as const

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-bg-card border-r border-bg-border flex flex-col
          transform transition-transform duration-200 md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-bg-border flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center text-bg-base font-bold text-sm">P</div>
          <div>
            <div className="font-semibold text-sm text-text-primary">Portfolio Intelligence</div>
            <div className="text-xs text-text-muted">v2.0 · Next.js</div>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-5 border-b border-bg-border">
          <div className="text-xs font-medium text-text-muted uppercase tracking-widest mb-2">Account</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse flex-shrink-0" />
            <span className="text-xs text-text-secondary truncate">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 text-xs text-text-muted hover:text-brand-red transition-colors"
          >
            Sign out →
          </button>
        </div>

        {/* Add position form */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">
          <div className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4">Add Position</div>
          <AddPositionForm onAdded={fetchPortfolio} />
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-bg-base/90 backdrop-blur-md border-b border-bg-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-text-secondary hover:text-text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">My Portfolio</h1>
              {positions.length > 0 && (
                <div className="text-xs text-text-muted">{positions.length} positions · Live data</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && <span className="spinner" />}
            <button
              className="text-xs text-text-muted hover:text-text-secondary border border-bg-border rounded-lg px-3 py-1.5 transition-colors"
              onClick={fetchPortfolio}
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 px-6 py-6 space-y-6 animate-fade-in">
          {positions.length === 0 && !loading ? (
            <div className="fin-card flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-text-primary font-semibold mb-1">No positions yet</div>
              <div className="text-text-muted text-sm">Add your first position via the sidebar.</div>
            </div>
          ) : (
            <>
              <MetricsRow
                total_value={total_value}
                total_invested={total_invested}
                total_pnl={total_pnl}
                total_return={total_return}
              />

              <div className="flex gap-1 p-1 bg-bg-card border border-bg-border rounded-xl w-fit">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-bg-elevated text-text-primary shadow-sm'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-6 animate-slide-up">
                  <PortfolioTable positions={positions} onDelete={handleDelete} />
                  <AllocationChart positions={positions} />
                </div>
              )}
              {activeTab === 'history'      && <div className="animate-slide-up"><HistoryChart positions={positions} /></div>}
              {activeTab === 'benchmark'    && <div className="animate-slide-up"><BenchmarkChart positions={positions} /></div>}
              {activeTab === 'fundamentals' && <div className="animate-slide-up"><FundamentalsTable positions={positions} /></div>}
              {activeTab === 'risk'         && <RiskTab positions={positions} />}
            </>
          )}
        </main>

        <footer className="px-6 py-4 border-t border-bg-border text-xs text-text-muted flex items-center justify-between">
          <span>Portfolio Intelligence · Built by Dariush Tahajomi</span>
          <span>Data: Alpha Vantage · Yahoo Finance · Supabase</span>
        </footer>
      </div>
    </div>
  )
}
