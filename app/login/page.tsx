'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [tab, setTab]           = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [message, setMessage]   = useState('')
  const router  = useRouter()
  const supabase = createBrowserSupabase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (tab === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email to confirm your account, then sign in.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-bg-base font-bold">P</div>
          <div>
            <div className="font-semibold text-text-primary">Portfolio Intelligence</div>
            <div className="text-xs text-text-muted">Professional finance analytics</div>
          </div>
        </div>

        {/* Card */}
        <div className="fin-card space-y-5">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-bg-elevated border border-bg-border rounded-lg">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(''); setMessage('') }}
                className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all ${
                  tab === t
                    ? 'bg-bg-card text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Email</label>
              <input
                className="fin-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Password</label>
              <input
                className="fin-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {error   && <div className="text-xs text-brand-red">{error}</div>}
            {message && <div className="text-xs text-brand-green">{message}</div>}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading
                ? <span className="spinner mx-auto block" />
                : tab === 'signin' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted">
          Portfolio Intelligence · Built by Dariush Tahajomi
        </p>
      </div>
    </div>
  )
}
