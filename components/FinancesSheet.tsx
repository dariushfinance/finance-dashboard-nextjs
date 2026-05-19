'use client'

import { useEffect, useMemo, useState } from 'react'

type RevenueRow = {
  id: string
  date: string
  description: string
  gross: number
  currency: 'CHF' | 'EUR' | 'USD'
  feePct: number
  feeFixed: number
  source: string
}

type ExpenseRow = {
  id: string
  date: string
  description: string
  category: string
  amount: number
  currency: 'CHF' | 'EUR' | 'USD'
}

const LS_REV = 'quantfoli.finances.revenue.v1'
const LS_EXP = 'quantfoli.finances.expenses.v1'
const LS_FX = 'quantfoli.finances.fx.v1'

const DEFAULT_FX = { CHF: 1, EUR: 0.95, USD: 0.88 }

const todayISO = () => new Date().toISOString().slice(0, 10)
const uid = () => Math.random().toString(36).slice(2, 10)

const fmt = (n: number, ccy = 'CHF') =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: ccy, maximumFractionDigits: 2 }).format(n)

const emptyRev = (): RevenueRow => ({
  id: uid(), date: todayISO(), description: '', gross: 0,
  currency: 'CHF', feePct: 2.9, feeFixed: 0.30, source: 'Stripe',
})
const emptyExp = (): ExpenseRow => ({
  id: uid(), date: todayISO(), description: '', category: 'Infrastructure',
  amount: 0, currency: 'CHF',
})

const EXPENSE_CATS = ['Infrastructure', 'API/Data', 'Domain', 'Email', 'Marketing', 'Legal', 'Tax', 'Other']

export default function FinancesSheet() {
  const [revenue, setRevenue] = useState<RevenueRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [fx, setFx] = useState<Record<string, number>>(DEFAULT_FX)
  const [hydrated, setHydrated] = useState(false)
  const [tab, setTab] = useState<'revenue' | 'expenses' | 'summary'>('summary')

  useEffect(() => {
    try {
      const r = localStorage.getItem(LS_REV)
      const e = localStorage.getItem(LS_EXP)
      const f = localStorage.getItem(LS_FX)
      setRevenue(r ? JSON.parse(r) : [{ ...emptyRev(), description: 'Pro Monthly — Customer 1', gross: 15 }])
      setExpenses(e ? JSON.parse(e) : [
        { ...emptyExp(), description: 'Vercel Pro', category: 'Infrastructure', amount: 20, currency: 'USD' },
        { ...emptyExp(), description: 'Supabase Pro', category: 'Infrastructure', amount: 25, currency: 'USD' },
        { ...emptyExp(), description: 'Domain quantfoli.com', category: 'Domain', amount: 12, currency: 'USD' },
        { ...emptyExp(), description: 'Resend', category: 'Email', amount: 0, currency: 'USD' },
      ])
      if (f) setFx(JSON.parse(f))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => { if (hydrated) localStorage.setItem(LS_REV, JSON.stringify(revenue)) }, [revenue, hydrated])
  useEffect(() => { if (hydrated) localStorage.setItem(LS_EXP, JSON.stringify(expenses)) }, [expenses, hydrated])
  useEffect(() => { if (hydrated) localStorage.setItem(LS_FX, JSON.stringify(fx)) }, [fx, hydrated])

  const toCHF = (amount: number, ccy: string) => amount * (fx[ccy] ?? 1)

  const calc = useMemo(() => {
    const rows = revenue.map(r => {
      const grossCHF = toCHF(r.gross, r.currency)
      const fee = (r.gross * r.feePct) / 100 + r.feeFixed
      const feeCHF = toCHF(fee, r.currency)
      const netCHF = grossCHF - feeCHF
      return { id: r.id, grossCHF, feeCHF, netCHF }
    })
    const grossTotal = rows.reduce((s, x) => s + x.grossCHF, 0)
    const feesTotal = rows.reduce((s, x) => s + x.feeCHF, 0)
    const netTotal = rows.reduce((s, x) => s + x.netCHF, 0)
    const expTotal = expenses.reduce((s, e) => s + toCHF(e.amount, e.currency), 0)
    const profit = netTotal - expTotal
    const margin = grossTotal > 0 ? (profit / grossTotal) * 100 : 0
    const byCat: Record<string, number> = {}
    for (const e of expenses) byCat[e.category] = (byCat[e.category] ?? 0) + toCHF(e.amount, e.currency)
    return { rowMap: Object.fromEntries(rows.map(r => [r.id, r])), grossTotal, feesTotal, netTotal, expTotal, profit, margin, byCat }
  }, [revenue, expenses, fx])

  const exportCSV = () => {
    const lines = [
      'TYPE,date,description,category/source,gross/amount,currency,fee_pct,fee_fixed,fee_CHF,net_CHF',
      ...revenue.map(r => {
        const c = calc.rowMap[r.id]
        return `revenue,${r.date},"${r.description}",${r.source},${r.gross},${r.currency},${r.feePct},${r.feeFixed},${c.feeCHF.toFixed(2)},${c.netCHF.toFixed(2)}`
      }),
      ...expenses.map(e => `expense,${e.date},"${e.description}",${e.category},${e.amount},${e.currency},,,,${toCHF(e.amount, e.currency).toFixed(2)}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `quantfoli-finances-${todayISO()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!hydrated) return <div style={{ padding: 40, color: 'var(--ink-3)' }}>Loading…</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', padding: '32px 24px', fontFamily: 'var(--font-ui)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, margin: 0 }}>Finances</h1>
            <p style={{ color: 'var(--ink-3)', margin: '4px 0 0', fontSize: 14 }}>Revenue, Stripe fees, expenses · all CHF · stored locally</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} style={btnSecondary}>Export CSV</button>
            <a href="/" style={btnSecondary}>← Dashboard</a>
          </div>
        </header>

        <nav style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
          {(['summary', 'revenue', 'expenses'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={tabBtn(tab === t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>

        {tab === 'summary' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              <Kpi label="Gross revenue" value={fmt(calc.grossTotal)} />
              <Kpi label="Stripe fees" value={fmt(calc.feesTotal)} tone="neg" />
              <Kpi label="Net revenue" value={fmt(calc.netTotal)} tone="pos" />
              <Kpi label="Expenses" value={fmt(calc.expTotal)} tone="neg" />
              <Kpi label="Profit" value={fmt(calc.profit)} tone={calc.profit >= 0 ? 'pos' : 'neg'} />
              <Kpi label="Margin" value={`${calc.margin.toFixed(1)}%`} tone={calc.margin >= 0 ? 'pos' : 'neg'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <Card title="Expenses by category">
                {Object.entries(calc.byCat).length === 0 && <p style={muted}>No expenses yet.</p>}
                {Object.entries(calc.byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => (
                  <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
                    <span style={{ color: 'var(--ink-2)' }}>{c}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(v)}</span>
                  </div>
                ))}
              </Card>

              <Card title="FX rates (to CHF)">
                <p style={muted}>Edit if rates drift. Applies to all rows.</p>
                {Object.keys(fx).map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{ width: 48, color: 'var(--ink-2)' }}>{k}</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={fx[k]}
                      disabled={k === 'CHF'}
                      onChange={e => setFx({ ...fx, [k]: parseFloat(e.target.value) || 0 })}
                      style={input}
                    />
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        {tab === 'revenue' && (
          <Card title="Revenue">
            <div style={{ overflowX: 'auto' }}>
              <table style={table}>
                <thead>
                  <tr>
                    {['Date', 'Description', 'Source', 'Gross', 'Ccy', 'Fee %', 'Fee fix', 'Fee CHF', 'Net CHF', ''].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {revenue.map((r, i) => {
                    const c = calc.rowMap[r.id]
                    const update = (patch: Partial<RevenueRow>) => setRevenue(revenue.map((x, j) => j === i ? { ...x, ...patch } : x))
                    return (
                      <tr key={r.id}>
                        <td style={td}><input type="date" value={r.date} onChange={e => update({ date: e.target.value })} style={cell} /></td>
                        <td style={td}><input value={r.description} onChange={e => update({ description: e.target.value })} style={cell} placeholder="e.g. Pro Yearly — Customer 2" /></td>
                        <td style={td}><input value={r.source} onChange={e => update({ source: e.target.value })} style={cell} /></td>
                        <td style={td}><input type="number" step="0.01" value={r.gross} onChange={e => update({ gross: parseFloat(e.target.value) || 0 })} style={{ ...cell, textAlign: 'right' }} /></td>
                        <td style={td}>
                          <select value={r.currency} onChange={e => update({ currency: e.target.value as any })} style={cell}>
                            <option>CHF</option><option>EUR</option><option>USD</option>
                          </select>
                        </td>
                        <td style={td}><input type="number" step="0.1" value={r.feePct} onChange={e => update({ feePct: parseFloat(e.target.value) || 0 })} style={{ ...cell, textAlign: 'right' }} /></td>
                        <td style={td}><input type="number" step="0.01" value={r.feeFixed} onChange={e => update({ feeFixed: parseFloat(e.target.value) || 0 })} style={{ ...cell, textAlign: 'right' }} /></td>
                        <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--neg)', textAlign: 'right' }}>{fmt(c.feeCHF)}</td>
                        <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--pos)', textAlign: 'right' }}>{fmt(c.netCHF)}</td>
                        <td style={td}><button onClick={() => setRevenue(revenue.filter((_, j) => j !== i))} style={delBtn}>×</button></td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={7} style={{ ...td, fontWeight: 600, textAlign: 'right' }}>Totals</td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--neg)', textAlign: 'right', fontWeight: 600 }}>{fmt(calc.feesTotal)}</td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--pos)', textAlign: 'right', fontWeight: 600 }}>{fmt(calc.netTotal)}</td>
                    <td style={td} />
                  </tr>
                </tbody>
              </table>
            </div>
            <button onClick={() => setRevenue([...revenue, emptyRev()])} style={{ ...btnPrimary, marginTop: 12 }}>+ Add revenue row</button>
          </Card>
        )}

        {tab === 'expenses' && (
          <Card title="Expenses">
            <div style={{ overflowX: 'auto' }}>
              <table style={table}>
                <thead>
                  <tr>
                    {['Date', 'Description', 'Category', 'Amount', 'Ccy', 'CHF', ''].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e, i) => {
                    const chf = toCHF(e.amount, e.currency)
                    const update = (patch: Partial<ExpenseRow>) => setExpenses(expenses.map((x, j) => j === i ? { ...x, ...patch } : x))
                    return (
                      <tr key={e.id}>
                        <td style={td}><input type="date" value={e.date} onChange={ev => update({ date: ev.target.value })} style={cell} /></td>
                        <td style={td}><input value={e.description} onChange={ev => update({ description: ev.target.value })} style={cell} placeholder="e.g. Vercel Pro" /></td>
                        <td style={td}>
                          <select value={e.category} onChange={ev => update({ category: ev.target.value })} style={cell}>
                            {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </td>
                        <td style={td}><input type="number" step="0.01" value={e.amount} onChange={ev => update({ amount: parseFloat(ev.target.value) || 0 })} style={{ ...cell, textAlign: 'right' }} /></td>
                        <td style={td}>
                          <select value={e.currency} onChange={ev => update({ currency: ev.target.value as any })} style={cell}>
                            <option>CHF</option><option>EUR</option><option>USD</option>
                          </select>
                        </td>
                        <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--neg)', textAlign: 'right' }}>{fmt(chf)}</td>
                        <td style={td}><button onClick={() => setExpenses(expenses.filter((_, j) => j !== i))} style={delBtn}>×</button></td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={5} style={{ ...td, fontWeight: 600, textAlign: 'right' }}>Total</td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--neg)', textAlign: 'right', fontWeight: 600 }}>{fmt(calc.expTotal)}</td>
                    <td style={td} />
                  </tr>
                </tbody>
              </table>
            </div>
            <button onClick={() => setExpenses([...expenses, emptyExp()])} style={{ ...btnPrimary, marginTop: 12 }}>+ Add expense row</button>
          </Card>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  const color = tone === 'pos' ? 'var(--pos)' : tone === 'neg' ? 'var(--neg)' : 'var(--ink)'
  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', color }}>{value}</div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 20, boxShadow: 'var(--shadow-card)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>{title}</h2>
      {children}
    </div>
  )
}

const muted: React.CSSProperties = { color: 'var(--ink-3)', fontSize: 13, margin: 0 }
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 6px', color: 'var(--ink-3)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--line)' }
const td: React.CSSProperties = { padding: '4px 4px', borderBottom: '1px solid var(--line-soft)', verticalAlign: 'middle' }
const cell: React.CSSProperties = { width: '100%', background: 'transparent', border: '1px solid transparent', borderRadius: 6, padding: '6px 8px', color: 'var(--ink)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }
const input: React.CSSProperties = { ...cell, background: 'var(--bg-2)', border: '1px solid var(--line)', flex: 1, fontFamily: 'var(--font-mono)' }
const btnPrimary: React.CSSProperties = { background: 'var(--grad-brand)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { background: 'var(--bg-2)', color: 'var(--ink)', border: '1px solid var(--line)', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }
const delBtn: React.CSSProperties = { background: 'transparent', color: 'var(--ink-3)', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px' }
const tabBtn = (active: boolean): React.CSSProperties => ({
  background: 'transparent', border: 'none', padding: '10px 16px', cursor: 'pointer',
  color: active ? 'var(--ink)' : 'var(--ink-3)', fontWeight: active ? 600 : 400, fontSize: 14,
  borderBottom: active ? '2px solid var(--brand-a)' : '2px solid transparent', marginBottom: -1,
})
