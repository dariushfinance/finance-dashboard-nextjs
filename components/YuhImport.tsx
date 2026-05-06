'use client'

import { useState, useRef } from 'react'
import { parseYuhCsv } from '@/lib/parsers/yuh'
import type { YuhPosition } from '@/lib/parsers/yuh'

type RowStatus = 'pending' | 'importing' | 'done' | 'error'

interface YuhRow extends YuhPosition {
  status:  RowStatus
  message: string
}

interface Props {
  onDone: () => void
}

export default function YuhImport({ onDone }: Props) {
  const [rows, setRows]             = useState<YuhRow[]>([])
  const [skipped, setSkipped]       = useState(0)
  const [parseError, setParseError] = useState('')
  const [importing, setImporting]   = useState(false)
  const [done, setDone]             = useState(false)
  const fileRef                     = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { positions, skipped: sk, error } = parseYuhCsv(text)
      setParseError(error)
      setSkipped(sk)
      setRows(positions.map(p => ({ ...p, status: 'pending', message: '' })))
      setDone(false)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleImport = async () => {
    setImporting(true)

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status === 'done' || rows[i].status === 'error') continue

      setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'importing' } : r))

      try {
        const res = await fetch('/api/portfolio', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            ticker:    rows[i].ticker,
            shares:    rows[i].shares,
            buy_price: rows[i].buy_price,
            buy_date:  rows[i].buy_date,
          }),
        })
        const data = await res.json()
        setRows(prev => prev.map((r, idx) =>
          idx === i
            ? { ...r, status: res.ok ? 'done' : 'error', message: res.ok ? '' : (data.error ?? 'Failed') }
            : r
        ))
      } catch {
        setRows(prev => prev.map((r, idx) =>
          idx === i ? { ...r, status: 'error', message: 'Network error' } : r
        ))
      }
    }

    setImporting(false)
    setDone(true)
    onDone()
  }

  const reset = () => {
    setRows([])
    setParseError('')
    setSkipped(0)
    setDone(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const countDone    = rows.filter(r => r.status === 'done').length
  const countError   = rows.filter(r => r.status === 'error').length
  const countPending = rows.filter(r => r.status === 'pending' || r.status === 'importing').length

  return (
    <div className="space-y-3">
      {/* Format hint */}
      <div className="bg-bg-elevated rounded-lg p-3">
        <div className="text-xs font-semibold text-text-secondary mb-1">Yuh Bank CSV export</div>
        <pre className="text-xs text-text-muted font-mono leading-relaxed overflow-x-auto">
          {`DATE;ACTIVITY TYPE;...;BUY/SELL;QUANTITY;ASSET;PRICE PER UNIT`}
        </pre>
        <div className="text-xs text-text-muted mt-1.5">
          Yuh app → Aktivitäten → Export · Only BUY trades are imported · SWQ rewards skipped
        </div>
      </div>

      {/* File picker */}
      {rows.length === 0 && (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-bg-border rounded-xl p-5 text-center hover:border-brand-green/40 transition-colors">
            <div className="text-2xl mb-2">🏦</div>
            <div className="text-xs text-text-secondary font-medium">Click to upload Yuh CSV</div>
            <div className="text-xs text-text-muted mt-1">.csv</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleFile}
          />
        </label>
      )}

      {parseError && (
        <div className="text-xs text-brand-red bg-brand-red/10 border border-brand-red/20 rounded-lg p-3 whitespace-pre-wrap">
          {parseError}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="text-xs text-text-muted font-medium">
            {rows.length} BUY position{rows.length !== 1 ? 's' : ''}
            {skipped > 0 && <span className="text-text-muted ml-2">· {skipped} non-trade rows skipped</span>}
            {countDone  > 0 && <span className="text-brand-green ml-2">· {countDone} imported</span>}
            {countError > 0 && <span className="text-brand-red ml-2">· {countError} failed</span>}
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-bg-border">
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-bg-elevated">
                <tr>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Ticker</th>
                  <th className="text-right px-2 py-1.5 text-text-muted font-medium">Shares</th>
                  <th className="text-right px-2 py-1.5 text-text-muted font-medium">Price</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Ccy</th>
                  <th className="text-right px-2 py-1.5 text-text-muted font-medium">Fees</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Date</th>
                  <th className="text-center px-1 py-1.5 text-text-muted font-medium w-5"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-bg-border/50">
                    <td className="px-2 py-1.5 font-semibold text-text-primary">{row.ticker}</td>
                    <td className="px-2 py-1.5 text-text-secondary text-right">{row.shares}</td>
                    <td className="px-2 py-1.5 text-text-secondary text-right">{row.buy_price}</td>
                    <td className="px-2 py-1.5 text-text-muted">{row.currency}</td>
                    <td className="px-2 py-1.5 text-text-muted text-right">{row.fees > 0 ? row.fees : '—'}</td>
                    <td className="px-2 py-1.5 text-text-muted whitespace-nowrap">{row.buy_date}</td>
                    <td className="px-1 py-1.5 text-center">
                      {row.status === 'pending'   && <span className="text-text-muted">·</span>}
                      {row.status === 'importing' && <span className="spinner scale-75 inline-block" />}
                      {row.status === 'done'      && <span className="text-brand-green">✓</span>}
                      {row.status === 'error'     && <span className="text-brand-red cursor-help" title={row.message}>✗</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importing && (
            <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green transition-all duration-300 rounded-full"
                style={{ width: `${((countDone + countError) / rows.length) * 100}%` }}
              />
            </div>
          )}

          {done && (
            <div className={`text-xs rounded-lg p-3 ${
              countError === 0
                ? 'bg-brand-green/10 border border-brand-green/20 text-brand-green'
                : 'bg-brand-gold/10 border border-brand-gold/20 text-brand-gold'
            }`}>
              {countError === 0
                ? `All ${countDone} positions imported.`
                : `${countDone} imported · ${countError} failed — hover ✗ for details.`}
            </div>
          )}

          <div className="flex gap-2">
            {countPending > 0 && !done && (
              <button type="button" className="btn-primary flex-1" onClick={handleImport} disabled={importing}>
                {importing
                  ? `Importing ${countDone + countError + 1}/${rows.length}…`
                  : `Import ${countPending} position${countPending !== 1 ? 's' : ''}`}
              </button>
            )}
            <button type="button" className="btn-ghost flex-1" onClick={reset} disabled={importing}>
              {done ? 'Import more' : 'Clear'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
