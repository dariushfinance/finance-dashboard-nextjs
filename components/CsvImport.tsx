'use client'

import { useState, useRef } from 'react'

interface CsvRow {
  ticker:    string
  shares:    number
  buy_price: number
  buy_date:  string
  status:    'pending' | 'importing' | 'done' | 'error'
  message:   string
}

interface Props {
  portfolioName: string
  onDone: () => void
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

  // Detect header row (contains non-numeric first cell)
  const firstCells = parseLine(lines[0])
  const hasHeader = isNaN(Number(firstCells[1]))
  const dataLines = hasHeader ? lines.slice(1) : lines

  if (dataLines.length === 0) return { rows: [], error: 'No data rows found.' }

  const rows: CsvRow[] = []
  const errors: string[] = []

  for (let i = 0; i < dataLines.length; i++) {
    const cells = parseLine(dataLines[i])
    if (cells.length < 4) {
      errors.push(`Row ${i + 1}: needs 4 columns (ticker, shares, buy_price, buy_date)`)
      continue
    }

    const [ticker, sharesStr, priceStr, date] = cells
    const shares    = parseFloat(sharesStr)
    const buy_price = parseFloat(priceStr)

    if (!ticker)         { errors.push(`Row ${i + 1}: missing ticker`);    continue }
    if (isNaN(shares))   { errors.push(`Row ${i + 1}: invalid shares`);    continue }
    if (isNaN(buy_price)){ errors.push(`Row ${i + 1}: invalid buy_price`); continue }
    if (!date)           { errors.push(`Row ${i + 1}: missing buy_date`);  continue }

    rows.push({
      ticker:    ticker.toUpperCase().replace(/['"]/g, ''),
      shares,
      buy_price,
      buy_date:  date.replace(/['"]/g, ''),
      status:    'pending',
      message:   '',
    })
  }

  if (errors.length > 0 && rows.length === 0) {
    return { rows: [], error: errors.join('\n') }
  }

  return { rows, error: errors.join('\n') }
}

export default function CsvImport({ portfolioName, onDone }: Props) {
  const [rows, setRows]         = useState<CsvRow[]>([])
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
      const { rows: parsed, error } = parseCsv(text)
      setParseError(error)
      setRows(parsed)
      setDone(false)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!portfolioName) return
    setImporting(true)

    for (let i = 0; i < rows.length; i++) {
      // Skip already done/errored rows on re-import
      if (rows[i].status === 'done') continue

      setRows((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: 'importing' } : r))
      )

      try {
        const res = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id:   portfolioName,
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
        <pre className="text-xs text-text-muted font-mono leading-relaxed">{`ticker,shares,buy_price,buy_date
AAPL,10,150.00,2023-01-15
MSFT,5,280.00,2023-02-01`}</pre>
        <div className="text-xs text-text-muted mt-1.5">
          Header row optional · separators: , ; or tab
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

      {/* Preview table */}
      {rows.length > 0 && (
        <>
          <div className="text-xs text-text-muted font-medium">
            {rows.length} row{rows.length !== 1 ? 's' : ''} found
            {countDone > 0 && <span className="text-brand-green ml-2">· {countDone} imported</span>}
            {countError > 0 && <span className="text-brand-red ml-2">· {countError} failed</span>}
          </div>

          <div className="max-h-52 overflow-y-auto rounded-lg border border-bg-border">
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
                    <td className="px-2 py-1.5 text-text-primary font-semibold">{row.ticker}</td>
                    <td className="px-2 py-1.5 text-text-secondary text-right">{row.shares}</td>
                    <td className="px-2 py-1.5 text-text-secondary text-right">${row.buy_price}</td>
                    <td className="px-2 py-1.5 text-text-muted">{row.buy_date}</td>
                    <td className="px-2 py-1.5 text-center">
                      {row.status === 'pending'   && <span className="text-text-muted">·</span>}
                      {row.status === 'importing' && <span className="spinner scale-75 inline-block" />}
                      {row.status === 'done'      && <span className="text-brand-green">✓</span>}
                      {row.status === 'error'     && (
                        <span className="text-brand-red" title={row.message}>✗</span>
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
                ? `All ${countDone} positions imported successfully.`
                : `${countDone} imported · ${countError} failed — check error rows.`}
            </div>
          )}

          <div className="flex gap-2">
            {countPending > 0 && !done && (
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={handleImport}
                disabled={importing || !portfolioName}
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
              disabled={importing}
            >
              {done ? 'Import more' : 'Clear'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
