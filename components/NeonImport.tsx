'use client'

import { useState, useRef } from 'react'

export interface NeonRow {
  date:            string
  amount:          string
  original_amount: string
  exchange_rate:   string
  description:     string
  subject:         string
  category:        string
  tags:            string
  wise:            string
  spaces:          string
  status:          'pending' | 'importing' | 'done' | 'error'
  message:         string
}

interface Props {
  onDone: () => void
}

// Case-insensitive, whitespace-tolerant column name normaliser
const COL_MAP: Record<string, keyof Omit<NeonRow, 'status' | 'message'>> = {
  'date':            'date',
  'amount':          'amount',
  'original amount': 'original_amount',
  'originalamount':  'original_amount',
  'exchange rate':   'exchange_rate',
  'exchangerate':    'exchange_rate',
  'description':     'description',
  'subject':         'subject',
  'category':        'category',
  'tags':            'tags',
  'wise':            'wise',
  'spaces':          'spaces',
}

function normalise(header: string): keyof Omit<NeonRow, 'status' | 'message'> | null {
  const key = header.toLowerCase().replace(/\s+/g, ' ').trim()
  return COL_MAP[key] ?? null
}

function parseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes }
    else if ((char === ',' || char === ';') && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += char }
  }
  result.push(current.trim())
  return result
}

function parseNeonCsv(text: string): { rows: NeonRow[]; error: string } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length < 2) return { rows: [], error: 'File is empty or missing header.' }

  const headers = parseLine(lines[0]).map(h => h.replace(/['"]/g, ''))
  const colIndex: Partial<Record<keyof Omit<NeonRow, 'status' | 'message'>, number>> = {}

  headers.forEach((h, i) => {
    const mapped = normalise(h)
    if (mapped) colIndex[mapped] = i
  })

  const required: Array<keyof Omit<NeonRow, 'status' | 'message'>> = ['date', 'amount']
  const missing = required.filter(r => colIndex[r] === undefined)
  if (missing.length) {
    return { rows: [], error: `Missing required columns: ${missing.join(', ')}. Found: ${headers.join(', ')}` }
  }

  const rows: NeonRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i])
    const get = (col: keyof Omit<NeonRow, 'status' | 'message'>): string => {
      const idx = colIndex[col]
      return idx !== undefined ? (cells[idx] ?? '').replace(/^["']|["']$/g, '').trim() : ''
    }
    rows.push({
      date:            get('date'),
      amount:          get('amount'),
      original_amount: get('original_amount'),
      exchange_rate:   get('exchange_rate'),
      description:     get('description'),
      subject:         get('subject'),
      category:        get('category'),
      tags:            get('tags'),
      wise:            get('wise'),
      spaces:          get('spaces'),
      status:          'pending',
      message:         '',
    })
  }

  return { rows, error: '' }
}

export default function NeonImport({ onDone }: Props) {
  const [rows, setRows]             = useState<NeonRow[]>([])
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
      const { rows: parsed, error } = parseNeonCsv(text)
      setParseError(error)
      setRows(parsed)
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
        const res = await fetch('/api/neon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rows[i]),
        })
        const data = await res.json()
        setRows(prev => prev.map((r, idx) =>
          idx === i ? { ...r, status: res.ok ? 'done' : 'error', message: res.ok ? '' : (data.error ?? 'Failed') } : r
        ))
      } catch {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: 'Network error' } : r))
      }
    }
    setImporting(false)
    setDone(true)
    onDone()
  }

  const reset = () => {
    setRows([])
    setParseError('')
    setDone(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const countDone    = rows.filter(r => r.status === 'done').length
  const countError   = rows.filter(r => r.status === 'error').length
  const countPending = rows.filter(r => r.status === 'pending' || r.status === 'importing').length

  const amountColor = (amt: string) => {
    const n = parseFloat(amt.replace(/[^0-9.-]/g, ''))
    if (isNaN(n)) return ''
    return n < 0 ? 'neg' : n > 0 ? 'pos' : ''
  }

  return (
    <div className="space-y-3">
      {/* Format hint */}
      <div className="bg-bg-elevated rounded-lg p-3">
        <div className="text-xs font-semibold text-text-secondary mb-1">Neon Bank CSV export</div>
        <pre className="text-xs text-text-muted font-mono leading-relaxed overflow-x-auto">{`Date,Amount,Original amount,Exchange rate,Description,Subject,Category,Tags,Wise,Spaces`}</pre>
        <div className="text-xs text-text-muted mt-1.5">
          Export from Neon app → Settings → Export data · UTF-8 CSV
        </div>
      </div>

      {/* File picker */}
      {rows.length === 0 && (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-bg-border rounded-xl p-5 text-center hover:border-brand-green/40 transition-colors">
            <div className="text-2xl mb-2">🏦</div>
            <div className="text-xs text-text-secondary font-medium">Click to upload Neon CSV</div>
            <div className="text-xs text-text-muted mt-1">.csv</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
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
            {rows.length} transaction{rows.length !== 1 ? 's' : ''}
            {countDone  > 0 && <span className="text-brand-green ml-2">· {countDone} imported</span>}
            {countError > 0 && <span className="text-brand-red ml-2">· {countError} failed</span>}
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-bg-border">
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-bg-elevated">
                <tr>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium whitespace-nowrap">Date</th>
                  <th className="text-right px-2 py-1.5 text-text-muted font-medium">Amount</th>
                  <th className="text-right px-2 py-1.5 text-text-muted font-medium whitespace-nowrap">Orig.</th>
                  <th className="text-right px-2 py-1.5 text-text-muted font-medium">FX</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Description</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Subject</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Category</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Tags</th>
                  <th className="text-center px-2 py-1.5 text-text-muted font-medium">Wise</th>
                  <th className="text-left px-2 py-1.5 text-text-muted font-medium">Spaces</th>
                  <th className="text-center px-1 py-1.5 text-text-muted font-medium w-5"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-bg-border/50">
                    <td className="px-2 py-1.5 text-text-muted whitespace-nowrap">{row.date}</td>
                    <td className={`px-2 py-1.5 text-right ${amountColor(row.amount)}`}>{row.amount}</td>
                    <td className="px-2 py-1.5 text-right text-text-muted">{row.original_amount || '—'}</td>
                    <td className="px-2 py-1.5 text-right text-text-muted">{row.exchange_rate || '—'}</td>
                    <td className="px-2 py-1.5 text-text-secondary max-w-[120px] truncate" title={row.description}>{row.description || '—'}</td>
                    <td className="px-2 py-1.5 text-text-secondary max-w-[100px] truncate" title={row.subject}>{row.subject || '—'}</td>
                    <td className="px-2 py-1.5 text-text-muted max-w-[90px] truncate" title={row.category}>{row.category || '—'}</td>
                    <td className="px-2 py-1.5 text-text-muted">{row.tags || '—'}</td>
                    <td className="px-2 py-1.5 text-center text-text-muted">{row.wise === 'True' || row.wise === 'true' ? '✓' : '—'}</td>
                    <td className="px-2 py-1.5 text-text-muted">{row.spaces || '—'}</td>
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
                ? `All ${countDone} transactions imported.`
                : `${countDone} imported · ${countError} failed — hover ✗ for details.`}
            </div>
          )}

          <div className="flex gap-2">
            {countPending > 0 && !done && (
              <button type="button" className="btn-primary flex-1" onClick={handleImport} disabled={importing}>
                {importing
                  ? `Importing ${countDone + countError + 1}/${rows.length}…`
                  : `Import ${countPending} transaction${countPending !== 1 ? 's' : ''}`}
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
