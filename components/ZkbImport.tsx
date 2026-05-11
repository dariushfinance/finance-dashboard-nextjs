'use client'

import { useState, useRef } from 'react'
import { parseZkbCsv } from '@/lib/parsers/zkb'
import type { ZkbPosition } from '@/lib/parsers/zkb'
import type { IsinResult } from '@/app/api/isin/route'

type RowStatus = 'resolving' | 'pending' | 'importing' | 'done' | 'error'

interface ZkbRow extends ZkbPosition {
  ticker:  string
  status:  RowStatus
  message: string
}

interface Props {
  onDone: () => void
}

export default function ZkbImport({ onDone }: Props) {
  const [rows, setRows]             = useState<ZkbRow[]>([])
  const [skipped, setSkipped]       = useState(0)
  const [parseError, setParseError] = useState('')
  const [resolving, setResolving]   = useState(false)
  const [importing, setImporting]   = useState(false)
  const [done, setDone]             = useState(false)
  const fileRef                     = useRef<HTMLInputElement>(null)

  const resolveIsins = async (parsed: ZkbRow[]): Promise<ZkbRow[]> => {
    setResolving(true)
    const resolved = [...parsed]

    await Promise.all(
      resolved.map(async (row, idx) => {
        try {
          const res  = await fetch(`/api/isin?isin=${encodeURIComponent(row.isin)}`)
          const data: IsinResult = await res.json()

          if (data.ticker) {
            resolved[idx] = { ...resolved[idx], ticker: data.ticker, status: 'pending', message: '' }
          } else {
            resolved[idx] = {
              ...resolved[idx],
              status:  'error',
              message: `ISIN ${row.isin} could not be resolved to a ticker`,
            }
          }
        } catch {
          resolved[idx] = { ...resolved[idx], status: 'error', message: 'Network error during ISIN lookup' }
        }
      })
    )

    setResolving(false)
    return resolved
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      // ZKB exports in Windows-1252; retry with UTF-8 if ISIN column not found
      reader.onload = (ev) => resolve(ev.target?.result as string)
      reader.readAsText(file, 'windows-1252')
    })

    const { positions, skipped: sk, error } = parseZkbCsv(text)

    if (error) {
      // Retry with UTF-8 in case this is a re-exported file
      const text2 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (ev) => resolve(ev.target?.result as string)
        reader.readAsText(file, 'utf-8')
      })
      const result2 = parseZkbCsv(text2)
      if (result2.error) {
        setParseError(result2.error)
        setRows([])
        setDone(false)
        return
      }
      const initialRows = result2.positions.map(p => ({ ...p, ticker: '', status: 'resolving' as RowStatus, message: '' }))
      setParseError('')
      setSkipped(result2.skipped)
      setRows(initialRows)
      setDone(false)
      const withTickers = await resolveIsins(initialRows)
      setRows(withTickers)
      return
    }

    setParseError('')
    setSkipped(sk)
    setDone(false)

    const initialRows: ZkbRow[] = positions.map(p => ({
      ...p,
      ticker:  '',
      status:  'resolving',
      message: '',
    }))
    setRows(initialRows)
    const withTickers = await resolveIsins(initialRows)
    setRows(withTickers)
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
        <div className="text-xs font-semibold text-text-secondary mb-1">ZKB Depotauszug</div>
        <pre className="text-xs text-text-muted font-mono leading-relaxed overflow-x-auto">
          {`"Bezeichnung";"ISIN";"Anz. Nom.";"Währung";"Datum";...`}
        </pre>
        <div className="text-xs text-text-muted mt-1.5">
          ZKB eBanking → Depot → Depotauszug → CSV · ISINs werden automatisch aufgelöst
        </div>
      </div>

      {/* File picker */}
      {rows.length === 0 && (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-bg-border rounded-xl p-5 text-center hover:border-brand-green/40 transition-colors">
            <div className="text-2xl mb-2">🏦</div>
            <div className="text-xs text-text-secondary font-medium">Click to upload ZKB CSV</div>
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

      {resolving && (
        <div className="flex items-center gap-2 text-xs text-brand-gold">
          <span className="spinner scale-75 inline-block flex-shrink-0" />
          Resolving ISINs to tickers…
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="text-xs text-text-muted font-medium">
            {rows.length} position{rows.length !== 1 ? 's' : ''}
            {skipped > 0 && <span className="ml-2">· {skipped} rows skipped</span>}
            {countDone  > 0 && <span className="text-brand-green ml-2">· {countDone} imported</span>}
            {countError > 0 && <span className="text-brand-red ml-2">· {countError} failed</span>}
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-bg-border">
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-bg-elevated">
                <tr>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Ticker</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">ISIN</th>
                  <th className="text-right px-2 py-1.5 text-text-muted font-medium">Shares</th>
                  <th className="text-right px-2 py-1.5 text-text-muted font-medium">Price</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Ccy</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Date</th>
                  <th className="text-center px-1 py-1.5 text-text-muted font-medium w-5"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-bg-border/50">
                    <td className="px-2 py-1.5 font-semibold text-text-primary">
                      {row.status === 'resolving'
                        ? <span className="flex items-center gap-1 text-text-muted">
                            <span className="spinner scale-50 inline-block" />
                            …
                          </span>
                        : row.ticker || <span className="text-brand-red">—</span>
                      }
                    </td>
                    <td className="px-2 py-1.5 text-text-muted">{row.isin.slice(0, 6)}…</td>
                    <td className="px-2 py-1.5 text-text-secondary text-right">{row.shares}</td>
                    <td className="px-2 py-1.5 text-text-secondary text-right">{row.buy_price.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-text-muted">{row.currency}</td>
                    <td className="px-2 py-1.5 text-text-muted whitespace-nowrap">{row.buy_date}</td>
                    <td className="px-1 py-1.5 text-center">
                      {row.status === 'resolving' && <span className="spinner scale-75 inline-block" />}
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
            {countPending > 0 && !done && !resolving && (
              <button type="button" className="btn-primary flex-1" onClick={handleImport} disabled={importing}>
                {importing
                  ? `Importing ${countDone + countError + 1}/${rows.length}…`
                  : `Import ${countPending} position${countPending !== 1 ? 's' : ''}`}
              </button>
            )}
            <button type="button" className="btn-ghost flex-1" onClick={reset} disabled={importing || resolving}>
              {done ? 'Import more' : 'Clear'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
