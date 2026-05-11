// ZKB (Zürcher Kantonalbank) Depotauszug CSV parser → normalised positions
// Format: semicolon-delimited, quoted fields, DD.MM.YYYY dates
// Encoding: Windows-1252 (read with latin1 in FileReader)
// Number format: apostrophe thousands + dot decimal ("21'859.24") or comma thousands ("1,689.23")

export interface ZkbPosition {
  isin:      string
  name:      string
  shares:    number
  buy_price: number  // Einstandskurs, in original currency
  buy_date:  string  // YYYY-MM-DD from Datum column (snapshot date, not actual trade date)
  currency:  string
  fees_chf:  number
}

export interface ZkbParseResult {
  positions: ZkbPosition[]
  skipped:   number
  error:     string
}

function stripQuotes(val: string): string {
  return val.replace(/^"+|"+$/g, '').trim()
}

// DD.MM.YYYY → YYYY-MM-DD
function parseDateDMY(raw: string): string {
  const parts = raw.trim().split('.')
  if (parts.length !== 3) return raw
  const [d, m, y] = parts
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

// ZKB uses apostrophe thousands ("21'859.24") and comma thousands ("1,689.23")
// Decimal is always a dot — strip both separators then parse
function parseNum(raw: string): number {
  return parseFloat(raw.replace(/[',\s]/g, ''))
}

// Normalise a header that may have mangled umlauts (Windows-1252 read as UTF-8)
// "W?hrung" variants → compare ASCII portions only for required columns
function normaliseHeader(h: string): string {
  return h
    .replace(/�+/g, '?')   // replacement chars → ?
    .trim()
}

export function parseZkbCsv(text: string): ZkbParseResult {
  const cleaned = text.replace(/^﻿/, '')   // strip BOM

  const lines = cleaned
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length < 2)
    return { positions: [], skipped: 0, error: 'File is empty or missing header.' }

  const rawHeaders = lines[0].split(';').map(stripQuotes)
  const headers    = rawHeaders.map(normaliseHeader)

  // Detect ZKB format by ASCII-safe required columns
  if (!headers.includes('ISIN') || !headers.includes('Einstandskurs'))
    return {
      positions: [],
      skipped:   0,
      error:     'Not a valid ZKB Depotauszug. Expected columns: ISIN, Einstandskurs.\n\nExport path: ZKB eBanking → Depot → Depotauszug → CSV herunterladen',
    }

  const col = (name: string) => headers.findIndex(h => h === name || h.startsWith(name.slice(0, 8)))
  const I = {
    name:     headers.indexOf('Bezeichnung'),
    isin:     headers.indexOf('ISIN'),
    shares:   col('Anz. Nom'),      // "Anz. Nom." — safe prefix match
    currency: headers.findIndex(h => h.startsWith('W') && h.includes('hrung')), // Währung with possible umlaut corruption
    date:     headers.indexOf('Datum'),
    fees:     headers.indexOf('Spesen CHF'),
    buyPrice: headers.indexOf('Einstandskurs'),
  }

  const positions: ZkbPosition[] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map(stripQuotes)
    const get  = (idx: number) => (idx >= 0 ? cols[idx] ?? '' : '')

    const isin = get(I.isin).toUpperCase()
    // Valid ISIN: 2 letters + 10 alphanumeric = 12 chars
    if (!isin || !/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) { skipped++; continue }

    const shares    = parseNum(get(I.shares))
    const buy_price = parseNum(get(I.buyPrice))
    const dateRaw   = get(I.date)

    if (!Number.isFinite(shares)    || shares    <= 0) { skipped++; continue }
    if (!Number.isFinite(buy_price) || buy_price <= 0) { skipped++; continue }

    positions.push({
      isin,
      name:     get(I.name),
      shares,
      buy_price,
      buy_date:  dateRaw ? parseDateDMY(dateRaw) : new Date().toISOString().split('T')[0],
      currency:  get(I.currency) || 'CHF',
      fees_chf:  parseNum(get(I.fees)) || 0,
    })
  }

  return { positions, skipped, error: '' }
}
