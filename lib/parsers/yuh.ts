// Yuh Bank CSV export parser → normalised portfolio positions
// Format: semicolon-delimited, DD/MM/YYYY dates, triple-quoted strings

export interface YuhPosition {
  ticker:    string
  shares:    number
  buy_price: number
  buy_date:  string   // YYYY-MM-DD
  currency:  string
  fees:      number
}

export interface YuhParseResult {
  positions: YuhPosition[]
  skipped:   number
  error:     string
}

// Yuh's own reward coin — never a real investment position
const SKIP_TICKERS = new Set(['SWQ'])

function stripQuotes(val: string): string {
  return val.replace(/^"+|"+$/g, '').trim()
}

// DD/MM/YYYY → YYYY-MM-DD
function parseDateDMY(raw: string): string {
  const parts = raw.trim().split('/')
  if (parts.length !== 3) return raw
  const [d, m, y] = parts
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

// European decimal format uses commas in some locales — normalise to dot
function parseNum(raw: string): number {
  return parseFloat(raw.replace(',', '.'))
}

export function parseYuhCsv(text: string): YuhParseResult {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length < 2)
    return { positions: [], skipped: 0, error: 'File is empty or missing header.' }

  const headers = lines[0].split(';').map(stripQuotes)

  if (!headers.includes('ACTIVITY TYPE') || !headers.includes('BUY/SELL'))
    return { positions: [], skipped: 0, error: 'Not a valid Yuh export. Expected columns: ACTIVITY TYPE, BUY/SELL.' }

  // Column index map — safe against header reordering
  const col = (name: string) => headers.indexOf(name)
  const I = {
    date:     col('DATE'),
    debitCcy: col('DEBIT CURRENCY'),
    fees:     col('FEES/COMMISSION'),
    buySell:  col('BUY/SELL'),
    quantity: col('QUANTITY'),
    asset:    col('ASSET'),
    price:    col('PRICE PER UNIT'),
  }

  const positions: YuhPosition[] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map(stripQuotes)
    const get  = (idx: number) => cols[idx] ?? ''

    // Only process buy trades
    if (get(I.buySell) !== 'BUY') { skipped++; continue }

    const asset = get(I.asset).toUpperCase()
    if (!asset || SKIP_TICKERS.has(asset)) { skipped++; continue }

    const shares    = parseNum(get(I.quantity))
    const buy_price = parseNum(get(I.price))
    const dateRaw   = get(I.date)

    if (isNaN(shares) || isNaN(buy_price) || !dateRaw) { skipped++; continue }

    positions.push({
      ticker:    asset,
      shares,
      buy_price,
      buy_date:  parseDateDMY(dateRaw),
      currency:  get(I.debitCcy) || 'CHF',
      fees:      parseNum(get(I.fees)) || 0,
    })
  }

  return { positions, skipped, error: '' }
}
