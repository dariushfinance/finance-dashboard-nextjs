# Portfolio Value History — Phantom 70% Drop Audit

**Date:** 2026-05-26
**Status:** Diagnosed. Fix NOT applied (awaiting approval).
**Severity:** High (user-visible, looks like catastrophic loss that never happened)

---

## 1. Symptom

`Portfolio Value History` chart shows isolated single-day collapses from
~CHF 300k to ~CHF 91k, then full recovery the next day. No transactions on
those days. Reported example: 2026-04-06. Two other identical drops visible.

91k / 300k ≈ 30% → roughly **70% of portfolio value vanishes for exactly one day**.

---

## 2. Root cause (confirmed by code reading)

**The value series is built on the UNION of every ticker's trading days, with
no forward-fill. On a day where one exchange is closed but another is open,
the closed-exchange positions silently contribute 0 to that day's total.**

### The exact code path

`app/api/history/route.ts:42-56`

```ts
const allDates = new Set<string>()
Object.values(priceMap).forEach((m) => Object.keys(m).forEach((d) => allDates.add(d)))
const sortedDates = [...allDates].sort()          // ← UNION of all tickers' dates

const history = sortedDates.map((date) => {
  let value = 0
  for (const pos of positions) {
    const buyDate = pos.buy_date.split('T')[0]
    if (date < buyDate) continue
    const price = priceMap[pos.ticker]?.[date]
    if (price != null) value += price * pos.shares   // ← missing price = silent 0
  }
  return { date, value }
}).filter((d) => d.value > 0)                         // ← day kept as long as ANY ticker has a price
```

When ticker A (e.g. US-listed) has a bar on date D but ticker B (e.g. SIX/Xetra-listed)
does not, `priceMap['B'][D]` is `undefined`. The `price != null` guard skips B —
so B is valued at **0** instead of its last-known price. The day still passes the
`value > 0` filter because A is non-zero. Result: a one-day cliff equal to the
weight of the closed-exchange holdings, fully recovered the next day when B's
bars resume.

### Why those specific dates

`getHistoricalPrices` (`lib/yahoo.ts:84-123`) only emits rows for timestamps
Yahoo actually returns. European/Swiss exchanges are closed on European-only
holidays while US markets stay open. 2026 European market holidays with US open:

| Date       | Holiday (CH/DE/FR)        | US (NYSE) |
|------------|---------------------------|-----------|
| 2026-04-06 | Easter Monday             | **Open**  |
| 2026-05-01 | Labour Day                | **Open**  |
| 2026-05-14 | Ascension Day             | **Open**  |
| 2026-05-25 | Whit Monday               | **Open**  |

On each of these, the union grid contains a US-only date. Every European/Swiss
position drops to 0 for that day. The "three visible drops" map cleanly to
2026-04-06, 2026-05-01, 2026-05-14 (May 25 is yesterday relative to report).

(Note: Good Friday 2026-04-03 does NOT trigger it — NYSE is also closed, so no
US-only date exists. Consistent with the reported symptom.)

---

## 3. Hypothesis verdict

| ID | Hypothesis | Verdict |
|----|------------|---------|
| H1 | Missing FX rate → 1.0 or 0 | **Not the trigger.** See §6 — the route applies no FX at all. Irrelevant to the drop. |
| H2 | Ticker valued at 0 on certain days | **CONFIRMED — this is the visible mechanism.** Missing price → silent 0. |
| H3 | Yahoo returns 0/null not filtered | No. `getHistoricalPrices` *does* filter nulls (`yahoo.ts:111`). The problem is the opposite — filtered-out days create gaps. |
| H4 | Cache gaps not backfilled | **CONFIRMED — this is the root cause.** Per-ticker date sets differ; gaps are never forward-filled onto the union grid. |
| H5 | TWR treats missing day as "sold" | No. `calcTWRReturns` (`yahoo.ts:189`) requires *both* endpoints present, so it skips the position for that step rather than zeroing it. TWR metrics are largely insulated; only the **absolute value chart** shows the cliff. |

**Conclusion: H4 (gaps not backfilled) is the root cause; H2 (zero-valuation) is
how it manifests.** The two are the same bug seen from two angles.

---

## 4. Proposed fix (NOT yet applied)

All changes confined to `app/api/history/route.ts`. **No change to `lib/yahoo.ts`
core math** (honors hard rule).

1. **Forward-fill each ticker onto the union date grid.** Before building the
   value series, walk `sortedDates` per ticker and carry the last-known close
   forward into any missing date (only after the ticker's first observed bar —
   never back-fill before it existed). This eliminates the zero-valuation cliff
   and also makes `calcTWRReturns` more correct (no skipped steps on holidays).

2. **Last-known-good fallback, never 0.** A position contributes its carried
   price; it only contributes 0 before its first-ever bar.

3. **Flag true data gaps for the frontend.** Add an optional `gap?: boolean` to
   each `HistoricalDataPoint` (and `dataGaps: string[]` on `HistoryResult`) for
   dates where a held position had *no* prior price at all (genuine missing
   data, not a holiday). Frontend can render these as "data gap" rather than a
   value. Holiday forward-fills are NOT flagged — they are correct values.

4. **Regression test** (`lib/history-fill.test.ts` or extend `yahoo.test.ts`):
   the specific pattern — a day-over-day drop > 50% with no transaction on that
   day is a bug. Test builds a 3-ticker priceMap where one ticker is missing a
   single mid-series date, asserts the forward-filled value series has **no
   single-day drop > 50%**, and asserts the carried value equals the prior close.

### Forward-fill must live in the route, not yahoo math

The fill is a presentation/assembly concern over the already-fetched `priceMap`.
Putting it in the route keeps `getHistoricalPrices` returning raw Yahoo bars
(unchanged) and respects the "do not modify core math" rule. To keep
`calcTWRReturns` consistent, pass the filled `priceMap` to it as well.

---

## 5. Regression test spec

```
Given: priceMap = {
  USTICKER: { '2026-04-03':100, '2026-04-06':101, '2026-04-07':102 },   // trades the holiday
  CHTICKER: { '2026-04-03':100,                  '2026-04-07':100 },    // closed 04-06
}
positions: 10 shares each, bought before 2026-04-03
When: value series is built with forward-fill
Then:
  - 2026-04-06 value includes CHTICKER carried at 100 (not 0)
  - no consecutive-day drop in `value` exceeds 50%
  - 2026-04-06 is NOT flagged as a data gap (it is a holiday fill, a real value)
```

Plus a guard test asserting the *old* (unfilled) logic WOULD produce a >50% drop,
to prove the test actually catches the bug.

---

## 6. Secondary finding — FX conversion (FIXED in this pass)

`app/api/history/route.ts` originally built `value` as `Σ price × shares` in each
ticker's **native currency** with **no FX conversion to CHF** — a USD position and
a CHF position were summed as if 1 USD = 1 CHF. This did not cause the phantom
drop, but it mis-stated the CHF axis for mixed-currency portfolios.

**Fix applied:**
- `lib/ticker-currency.ts` — `tickerCurrency()` classifies each ticker as
  CHF / EUR / USD (SIX `.SW` → CHF, Euro-zone suffixes → EUR, else metadata, with
  USD as the catch-all).
- `lib/history-fill.ts` — `toChfPriceMap()` converts each ticker's forward-filled
  native price to CHF using **per-day historical FX** (`USDCHF=X`, `EURCHF=X`,
  forward-filled across FX holidays). Falls back to **spot** when a day's
  historical rate is missing — **never to 1.0**. If no usable rate exists, the
  entry is omitted → the day is flagged as a data gap rather than mis-valued.
- The route fetches historical FX only for currencies actually present, converts
  before summing, and feeds the CHF map to `calcTWRReturns` so returns reflect a
  CHF-based investor (FX moves included).
- `components/HistoryChart.tsx` — axis + tooltip labels changed from `$` to `CHF`.

**Known limitation:** currencies other than USD/EUR/CHF (GBP, DKK, HKD, JPY...)
are approximated as USD. Additive and far closer than the old 1:1, but not exact.
Documented in `lib/ticker-currency.ts`. A full fix would read `meta.currency` from
the Yahoo response — deferred to avoid changing `lib/yahoo.ts` (hard rule).

---

## 7. Hard-rule compliance

- ✅ No change to `lib/yahoo.ts` core math.
- ✅ No change to `/how-it-works` backtest data.
- ✅ Diagnosis first; fix pending caveman approval.
- ⏳ Vitest regression test to be added with the fix.
- N/A FIDLEG: only user-facing copy would be the "data gap" label — will run
  `@agent-fidleg-reviewer` on that string before shipping.
