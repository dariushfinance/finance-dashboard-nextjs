'use client'

import { useState, useEffect } from 'react'
import StockSearch from './StockSearch'

interface Props {
  onAdded: () => void
  preFillTicker?: string
}

const SUPPORTED_CURRENCIES = ['USD', 'CHF', 'EUR', 'GBP', 'JPY', 'CAD', 'SGD', 'HKD', 'AUD'] as const
type InputCurrency = typeof SUPPORTED_CURRENCIES[number]

export default function AddPositionForm({ onAdded, preFillTicker = '' }: Props) {
  const [ticker, setTicker]     = useState(preFillTicker)
  const [shares, setShares]     = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [currency, setCurrency] = useState<InputCurrency>('USD')
  const [buyDate, setBuyDate]   = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [fxRates, setFxRates]   = useState<Record<string, number>>({ USD: 1 })

  useEffect(() => {
    fetch('/api/fx')
      .then(r => r.json())
      .then(d => { if (d.rates) setFxRates(d.rates) })
      .catch(() => {})
  }, [])

  // Convert local-currency price → USD for storage
  const toUsd = (localPrice: number): number =>
    currency === 'USD' ? localPrice : localPrice / (fxRates[currency] ?? 1)

  const usdPreview = buyPrice && currency !== 'USD'
    ? toUsd(parseFloat(buyPrice))
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker || !shares || !buyPrice || !buyDate) { setError('All fields required.'); return }

    setLoading(true)
    setError('')
    setSuccess('')

    const usdPrice = toUsd(parseFloat(buyPrice))

    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker:    ticker.toUpperCase(),
          shares:    parseFloat(shares),
          buy_price: usdPrice,
          buy_date:  buyDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to add position')
      } else {
        setSuccess(`${ticker.toUpperCase()} added`)
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
        <label className="text-xs text-text-muted block mb-1">Stock</label>
        <StockSearch
          value={ticker}
          onChange={setTicker}
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
        <label className="text-xs text-text-muted block mb-1">Buy Price</label>
        <div className="flex gap-2">
          <select
            className="fin-input w-24 flex-shrink-0"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as InputCurrency)}
            disabled={loading}
          >
            {SUPPORTED_CURRENCIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            className="fin-input flex-1"
            type="number"
            placeholder="150.00"
            min="0.01"
            step="any"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            disabled={loading}
          />
        </div>
        {usdPreview != null && (
          <div className="text-xs text-text-muted mt-1">
            ≈ ${usdPreview.toFixed(2)} USD stored
          </div>
        )}
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

      {error   && <div className="text-xs text-brand-red">{error}</div>}
      {success && <div className="text-xs text-brand-green">{success} ✓</div>}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <span className="spinner mx-auto block" /> : 'Add Position'}
      </button>
    </form>
  )
}
