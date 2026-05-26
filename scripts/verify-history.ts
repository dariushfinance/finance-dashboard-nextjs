/* eslint-disable no-console */
//
// Verifies the Portfolio Value History fix against REAL data:
//   - pulls every user's actual positions from Supabase (service role)
//   - fetches real Yahoo historical prices + real historical FX
//   - runs the exact route pipeline (forward-fill → CHF conversion)
//   - reports the worst single-day drop, OLD (buggy) vs NEW (fixed)
//
// Run with:  npx tsx scripts/verify-history.ts
//
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { getHistoricalPrices } from '../lib/yahoo'
import { forwardFillPriceMap, toChfPriceMap, type FxFilled, type PriceMap } from '../lib/history-fill'
import { tickerCurrency } from '../lib/ticker-currency'
import { getCHFperUSD, getCHFperEUR } from '../lib/fx'

// Minimal .env.local loader (tsx does not auto-load it).
async function loadEnv() {
  const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const worstDrop = (series: { value: number }[]) => {
  let worst = 0, worstAt = ''
  for (let i = 1; i < series.length; i++) {
    const d = (series[i - 1].value - (series as any)[i].value) / series[i - 1].value
    if (d > worst) { worst = d; worstAt = (series as any)[i].date }
  }
  return { worst, worstAt }
}

async function main() {
  await loadEnv()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: rows, error } = await supabase.from('portfolio').select('user_id, ticker, shares, buy_date')
  if (error) { console.error('DB error:', error.message); process.exit(1) }
  if (!rows?.length) { console.log('No positions in DB.'); return }

  const byUser = new Map<string, { ticker: string; shares: number; buy_date: string }[]>()
  for (const r of rows as any[]) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, [])
    byUser.get(r.user_id)!.push({ ticker: r.ticker, shares: r.shares, buy_date: r.buy_date })
  }

  console.log(`Users with positions: ${byUser.size}\n`)

  for (const [userId, positions] of byUser) {
    const earliest = positions.map(p => p.buy_date).sort()[0]
    const tickers = [...new Set(positions.map(p => p.ticker))]
    const priceMap: PriceMap = {}
    await Promise.all(tickers.map(async t => {
      const r = await getHistoricalPrices(t, earliest)
      priceMap[t] = {}
      r.forEach(x => { priceMap[t][x.date] = x.close })
    }))

    const allDates = new Set<string>()
    Object.values(priceMap).forEach(m => Object.keys(m).forEach(d => allDates.add(d)))
    const sortedDates = [...allDates].sort()
    if (!sortedDates.length) { console.log(`User ${userId.slice(0, 8)} — no price data (tickers: ${tickers.join(', ')})\n`); continue }

    // OLD buggy series: native prices, no fill, no FX (1:1 sum)
    const oldSeries = sortedDates.map(date => {
      let v = 0
      for (const p of positions) { if (date < p.buy_date.split('T')[0]) continue; const px = priceMap[p.ticker]?.[date]; if (px != null) v += px * p.shares }
      return { date, value: v }
    }).filter(d => d.value > 0)

    // NEW fixed series
    const filledNative = forwardFillPriceMap(priceMap, sortedDates)
    const currencies = new Set(tickers.map(tickerCurrency))
    const [usdRows, eurRows, spotUsd, spotEur] = await Promise.all([
      currencies.has('USD') ? getHistoricalPrices('USDCHF=X', earliest) : Promise.resolve([]),
      currencies.has('EUR') ? getHistoricalPrices('EURCHF=X', earliest) : Promise.resolve([]),
      currencies.has('USD') ? getCHFperUSD() : Promise.resolve(0),
      currencies.has('EUR') ? getCHFperEUR() : Promise.resolve(0),
    ])
    const fxRaw: FxFilled = { USD: {}, EUR: {} }
    usdRows.forEach(r => { fxRaw.USD![r.date] = r.close })
    eurRows.forEach(r => { fxRaw.EUR![r.date] = r.close })
    const fxFilled: FxFilled = {
      USD: forwardFillPriceMap({ USD: fxRaw.USD! }, sortedDates).USD,
      EUR: forwardFillPriceMap({ EUR: fxRaw.EUR! }, sortedDates).EUR,
    }
    const chfMap = toChfPriceMap(filledNative, fxFilled, { USD: spotUsd, EUR: spotEur }, tickerCurrency, sortedDates)
    const dataGaps: string[] = []
    const newSeries = sortedDates.map(date => {
      let v = 0, gap = false
      for (const p of positions) { if (date < p.buy_date.split('T')[0]) continue; const px = chfMap[p.ticker]?.[date]; if (px != null) v += px * p.shares; else gap = true }
      if (gap && v > 0) dataGaps.push(date)
      return { date, value: v }
    }).filter(d => d.value > 0)

    const o = worstDrop(oldSeries)
    const n = worstDrop(newSeries)
    const ccyOf = Object.fromEntries(tickers.map(t => [t, tickerCurrency(t)]))
    console.log(`User ${userId.slice(0, 8)} — ${positions.length} lots, ${tickers.length} tickers`)
    console.log(`  tickers/ccy: ${tickers.map(t => `${t}:${ccyOf[t]}`).join(', ')}`)
    console.log(`  dates: ${sortedDates[0]} → ${sortedDates.at(-1)} (${sortedDates.length} pts)`)
    console.log(`  OLD worst 1-day drop: ${(o.worst * 100).toFixed(1)}% on ${o.worstAt || '—'}`)
    console.log(`  NEW worst 1-day drop: ${(n.worst * 100).toFixed(1)}% on ${n.worstAt || '—'}  ${n.worst > 0.5 ? '⚠️ STILL >50%' : '✅ <50%'}`)
    console.log(`  latest value: CHF ${newSeries.at(-1)?.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`)
    console.log(`  data gaps flagged: ${dataGaps.length}${dataGaps.length ? ' (' + dataGaps.slice(0, 5).join(', ') + (dataGaps.length > 5 ? ', …' : '') + ')' : ''}\n`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
