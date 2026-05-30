# QUANTFOLI Research Sources

Primary research log for Quantfoli persona development.
Sources: r/SwissPersonalFinance, forum.mustachianpost.com, thepoorswiss.com (articles + comments), and other approved primary sources.

---

## Persona 1 — Marc, 42, ZKB-Kunde, IT-Consultant

**Profile hypothesis:** IT professional, Zurich area, mid-large portfolio (~CHF 100–400k), primary bank ZKB, frustrated with ZKB depot fees/reporting tools, likely tracking investments in Excel or a third-party tool because ZKB's e-banking lacks analytics depth, technically capable but wants a turnkey solution.

**Sources searched:** forum.mustachianpost.com (ZKB threads, CSV thread, portfolio tracker thread), forum.cash.ch (ZKB-to-Tradejet thread), insideparadeplatz.ch (ZKB fee articles), thepoorswiss.com (ZKB review), schwiizerfranke.com (broker comparison, Portfolio Performance article), moneyland.ch (custody fee comparison, tax report forum), trustpilot.com/review/zkb.ch, saldo.ch (reader advice columns). Session 2 additions: zero-fees-at-zkb (pages 1–3), zkb-vs-neon-for-regular-bank-account, open-banking-2025.

**Access log — blocked sources:** insideparadeplatz.ch (HTTP 403 on all article URLs), thepoorswiss.com (HTTP 403), schwiizerfranke.com (HTTP 403), trustpilot.com/de (HTTP 403), saldo.ch (HTTP 403), moneyland.ch/de/forum (HTTP 403), forum.cash.ch (HTTP 403). ZKB "zero fees" threads (pages 1–3) focused on account/debit card fees — NOT depot/securities fees.

**Access log — accessible with findings:** forum.mustachianpost.com (ZKB CSV thread, portfolio tracker threads, zero-fees page 3, open-banking thread — confirmed).

---

| Source URL | Quoted user statement | Pain point | Broker/tool mentioned | Inferred demographic | Date |
|---|---|---|---|---|---|
| https://forum.mustachianpost.com/t/zkb-is-the-account-balance-stated-in-csv-statements/11536 | "Regarding credit card statements, there is no option to export the transactions in a CSV format." — PoopSmellsLikeMe | ZKB credit card data cannot be exported to CSV — blocks consolidated portfolio tracking in Excel or third-party tools | ZKB (credit card / Viseca) | Not stated | Dec 29, 2023 |
| https://forum.mustachianpost.com/t/zkb-is-the-account-balance-stated-in-csv-statements/11536 | "I consider adding ZKB to my Banking providers. one crucial thing for me is that the csv account statements include both the transactions and at least one balance statement" — nugget | User's decision to use ZKB as a data provider hinges entirely on whether CSV exports contain balance data — signals that ZKB's data export capability is a make-or-break feature for self-directed trackers | ZKB | Not stated — voice fits Marc archetype (evaluating ZKB for multi-account consolidation) | Dec 28, 2023 |
| https://forum.mustachianpost.com/t/best-swiss-portfolio-tracker/11444 | "still lacks a lot of Swiss banks/3rd pillar provider (unfortunately most are not accessible with API)" — GildasSB | Swiss banks including cantonal banks (ZKB implied by context of Swiss providers) have no open API — forces manual data entry into any tracker | Not specified (context: Swiss banks generally) | Not stated | Dec 21, 2023 |
| https://www.trustpilot.com/review/zkb.ch (web search snippet — full page not directly accessible) | "The fees in the stock area are not to be surpassed in audacity. Drastic increase in fees, here the relocation to another institute is now 'punished' with extremely high fees." — anonymous Trustpilot reviewer | ZKB depot/securities fees described as excessive; transfer-out fees used punitively to prevent switching | ZKB securities depot | Not stated | Sep 4, 2023 |
| https://forum.mustachianpost.com/t/zero-fees-at-zkb/11484?page=3 | "Does anyone know, if we can transfer funds for free from ZKB to IBKR?" — fittim | User actively planning to transfer assets out of ZKB to IBKR — confirms ZKB-to-IBKR migration as a real, active user behaviour | ZKB, IBKR | Not stated | Jan 15, 2024 |
| https://forum.mustachianpost.com/t/zero-fees-at-zkb/11484?page=3 | "Transferring CHF is easy and free because IBKR provides a Swiss IBAN (so it is a domestic transfer, not an international one)" — jmp | Workaround knowledge required to avoid ZKB transfer fees — signals that the fee barrier is a known but solvable friction point for technically literate users | ZKB, IBKR | Not stated | Jan 15, 2024 |
| https://forum.mustachianpost.com/t/zero-fees-at-zkb/11484?page=3 | "However, transferring USD (dividends received from VWRL) always cost me something (about 14$, charged by IBKR)" — jmp | Hidden cost in ZKB-to-IBKR USD dividend transfer — a specific pain point for users holding UCITS ETFs (VWRL pays USD dividends) at ZKB | ZKB, IBKR, VWRL | Active ZKB + IBKR user, technically informed | Jan 15, 2024 |
| https://forum.mustachianpost.com/t/open-banking-2025/17752 | "bit disappointed, none of my other swiss banks are listed" — impromptu4930 | Swiss open banking rollout fails to include user's existing cantonal/ZKB accounts — data still siloed | Swiss banks (unspecified, cantonal bank context) | Multi-bank Swiss user | Nov 26, 2025 |
| https://forum.mustachianpost.com/t/open-banking-2025/17752 | "So, they should call it closed gatekept banking" — PhilMongoose | Frustration that "open banking" in Switzerland excludes most banks — portfolio aggregation remains impossible | Swiss banks generally | Not stated | Nov 27, 2025 |

---

### Persona 1 — Research Status

- **Total verifiable quotes:** 9 (4 session 1 + 5 session 2)
- **Minimum threshold of 5 MET**

#### Top pain points

1. ZKB depot/custody fees — described as "audacious" by Trustpilot reviewer; transfer-out fees punitive; editorial data: CHF 231.85/year (NZZ/moneyland)
2. ZKB-to-IBKR transfer mechanics — CHF transfer free, USD dividend transfer ~$14; users actively researching this migration path
3. No usable API / open banking exclusions — cantonal banks not included in Swiss open banking rollout 2025
4. CSV/data export gaps — credit card has no CSV; balance data unreliable in depot exports

#### Brokers/tools mentioned

ZKB (as legacy bank being critiqued), IBKR (as destination), Tradejet (as destination), Swissquote (as destination), Viseca (ZKB credit card partner)

#### Hypothesis status: Validated for "ZKB users migrating to IBKR" behaviour. Partially validated for analytics/data frustration (blocked sources prevent direct quote confirmation from highest-signal platforms).

#### Recommended next actions

- Gain WebFetch access to: insideparadeplatz.ch, forum.cash.ch, thepoorswiss.com, trustpilot.com/review/zkb.ch, moneyland.ch/de/forum, saldo.ch
- Search strings: `site:forum.cash.ch ZKB Depot Gebühren`, `site:insideparadeplatz.ch ZKB Depot 2023 2024`, `"ZKB" "Depot" "teuer" site:moneyland.ch/de/forum`

---

## Persona 3 — Patrick, 28, Engineer, Excel-Tracker

**Profile hypothesis:** Software/Mech Engineer, Zurich/Zug area, CHF 80–150k portfolio, tracks in Excel/Google Sheets, uses IBKR or Degiro for ETFs (VT, VWRL), pain points around manual updates, CHF conversion, dividend/DA-1 tracking, FIRE-curious.

**Sources searched:** forum.mustachianpost.com, thepoorswiss.com  
**Note:** reddit.com blocked to web crawler. The Poor Swiss forum (forum.thepoorswiss.com) returned HTTP 403. Quotes sourced from Mustachian Post Community forum only.

---

| Source URL | Quoted user statement | Pain point | Broker/tool mentioned | Inferred demographic | Date |
|---|---|---|---|---|---|
| https://forum.mustachianpost.com/t/best-swiss-portfolio-tracker/11444 | "I have to manually update position sizes, except the IB integration where I just use the total portfolio value." — thurston | Manual position updates; no automatic sync across accounts | Interactive Brokers (IB), Google Sheets | Not stated | Dec 21, 2023 |
| https://forum.mustachianpost.com/t/best-swiss-portfolio-tracker/11444 | "I think the fact that it requires so much effort to have it up and running to be useful is what keeps people away" — RoadToMustachian | High setup friction for portfolio tracking tools | Not specified | Not stated | Dec 15, 2023 |
| https://forum.mustachianpost.com/t/best-swiss-portfolio-tracker/11444 | "And I added and update manually: Funds in VIAC, BCV accounts, SOL" — GildasSB | Ongoing manual data entry for accounts not covered by automatic sync | IBKR (auto), VIAC, Revolut (manual) | Not stated | Dec 21, 2023 |
| https://forum.mustachianpost.com/t/interactive-brokers-to-google-sheets/3391 | "I would like to get real time (read only) data from my IB account into Google Sheets" — thurston | Lack of live data feed from IBKR into spreadsheet; manual refresh required | Interactive Brokers, Google Sheets | Not stated | Mar 6, 2020 |
| https://forum.mustachianpost.com/t/interactive-brokers-to-google-sheets/3391 | "I was wondering if anyone had written any scripts to parse the Interactive Brokers flex query" — swensen | Need to script/automate IBKR data extraction; no out-of-the-box solution | Interactive Brokers (flex query) | Not stated | Oct 20, 2021 |
| https://forum.mustachianpost.com/t/withholding-tax-in-practice-for-vt-on-ibkr/7555 | "The interface is just quite intimidating as a beginner and some things are rather hard to find." — TheRaven | IBKR interface complexity when locating dividend/withholding tax data for DA-1 | Interactive Brokers | Self-described beginner | Dec 26, 2021 |
| https://forum.mustachianpost.com/t/interactive-brokers-reports-for-tax-declaration/4270 | "FX income wasn't ideal, at the time it was the only tax report on IB that showed my VT purchases" — hippo | Inadequate/indirect IBKR tax reports for CHF-based investors holding VT; FX income report used as workaround | Interactive Brokers, VT ETF | Not stated | May 12, 2019 |
| https://forum.mustachianpost.com/t/us-withholding-tax/12606 | "I guess I must have filled out the DA 1 form incorrectly then." — Financial1Ind | Confusion and errors when completing the DA-1 form for US withholding tax reclaim | DA-1 form (Swiss tax) | Not stated | May 2, 2024 |
| https://forum.mustachianpost.com/t/searching-for-a-portfolio-analyzer-tool/5665 | "I'm trying to search for a solution that's automate th spreadsheet work" — Grog | Desire to replace manual spreadsheet work with automated portfolio analysis | Not specified | Not stated | Feb 12, 2021 |
| https://forum.mustachianpost.com/t/searching-for-a-portfolio-analyzer-tool/5665 | "manually scan through 8 reports and write down 160 percentage…and this regularly" — Grog | Extreme manual effort to aggregate holdings data across multiple ETF reports | Multiple ETFs (VXUS, SMI referenced) | Not stated | Feb 12, 2021 |

---

### Persona 3 — Summary

- **Quotes found:** 10 (all verbatim, sourced from forum.mustachianpost.com)
- **Top 3 pain points by frequency:**
  1. Manual data entry / no automatic sync across brokers and accounts (5 quotes)
  2. IBKR interface complexity for tax-related data (DA-1, withholding tax, FX reports) (3 quotes)
  3. High setup friction for any tool that could replace the spreadsheet (2 quotes)
- **Brokers most mentioned:** Interactive Brokers (IBKR), VIAC, Google Sheets (as tool)
- **Recurring vocabulary:** "manually update", "automate the spreadsheet work", "flex query", "DA-1", "withholding tax", "hard to find"
- **Hypothesis status:** Partially validated — manual tracking pain and IBKR/tax complexity are confirmed by multiple independent voices. CHF conversion as a specific stated pain point was NOT directly quoted (mentioned in article summaries only, not user comments). Require ≥3 separate user quotes on CHF conversion before flagging as confirmed pattern.
- **Recommended next searches:** 
  - `forum.mustachianpost.com "CHF" "conversion" IBKR portfolio tracking`
  - `forum.mustachianpost.com "dividend" "tracking" Excel IBKR`
  - r/SwissPersonalFinance (requires non-blocked access) for Patrick-profile voices

---

## Persona 4 — Thomas, 50, Tech-Manager, CHF 500k+

**Profile hypothesis:** Senior tech professional, 45–55 age range, CHF 500k+ investable assets, uses IBKR (primary broker), approaching semi-retirement or early retirement, concerned about broker risk concentration, tax optimization for large portfolios, drawdown protection, may hold assets across multiple brokers/banks.

**Sources searched:** forum.mustachianpost.com threads: diversification-of-brokers, feedback-on-my-portfolio-plan-to-fire, advice-on-my-getting-back-into-investing-portfolio, seeking-advice-building-a-semi-retirement-etf-portfolio, best-portfolio-for-a-retiree, whats-your-investment-strategy-for-2024, thoughts-on-portfolio-diversification-2025, optimization-of-portfolio-withholding-taxes, all-world-stocks-portfolio-2024, second-portfolio-possible-at-interactive-brokers.

**Access log:** All Mustachian Post threads accessible. reddit.com/r/SwissPersonalFinance confirmed blocked. insideparadeplatz.ch blocked.

---

| Source URL | Quoted user statement | Pain point | Broker/tool mentioned | Inferred demographic | Date |
|---|---|---|---|---|---|
| https://forum.mustachianpost.com/t/diversification-of-brokers/14748 | "I've reached the point where I start to get worried about having such a high percentage of my NW in Interactive Brokers" — Alex | Concentration risk at single broker becomes pressing concern at high NW — drives need for multi-broker portfolio visibility | IBKR | High NW investor (implied by concern threshold) | Dec 27, 2024 |
| https://forum.mustachianpost.com/t/diversification-of-brokers/14748 | "1M total NW, 500k at single broker" — dbu | Explicit 500k threshold named as the point where single-broker concentration triggers action | IBKR | Not stated — NW implied CHF 1M+ | Dec 4, 2024 |
| https://forum.mustachianpost.com/t/diversification-of-brokers/14748 | "I would say above 250K already, i would start dipping toes with second broker to experience their platform etc." — Abs_max | Lower threshold (250k) for beginning broker diversification — confirms that large-portfolio users actively plan multi-broker setups | IBKR (primary), second broker unspecified | Not stated | Dec 4, 2024 |
| https://forum.mustachianpost.com/t/diversification-of-brokers/14748 | "Use ibkr up to 500K, transfer those to corner and then just start at 0 again in ibkr" — Tony1337 | Proposed rolling 500k cap strategy — operationally complex; no tool exists to aggregate the resulting split portfolio in one consolidated view | IBKR, Cornèr Bank | Not stated | Dec 27, 2024 |
| https://forum.mustachianpost.com/t/advice-on-my-getting-back-into-investing-portfolio/17424 | "This is a continuation of from my 500K in the bank post" — prometheus | User building on prior 500k lump-sum discussion, deploying CHF 40k/month — large-scale portfolio construction; tracking/analytics needs heightened at this scale | IBKR | Portfolio size: CHF 500k+ confirmed | Oct 10, 2025 |
| https://forum.mustachianpost.com/t/advice-on-my-getting-back-into-investing-portfolio/17424 | "I would at least not put it in the same space as the rest of your capital (IBKR)." — Helix | Explicit recommendation to separate large portfolio portions across brokers — creates multi-account visibility problem with no consolidated analytics tool available | IBKR | Not stated | Oct 10, 2025 |
| https://forum.mustachianpost.com/t/advice-on-my-getting-back-into-investing-portfolio/17424 | "Swiss tax treatment is unfavorable for UCITS dividends (dividends in general), and value has higher dividends." — Helix | Tax optimization complexity for large CHF portfolios — UCITS vs US-domicile ETF choice has measurable after-tax impact at scale | IBKR, UCITS ETFs | Not stated | Oct 10, 2025 |

---

### Persona 4 — Summary

- **Quotes found:** 7 (all verbatim, sourced)
- **Top 3 pain points by frequency:**
  1. Broker concentration risk at CHF 250k–500k threshold — drives multi-broker setup (4 quotes)
  2. No consolidated view once assets are split across 2+ brokers — operational pain implied but not yet directly quoted as a tool request (≥3 separate quote threshold not met for this specific framing)
  3. Tax optimization complexity at large portfolio scale — UCITS vs US funds, withholding tax (2 quotes)
- **Brokers most mentioned:** IBKR (dominant), Cornèr Bank (cited as overflow), ZKB (transit bank for CHF transfers)
- **Recurring vocabulary:** "concentration risk", "percentage of my NW", "500K", "second broker", "transfer", "tax treatment", "NW"
- **Hypothesis status:** Validated for multi-broker concern and 500k threshold. Tax optimization pain confirmed. Sharpe/Sortino ratio language NOT found in any accessible thread — Swiss FIRE community discusses risk qualitatively ("drawdown", "aggressive", "concentration"), not with explicit quant metric terminology.
- **Recommended next searches:** r/SwissPersonalFinance (blocked) — would likely yield explicit quant metric language. insideparadeplatz.ch HNWI discussions (blocked).

---

## Persona 6 — Andreas, 38, Self-employed, Yuh + ZKB

**Profile hypothesis:** Self-employed professional (freelancer, sole proprietor, or small business owner), age ~35–42, uses Yuh as secondary/neo bank alongside a cantonal bank (ZKB or similar), 3a contributions calculated on irregular net income, portfolio spread across Yuh + another broker, frustrated by multi-account fragmentation and lack of unified portfolio view.

**Sources searched:** forum.mustachianpost.com threads: the-situation-of-a-self-employed-worker, help-me-understand-the-20-of-the-net-income-rule, self-employed-pillar-2-or-pillar-3, 2nd-pillar-options-for-self-employed, banking-credit-card-combinations-2024-edition, yuh-neobank-2024 (pages 1, 3, 5), postfinance-or-yuh-for-investing. Web searches for Yuh + self-employed + multi-account combinations.

**Access log:** All Mustachian Post threads accessible. Reddit blocked. thepoorswiss, schwiizerfranke, finanzbloggers.com all 403 on WebFetch.

---

| Source URL | Quoted user statement | Pain point | Broker/tool mentioned | Inferred demographic | Date |
|---|---|---|---|---|---|
| https://forum.mustachianpost.com/t/yuh-neobank-2024/12900 | "I have VT on Yuh but then I stopped investing there because of fees (you know, beginner mistakes)" — rezliensa | Yuh's fee structure makes it unsuitable as a primary investment broker — users migrate away once they understand the cost | Yuh | Self-described beginner who outgrew Yuh | May 31, 2024 |
| https://forum.mustachianpost.com/t/yuh-neobank-2024/12900 | "if I would find a way to avoid those 0.95% I would start again, shame." — rezliensa | Yuh's FX/trading fee of 0.95% is a hard blocker for continued investing — user wants to use Yuh but cannot justify the fee drag | Yuh | Not stated | May 31, 2024 |
| https://forum.mustachianpost.com/t/postfinance-or-yuh-for-investing/13871 | "I know I can use Yuh to invest in ETFs like VWRL, but it hurts to pay the 0.5% fee when selling." — Kumeditkush | Yuh's sell-side fee creates friction — acceptable during accumulation but painful at liquidation | Yuh, VWRL | Not stated | Sep 8, 2024 |
| https://forum.mustachianpost.com/t/yuh-neobank-2024/12900?page=5 | "I find it unfortunate that Yuh does not allow the transfer of securities…" — kawansky | Yuh locks in securities positions — no in-kind transfer out to a cheaper broker; users are trapped unless they sell (triggering fees) | Yuh | Not stated | Feb 19, 2025 |
| https://forum.mustachianpost.com/t/yuh-neobank-2024/12900?page=5 | "Finally an opportunity to sell and move to real brokers?" — Dr.PI | Community consensus that Yuh is not a "real" broker — a stepping stone, not a long-term solution; users planning exit | Yuh, IBKR (implied destination) | Not stated | Feb 19, 2025 |
| https://forum.mustachianpost.com/t/yuh-neobank-2024/12900?page=3 | "Their website is still broken" — ma0 | Persistent Yuh platform reliability issues — website non-functional for weeks, unsuitable as primary financial tool | Yuh | Not stated | Jan 22, 2025 |
| https://forum.mustachianpost.com/t/yuh-neobank-2024/12900?page=5 | "I wrote them last week about the mess of the interest rate calculation. No answer after 1 week." — Fizzy | Yuh customer service unresponsive to billing errors — compounds the unreliability of using Yuh for serious financial management | Yuh | Not stated | Feb 10, 2025 |
| https://forum.mustachianpost.com/t/the-situation-of-a-self-employed-worker/12697 | "I am a 36 years old independant worker, permit C, I just founded my own cabinet" — Dad | Self-employed individual building financial structure from scratch — no 2nd pillar, only 3a via VZ; switching to VIAC/finpension | VZ, VIAC, finpension | Age: 36, self-employed sole proprietor, permit C | May 8, 2024 |
| https://forum.mustachianpost.com/t/the-situation-of-a-self-employed-worker/12697 | "No 2nd pillar as they aren't worth it when you are self-employed" — Cortana | Self-employed users face a structurally different pension path — no BVG, only 3a at 20% net income; calculating max contribution is non-trivial with irregular income | VIAC, finpension | Not stated | May 9, 2024 |

---

### Persona 6 — Summary

- **Quotes found:** 9 (all verbatim, sourced)
- **Top 3 pain points by frequency:**
  1. Yuh fee structure (0.5–0.95%) makes it unsuitable for serious investing — users outgrow it and plan exit (3 quotes)
  2. Yuh platform reliability — broken website, unresponsive customer service, interest calculation errors (3 quotes)
  3. Securities transfer lock-in on Yuh — cannot move positions to cheaper broker without sell-fee trigger (1 quote; ≥3 threshold not met — do not flag as confirmed pattern yet)
- **Persona gap documented:** Direct evidence of Yuh + ZKB simultaneous usage by a self-identified self-employed individual was NOT found. The self-employed + multi-account + Yuh combination exists as an inferred pattern from separate threads, not a single sourced voice.
- **Brokers most mentioned:** Yuh (critiqued), IBKR (destination), VIAC/finpension (3a), Swissquote (implied "real broker")
- **Recurring vocabulary:** "fees", "0.5%", "0.95%", "transfer of securities", "real brokers", "broken", "unfortunate", "beginner mistakes"
- **Hypothesis status:** Partially validated — Yuh fee/platform pain confirmed by multiple independent voices. Self-employed + 3a complexity confirmed. Specific "Yuh + ZKB simultaneously used by self-employed" combination: NOT yet sourced from a single identifiable voice.
- **Recommended next searches:** finanzbloggers.com (currently 403), schwiizerfranke.com Yuh reviews (currently 403), r/SwissPersonalFinance Yuh self-employed threads (blocked). Try `site:reddit.com/r/SwissPersonalFinance Yuh ZKB self-employed` once Reddit access is available.

---

*Last updated: 2026-05-30*
