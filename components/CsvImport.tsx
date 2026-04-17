'use client'

import { useState, useRef } from 'react'
import type { IsinResult } from '@/app/api/isin/route'

interface CsvRow {
  ticker:      string
  originalId:  string       // original value from CSV (may be ISIN or ticker)
  isIsin:      boolean
  resolvedFrom: string | null // exchange the ticker was resolved from
  shares:      number
  buy_price:   number
  buy_date:    string
  status:      'pending' | 'resolving' | 'importing' | 'done' | 'error'
  message:     string
}

interface Props {
  onDone: () => void
}

// ISIN: 2-letter country code + 10 alphanumeric chars, total 12
function detectIsin(s: string): boolean {
  return /^[A-Z]{2}[A-Z0-9]{10}$/.test(s.toUpperCase())
}

// Parse one CSV/TSV line, handling quoted fields
function parseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseCsv(text: string): { rows: CsvRow[]; error: string } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) return { rows: [], error: 'File is empty.' }

  const firstCells = parseLine(lines[0])
  const hasHeader  = isNaN(Number(firstCells[1]))
  const dataLines  = hasHeader ? lines.slice(1) : lines

  if (dataLines.length === 0) return { rows: [], error: 'No data rows found.' }

  const rows: CsvRow[] = []
  const errors: string[] = []

  for (let i = 0; i < dataLines.length; i++) {
    const cells = parseLine(dataLines[i])
    if (cells.length < 4) {
      errors.push(`Row ${i + 1}: needs 4 columns (ticker/ISIN, shares, buy_price, buy_date)`)
      continue
    }

    const [rawId, sharesStr, priceStr, date] = cells
    const id        = rawId.replace(/['"]/g, '').toUpperCase()
    const shares    = parseFloat(sharesStr)
    const buy_price = parseFloat(priceStr.replace(/[$,]/g, ''))

    if (!id)             { errors.push(`Row ${i + 1}: missing ticker/ISIN`);  continue }
    if (isNaN(shares))   { errors.push(`Row ${i + 1}: invalid shares`);       continue }
    if (isNaN(buy_price)){ errors.push(`Row ${i + 1}: invalid buy_price`);    continue }
    if (!date)           { errors.push(`Row ${i + 1}: missing buy_date`);     continue }

    const isIsin = detectIsin(id)
    rows.push({
      ticker:       isIsin ? '' : id,
      originalId:   id,
      isIsin,
      resolvedFrom: null,
      shares,
      buy_price,
      buy_date:     date.replace(/['"]/g, ''),
      status:       isIsin ? 'resolving' : 'pending',
      message:      '',
    })
  }

  if (errors.length > 0 && rows.length === 0) {
    return { rows: [], error: errors.join('\n') }
  }

  return { rows, error: errors.join('\n') }
}

export default function CsvImport({ onDone }: Props) {
  const [rows, setRows]             = useState<CsvRow[]>([])
  const [parseError, setParseError] = useState('')
  const [resolving, setResolving]   = useState(false)
  const [importing, setImporting]   = useState(false)
  const [done, setDone]             = useState(false)
  const fileRef                     = useRef<HTMLInputElement>(null)

  // After parsing, resolve any ISIN rows → ticker
  const resolveIsins = async (parsed: CsvRow[]) => {
    const isinIndexes = parsed
      .map((r, i) => (r.isIsin ? i : -1))
      .filter((i) => i >= 0)

    if (isinIndexes.length === 0) return parsed

    setResolving(true)
    const resolved = [...parsed]

    await Promise.all(
      isinIndexes.map(async (idx) => {
        const isin = resolved[idx].originalId
        try {
          const res  = await fetch(`/api/isin?isin=${encodeURIComponent(isin)}`)
          const data: IsinResult = await res.json()

          if (data.ticker) {
            resolved[idx] = {
              ...resolved[idx],
              ticker:       data.ticker,
              resolvedFrom: data.options[0]?.exchange ?? null,
              status:       'pending',
              message:      '',
            }
          } else {
            resolved[idx] = {
              ...resolved[idx],
              status:  'error',
              message: `ISIN ${isin} could not be resolved to a ticker`,
            }
          }
        } catch {
          resolved[idx] = {
            ...resolved[idx],
            status:  'error',
            message: 'Network error during ISIN lookup',
          }
        }
      })
    )

    setResolving(false)
    return resolved
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const { rows: parsed, error } = parseCsv(text)
      setParseError(error)
      setDone(false)

      if (parsed.length > 0) {
        setRows(parsed)               // show immediately (ISINs show "resolving")
        const withTickers = await resolveIsins(parsed)
        setRows(withTickers)          // update with resolved tickers
      } else {
        setRows(parsed)
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status === 'done' || rows[i].status === 'error') continue

      setRows((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: 'importing' } : r))
      )

      try {
        const res = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker:    rows[i].ticker,
            shares:    rows[i].shares,
            buy_price: rows[i].buy_price,
            buy_date:  rows[i].buy_date,
          }),
        })
        const data = await res.json()
        setRows((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: res.ok ? 'done' : 'error', message: res.ok ? '' : (data.error ?? 'Failed') }
              : r
          )
        )
      } catch {
        setRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: 'error', message: 'Network error' } : r))
        )
      }
    }

    setImporting(false)
    setDone(true)
    onDone()
  }

  const countDone    = rows.filter((r) => r.status === 'done').length
  const countError   = rows.filter((r) => r.status === 'error').length
  const countPending = rows.filter((r) => r.status === 'pending' || r.status === 'importing').length

  const reset = () => {
    setRows([])
    setParseError('')
    setDone(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      {/* Format hint */}
      <div className="bg-bg-elevated rounded-lg p-3">
        <div className="text-xs font-semibold text-text-secondary mb-1">Expected CSV format</div>
        <pre className="text-xs text-text-muted font-mono leading-relaxed">{`ticker/ISIN,shares,buy_price,buy_date
AAPL,10,150.00,2023-01-15
IE00B4L5Y983,1245,135.37,2026-02-16`}</pre>
        <div className="text-xs text-text-muted mt-1.5">
          ISINs are auto-resolved to tickers · header optional · , ; or tab
        </div>
      </div>

      {/* File picker */}
      {rows.length === 0 && (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-bg-border rounded-xl p-5 text-center hover:border-brand-green/40 transition-colors">
            <div className="text-2xl mb-2">📂</div>
            <div className="text-xs text-text-secondary font-medium">Click to upload CSV</div>
            <div className="text-xs text-text-muted mt-1">.csv · .txt · .tsv</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.tsv"
            className="hidden"
            onChange={handleFile}
          />
        </label>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="text-xs text-brand-red bg-brand-red/10 border border-brand-red/20 rounded-lg p-3 whitespace-pre-wrap">
          {parseError}
        </div>
      )}

      {/* Resolving ISINs indicator */}
      {resolving && (
        <div className="flex items-center gap-2 text-xs text-brand-gold">
          <span className="spinner scale-75 inline-block flex-shrink-0" />
          Resolving ISIN codes to tickers…
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <>
          <div className="text-xs text-text-muted font-medium">
            {rows.length} row{rows.length !== 1 ? 's' : ''}
            {rows.some((r) => r.isIsin) && (
              <span className="text-brand-blue ml-2">
                · {rows.filter((r) => r.isIsin).length} ISIN{rows.filter((r) => r.isIsin).length !== 1 ? 's' : ''} detected
              </span>
            )}
            {countDone  > 0 && <span className="text-brand-green ml-2">· {countDone} imported</span>}
            {countError > 0 && <span className="text-brand-red ml-2">· {countError} failed</span>}
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-bg-border">
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-bg-elevated">
                <tr>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Ticker</th>
                  <th className="text-right px-2 py-1.5 text-text-muted font-medium">Shares</th>
                  <th className="text-right px-2 py-1.5 text-text-muted font-medium">Price</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Date</th>
                  <th className="text-center px-2 py-1.5 text-text-muted font-medium w-6"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-bg-border/50">
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-semibold ${
                          row.status === 'resolving' ? 'text-text-muted' : 'text-text-primary'
                        }`}>
                          {row.status === 'resolving'
                            ? <span className="flex items-center gap-1"><span className="spinner scale-50 inline-block" />{row.originalId}</span>
                            : (row.ticker || row.originalId)
                          }
                        </span>
                        {row.isIsin && row.ticker && (
                          <span className="text-brand-blue text-xs" title={`Resolved from ISIN: ${row.originalId}`}>
                            ISIN {row.originalId.slice(0, 6)}…
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-text-secondary text-right">{row.shares}</td>
                    <td className="px-2 py-1.5 text-text-secondary text-right">${row.buy_price}</td>
                    <td className="px-2 py-1.5 text-text-muted">{row.buy_date}</td>
                    <td className="px-2 py-1.5 text-center">
                      {row.status === 'pending'   && <span className="text-text-muted">·</span>}
                      {row.status === 'resolving' && <span className="spinner scale-75 inline-block" />}
                      {row.status === 'importing' && <span className="spinner scale-75 inline-block" />}
                      {row.status === 'done'      && <span className="text-brand-green">✓</span>}
                      {row.status === 'error'     && (
                        <span className="text-brand-red cursor-help" title={row.message}>✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Progress bar */}
          {importing && (
            <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green transition-all duration-300 rounded-full"
                style={{ width: `${((countDone + countError) / rows.length) * 100}%` }}
              />
            </div>
          )}

          {/* Done summary */}
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
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={handleImport}
                disabled={importing}
              >
                {importing
                  ? `Importing ${countDone + countError + 1}/${rows.length}…`
                  : `Import ${countPending} position${countPending !== 1 ? 's' : ''}`}
              </button>
            )}
            <button
              type="button"
              className="btn-ghost flex-1"
              onClick={reset}
              disabled={importing || resolving}
            >
              {done ? 'Import more' : 'Clear'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
