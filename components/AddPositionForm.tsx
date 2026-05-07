'use client'

import { useState, useEffect, useCallback } from 'react'
import StockSearch from './StockSearch'

interface Props {
  onAdded: () => void
  preFillTicker?: string
}

const SUPPORTED_CURRENCIES = ['USD', 'CHF', 'EUR', 'GBP', 'JPY', 'CAD', 'SGD', 'HKD', 'AUD'] as const
type InputCurrency = typeof SUPPORTED_CURRENCIES[number]
type Mode = 'shares' | 'amount'

export default function AddPositionForm({ onAdded, preFillTicker = '' }: Props) {
  const [mode, setMode]         = useState<Mode>('shares')
  const [ticker, setTicker]     = useState(preFillTicker)
  const [shares, setShares]     = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [amount, setAmount]     = useState('')
  const [currency, setCurrency] = useState<InputCurrency>('CHF')
  const [buyDate, setBuyDate]   = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [fxRates, setFxRates]   = useState<Record<string, number>>({ USD: 1 })

  // Amount-mode: resolved historical price + calculated shares
  const [resolving, setResolving]         = useState(false)
  const [resolvedPrice, setResolvedPrice] = useState<number | null>(null)
  const [resolvedDate, setResolvedDate]   = useState<string | null>(null)
  const [calcShares, setCalcShares]       = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/fx')
      .then(r => r.json())
      .then(d => { if (d.rates) setFxRates(d.rates) })
      .catch(() => {})
  }, [])

  const toUsd = (localAmount: number): number =>
    currency === 'USD' ? localAmount : localAmount / (fxRates[currency] ?? 1)

  // Fetch historical price whenever ticker + date are both set (amount mode only)
  const resolveHistoricalPrice = useCallback(async (sym: string, date: string) => {
    if (!sym || !date) { setResolvedPrice(null); setCalcShares(null); return }
    setResolving(true)
    try {
      const res = await fetch(`/api/prices?ticker=${encodeURIComponent(sym.toUpperCase())}&date=${date}`)
      if (!res.ok) { setResolvedPrice(null); setCalcShares(null); return }
      const data = await res.json()
      setResolvedPrice(data.price)
      setResolvedDate(data.date)
    } catch {
      setResolvedPrice(null)
      setCalcShares(null)
    } finally {
      setResolving(false)
    }
  }, [])

  // Recalculate shares whenever amount, price, or currency change
  useEffect(() => {
    if (mode !== 'amount' || !resolvedPrice || !amount) { setCalcShares(null); return }
    const amountUsd = toUsd(parseFloat(amount))
    setCalcShares(amountUsd / resolvedPrice)
  }, [amount, currency, resolvedPrice, fxRates, mode])

  // Re-resolve price when ticker or date changes in amount mode
  useEffect(() => {
    if (mode === 'amount' && ticker && buyDate) {
      resolveHistoricalPrice(ticker, buyDate)
    }
  }, [ticker, buyDate, mode, resolveHistoricalPrice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const finalShares    = mode === 'shares' ? parseFloat(shares) : calcShares
    const finalBuyPrice  = mode === 'shares' ? toUsd(parseFloat(buyPrice)) : resolvedPrice

    if (!ticker) { setError('Ticker required.'); return }
    if (!finalShares || finalShares <= 0) { setError(mode === 'amount' ? 'Enter an amount and wait for price to resolve.' : 'Shares required.'); return }
    if (!finalBuyPrice || finalBuyPrice <= 0) { setError('Buy price required.'); return }
    if (!buyDate) { setError('Date required.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker:    ticker.toUpperCase(),
          shares:    finalShares,
          buy_price: finalBuyPrice,
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
        setAmount('')
        setResolvedPrice(null)
        setCalcShares(null)
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

      {/* Mode toggle */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: 'var(--ink-1)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: 3,
      }}>
        {(['shares', 'amount'] as Mode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError('') }}
            style={{
              flex: 1,
              padding: '5px 0',
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: mode === m ? 'var(--bg)' : 'transparent',
              color: mode === m ? 'var(--ink)' : 'var(--ink-4)',
              boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.15s',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {m === 'shares' ? 'By shares' : 'By amount'}
          </button>
        ))}
      </div>

      {/* Ticker */}
      <div>
        <label className="text-xs text-text-muted block mb-1">Stock / ETF</label>
        <StockSearch value={ticker} onChange={setTicker} disabled={loading} />
      </div>

      {/* Date — shown first in amount mode so price auto-resolves early */}
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

      {/* ── Shares mode ── */}
      {mode === 'shares' && (
        <>
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
            <div className="flex flex-col gap-2">
              <select
                className="fin-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as InputCurrency)}
                disabled={loading}
              >
                {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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
            {buyPrice && currency !== 'USD' && (
              <div className="text-xs text-text-muted mt-1">
                ≈ ${toUsd(parseFloat(buyPrice)).toFixed(2)} USD stored
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Amount mode ── */}
      {mode === 'amount' && (
        <div>
          <label className="text-xs text-text-muted block mb-1">Investment Amount</label>
          <div className="flex flex-col gap-2">
            <select
              className="fin-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as InputCurrency)}
              disabled={loading}
            >
              {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              className="fin-input"
              type="number"
              placeholder="500.00"
              min="0.01"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Resolution preview */}
          <div style={{
            marginTop: 8,
            padding: '8px 10px',
            borderRadius: 6,
            background: 'var(--ink-1)',
            border: '1px solid var(--line-soft)',
            fontSize: 11.5,
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-3)',
            minHeight: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            {resolving && <><span className="spinner" style={{ width: 10, height: 10 }} /> Fetching price…</>}
            {!resolving && !resolvedPrice && ticker && (
              <span style={{ color: 'var(--ink-4)' }}>Enter ticker and date to resolve price</span>
            )}
            {!resolving && resolvedPrice && !amount && (
              <span>
                {resolvedDate} · ${resolvedPrice.toFixed(2)} per share
              </span>
            )}
            {!resolving && resolvedPrice && amount && calcShares && (
              <span style={{ color: 'var(--ink)' }}>
                {resolvedDate} · ${resolvedPrice.toFixed(2)}/share
                <span style={{ color: 'var(--pos)', marginLeft: 8 }}>
                  → {calcShares.toFixed(4)} shares
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {error   && <div className="text-xs text-brand-red">{error}</div>}
      {success && <div className="text-xs text-brand-green">{success} ✓</div>}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={loading || (mode === 'amount' && (!calcShares || resolving))}
      >
        {loading ? <span className="spinner mx-auto block" /> : 'Add Position'}
      </button>
    </form>
  )
}
