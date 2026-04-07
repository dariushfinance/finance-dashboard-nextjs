'use client'

import { useState } from 'react'

interface Props {
  portfolioName: string
  onAdded: () => void
}

export default function AddPositionForm({ portfolioName, onAdded }: Props) {
  const [ticker, setTicker] = useState('')
  const [shares, setShares] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!portfolioName) { setError('Enter a portfolio name first.'); return }
    if (!ticker || !shares || !buyPrice || !buyDate) { setError('All fields required.'); return }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: portfolioName,
          ticker: ticker.toUpperCase(),
          shares: parseFloat(shares),
          buy_price: parseFloat(buyPrice),
          buy_date: buyDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to add position')
      } else {
        setSuccess(`${ticker.toUpperCase()} added ✓`)
        setTicker('')
        setShares('')
        setBuyPrice('')
        onAdded()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-text-muted block mb-1">Ticker</label>
        <input
          className="fin-input uppercase"
          placeholder="AAPL"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          disabled={loading}
        />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Shares</label>
        <input
          className="fin-input"
          type="number"
          placeholder="10"
          min="0.001"
          step="any"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Buy Price ($)</label>
        <input
          className="fin-input"
          type="number"
          placeholder="150.00"
          min="0.01"
          step="any"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Buy Date</label>
        <input
          className="fin-input"
          type="date"
          value={buyDate}
          onChange={(e) => setBuyDate(e.target.value)}
          disabled={loading}
        />
      </div>

      {error && <div className="text-xs text-brand-red">{error}</div>}
      {success && <div className="text-xs text-brand-green">{success}</div>}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <span className="spinner mx-auto block" /> : 'Add Position'}
      </button>
    </form>
  )
}
