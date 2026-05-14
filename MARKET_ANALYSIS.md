# Quantfoli — Market Analysis
**Date:** 2026-05-14  
**Author:** Dariush Tahajomi  
**Version:** 1.0

---

## 1. Executive Summary

**Quantfoli** is a Swiss-first portfolio analytics SaaS platform targeting self-directed retail investors who want institutional-quality quantitative tools without paying Bloomberg Terminal prices (USD 24,000/year). The product sits at the intersection of **fintech SaaS**, **personal finance**, and **quantitative analysis** — a triangle that no Swiss competitor currently occupies.

**Business model:** Freemium SaaS — CHF 0 (Free) / CHF 15 per month (Pro)  
**Break-even:** 3–4 paying users (~CHF 45–60/month covers all infrastructure)  
**Revenue target:** 200 Pro users = CHF 3,000/month gross  
**Launch status:** MVP live, Stripe integrated, first payment imminent

---

## 2. Market Sizing

### 2.1 Total Addressable Market (TAM)

**Switzerland: Self-Directed Retail Investors**

| Metric | Value | Source |
|--------|-------|--------|
| Swiss population | 8.8M | BFS 2024 |
| Adults (18–65) | ~5.6M | BFS estimate |
| Estimated investors with brokerage account | ~15–20% | SIX/SNB surveys |
| Swiss self-directed investors | ~840k–1.1M | Derived |
| Avg. monthly SaaS spend tolerance (fintech tools) | CHF 15–50 | Industry benchmark |
| **Swiss TAM (direct)** | **CHF 12.6M–55M/year** | Derived |

**Europe-adjacent SAM (second phase):**
- Germany: ~12M self-directed investors (largest retail market in EU)
- Austria: ~800k
- Liechtenstein, Luxembourg: high-net-worth individual density
- DACH region total SAM (Phase 2): ~CHF 200M–400M/year

### 2.2 Serviceable Addressable Market (SAM)

Filtering for:
- Technically literate enough to use CSV import (≈30% of Swiss investors)
- Aware of / interested in advanced risk metrics (Sharpe, frontier, stress tests)
- Would pay CHF 15/month for tools they currently DIY in Excel or don't have

**Swiss SAM:** ~250k–330k users  
**Potential ARR at 10% conversion to Pro:** CHF 450M/year ceiling (theoretical)  
**Realistic 3-year SAM target:** 2,000–5,000 active users → CHF 360k–900k ARR

### 2.3 Serviceable Obtainable Market (SOM)

**12-month realistic SOM:**
- Phase 1 (Month 1–3): LinkedIn organic, HSG Finance Club → 50–150 free users, 10–30 Pro
- Phase 2 (Month 4–6): Product Hunt launch, Reddit (r/finanzierung, r/personalfinance_ch) → 300–600 free users, 40–80 Pro
- Phase 3 (Month 7–12): SEO traction, broker partnerships (ZKB referral program) → 1,000–2,000 free, 100–200 Pro

**12-month conservative revenue target:** CHF 1,500–3,000/month (100–200 Pro users)  
**12-month stretch target:** CHF 6,000/month (400 Pro users)

---

## 3. Competitive Landscape

### 3.1 Direct Competitors

| Product | HQ | Pricing | Sharpe | Frontier | Stress Test | Swiss Brokers | FX-Adj. Returns |
|---------|-----|---------|--------|----------|-------------|---------------|-----------------|
| **Quantfoli** | CH | CHF 0/15/mo | ✅ | ✅ | ✅ | ZKB, Yuh, Neon | ✅ |
| **Parqet** | DE | €0/€8/€16/mo | ❌ | ❌ | ❌ | Limited | Partial |
| **Portfolio Performance** | DE | Desktop, €14/yr | ✅ | ❌ | ❌ | Manual | Manual |
| **Sharesight** | AU | AUD 0/27/54/mo | Partial | ❌ | ❌ | None | ✅ |
| **Delta** | UK | $0/10/mo | ❌ | ❌ | ❌ | None | ❌ |
| **Morningstar** | US | USD 34.95/mo | ✅ | ❌ | Partial | None | Partial |

### 3.2 Competitive Advantages

**Moat Layer 1 — Swiss-First Integration:**
- ZKB CSV parser (auto-ISIN resolution) — competitors have none
- Yuh Bank and Neon Bank parsers
- CHF-denominated pricing (no conversion friction)
- FIDLEG-compliant disclaimers (legal risk eliminated)
- Frankfurt Vercel region (GDPR data residency satisfied)

**Moat Layer 2 — Quantitative Depth:**
- Markowitz Efficient Frontier with Monte Carlo (2,000 portfolios)
- 4 historical stress scenarios (Dot-com, GFC, COVID, 2022 Bear)
- Rolling volatility regime (Low/Medium/High)
- Full Correlation Matrix with heatmap
- VaR 95%, CVaR 95%, Sortino, Beta, Alpha — all in one dashboard

**Moat Layer 3 — Free Broker Parsers (Acquisition Hook):**
- Free tier locks in users who can't import anywhere else without manual work
- Once CSV import works for their bank, switching cost is high (format familiarity, re-entry friction)

**Moat Layer 4 — Technical Architecture:**
- FX-adjusted returns with historical CHF/USD rates at purchase date (unique feature)
- Time-Weighted Returns (TWR) — capital injection neutral, professional standard
- Full PostgreSQL backend allows complex query logic competitors can't replicate with NoSQL

### 3.3 Competitive Weaknesses (Honest Assessment)

| Weakness | Severity | Fix Timeline |
|----------|----------|--------------|
| Fundamentals API rate-limited (Alpha Vantage 25 req/day) | HIGH | Sprint 2 (FMP API, CHF 14/mo) |
| EOD pricing only (no real-time for Pro) | MEDIUM | Sprint 2 (Polygon.io, USD 29/mo) |
| Pro features front-end gated only (no backend RLS) | HIGH (security) | Post-10 users |
| Markets tab empty | MEDIUM | Sprint 3 |
| Single-person team = bus factor 1 | HIGH (ops risk) | Post-Matura |
| No mobile app | LOW | Post-product-market-fit |
| CHF-only Stripe currency | MEDIUM | Sprint 3 (EUR pricing) |
| Brand unknown (zero backlinks, DA=0) | MEDIUM | 6–12 months SEO |

---

## 4. Target Audience Analysis

### 4.1 Primary Persona: "The Swiss Quant Amateur"

| Attribute | Description |
|-----------|-------------|
| **Age** | 25–45 |
| **Occupation** | Engineer, banker, tech worker, finance student |
| **Portfolio size** | CHF 30k–500k |
| **Broker** | ZKB, Swissquote, Neon, Yuh, IB |
| **Current tools** | Excel, Parqet, Yahoo Finance, raw broker interface |
| **Pain point** | Broker shows P&L but not Sharpe, stress exposure, or efficient allocation |
| **Trigger to pay** | Efficient Frontier shows they're under-diversified; wants proof |
| **Preferred channel** | LinkedIn (finance), Reddit (r/personalfinance_ch), Twitter/X (quantfinance) |
| **Decision cycle** | 1–3 days (low-ticket SaaS, self-serve) |
| **Language** | German, English (bilingual) |

### 4.2 Secondary Persona: "The Finance Student"

| Attribute | Description |
|-----------|-------------|
| **Age** | 18–25 |
| **Context** | HSG St. Gallen, Uni Zürich, ETH Finance/Economics student |
| **Portfolio size** | CHF 5k–30k |
| **Trigger to use** | Hands-on MPT learning, coursework visualization |
| **Trigger to pay** | Course project requires Sharpe, frontier — tool saves 5 hours |
| **Channel** | HSG Finance Club, campus word-of-mouth, TikTok/Instagram |
| **Conversion probability** | Low (price-sensitive), but high viral coefficient |

### 4.3 Psychographic Profile (Buyer Psychology)

**Core desire:** "I want to manage my portfolio like a professional, not guess."  
**Fear:** Making allocation mistakes that cost real CHF; not knowing their true risk exposure.  
**Frustration:** Parqet shows performance but not *why* or *what to do*.  
**Aspiration:** Understand their portfolio the way a quant fund would.  
**Trigger phrase:** "Institutional-grade analytics for self-directed investors."

---

## 5. Go-to-Market Strategy

**Revised channel priority rationale:**
- **SEO** moved to Phase 1 (not Phase 3): 3–6 month indexing lag means starting today = ranking in August. Starting in August = ranking in February 2027. Zero-CAC channel with years-long half-life. LinkedIn posts decay in 48h.
- **Press** moved to Phase 1: Swiss editorial lead times are 2–6 weeks. Pitch now = coverage at 20–50 users (credible). Wait = coverage at 200 users (less interesting story).
- **Reddit** moved to Phase 1: Organic community presence takes 30–60 days of karma building before tool mentions land. Start now.
- **HSG Finance Club** deferred to Q3/Q4 2026: Dariush starts HSG September 2026. No campus distribution possible before then.
- **Instagram/TikTok/YouTube** added as parallel channel for under-35 demographic.

---

### 5.1 Phase 1: Multi-Channel Launch (Month 1–3)

**Goal:** 80–200 free signups, 8–20 Pro conversions, CHF 120–300/month

**Channels:**

1. **SEO Blog (Start Day 1)**
   - Target keywords (priority order): "Sharpe ratio portfolio", "Efficient Frontier calculator", "Swiss portfolio tracker", "Parqet Alternative", "ZKB portfolio import"
   - Content cadence: 1 pillar article/week (weeks 1–4), then 1 article/2 weeks
   - Articles 1–4: Sharpe ratio, Efficient Frontier, Stress testing, Best Swiss portfolio tools
   - Estimated organic traffic at month 6: 500–2,000 visits/month (low-competition Swiss keywords)
   - Estimated organic traffic at month 12: 3,000–8,000 visits/month

2. **Swiss Fintech Press (Pitch Week 1)**
   - Targets: Finews.ch (German), The Market / NZZ (sophisticated finance), Handelszeitung (business)
   - Story angle: "18-jähriger baut FIDLEG-konformes Quant-Analytics-Tool mit ZKB-Integration für CHF 15/Monat"
   - Lead time: 2–6 weeks → pitch now, coverage arrives in Phase 1
   - One Finews.ch feature = 1,000–5,000 targeted Swiss visitors; conversion rate 3–5x average (editorial context = trust)

3. **Reddit — DACH Investor Communities (Start Week 1)**
   - Primary: r/eupersonalfinance (600k), r/Finanzen (400k), r/personalfinance_ch (15k)
   - Secondary: r/switzerland (300k), r/SecurityAnalysis (200k), r/ETFs (500k)
   - Combined relevant audience: >500k users, German/English bilingual
   - Strategy: 30-day karma warm-up (helpful comments only), then value-first posts mentioning Quantfoli naturally
   - Content: Sharpe ratio tutorials, ZKB import guide, stress test worked examples

4. **LinkedIn (Ongoing, 3x/week)**
   - Posting cadence: Tue–Thu, 07:30–09:00 CET
   - Content pillars: build-in-public, quant education, product demos, founder story
   - Target: 500 impressions/post → 2–5 signups/post → 10–25/month
   - Half-life: 24–48h per post; supplement with SEO for compounding

5. **Multi-Platform — Instagram/TikTok/YouTube (Month 1, parallel)**
   - Instagram Reels: 30s product demos (ZKB import, frontier, stress test) — zero editing required
   - TikTok: 45s educational finance (German for DACH reach), founder story
   - YouTube Shorts: 60s product walkthroughs that also appear in Google Search
   - Repurposing rule: every blog article → Reel script → TikTok script → YouTube Short (one asset, four formats)

6. **Referral Seeding**
   - Personal network: classmates, parents, finance-adjacent contacts
   - "First 100 users" campaign: early adopter badge, locked-in CHF 10/mo for life
   - Referral mechanic: bring 3 users → get 1 month Pro free

### 5.2 Phase 2: Scale + Spike (Month 4–6)

**Goal:** 400–800 free users, 40–80 Pro, CHF 600–1,200/month

**Channels:**

1. **Product Hunt Launch**
   - Execute after 10+ positive user testimonials collected
   - Preparation: 2 weeks (GIF demos, tagline, screenshots, maker comment)
   - Hunter outreach: target fintech/SaaS hunters with 500+ followers
   - Target: Top 5 in "Finance" category
   - Expected: 500–1,000 visitors → 50–100 signups (spike event)

2. **Twitter/X (Quantitative Finance)**
   - Threads: "How I built a Bloomberg-killer for CHF 15/mo", GFC stress test results, TWR vs. simple return
   - Target: 200–500 followers in quant finance niche
   - Repurpose from LinkedIn threads — same content, different format

3. **EUR Stripe Pricing**
   - Add EUR checkout option — opens Germany/Austria (2x Swiss TAM)
   - Estimated DACH expansion: +200–500 additional SAM at comparable conversion rates

### 5.3 Phase 3: Compounding + Partnerships (Month 7–12)

**Goal:** 1,500+ free users, 150–300 Pro, CHF 2,250–4,500/month

**Channels:**

1. **SEO — Full Content Library**
   - By month 12: 20+ published articles, 5+ ranking in top 10 Swiss finance searches
   - Add German-language articles ("Sharpe Ratio berechnen", "Effiziente Grenze Portfolio") — own DACH bilingual searches
   - Traffic milestone: 5,000–10,000 organic visits/month

2. **Broker Partnerships**
   - ZKB referral link in app → explore affiliate program with ZKB digital team
   - Swissquote parser (largest Swiss broker) → partnership discussion
   - Neon Bank co-marketing (fintech-aligned brand)

3. **HSG Finance Club (Q4 2026)**
   - Campus demo: Dariush presents to HSG Finance Club members (100–300 students)
   - Offer: Free Pro for members who refer 3 others
   - Expected: 50–100 signups, 10–20 conversions — high-quality users with long LTV

---

## 6. Pricing Strategy Analysis

### 6.1 Current Pricing

| Tier | Price | Justification |
|------|-------|---------------|
| Free | CHF 0 | Acquisition hook; broker parsers permanently free |
| Pro | CHF 15/month | ~50% of Parqet Pro (EUR 16/mo); 1/1,600x of Bloomberg |

### 6.2 Pricing Psychology

**Why CHF 15 is correct (for now):**
- Below the "mental friction threshold" (CHF 20+ requires conscious decision)
- Comparable to a Netflix subscription (normalized spend behavior)
- Leaves room for annual plan upsell (CHF 150/year = 2 months free → reduces churn)
- Competitor Parqet: EUR 8/16/mo — Quantfoli's pro features justify slight premium

**Future pricing evolution:**
- Annual plan: CHF 150/year (launch at 50 users)
- Pro+: CHF 30/month (real-time data, what-if simulator, SWX integration) — launch at 200 users
- Team/Family plan: CHF 25/month for 3 portfolios — launch at 500 users

### 6.3 Conversion Optimization

**Current conversion path:**
1. Free user hits Pro-gated feature → ProGate modal
2. Modal shows lock icon + "Upgrade to Pro — CHF 15/mo"
3. Stripe Checkout (hosted, auto-detects Apple Pay/Google Pay)
4. Webhook fires → Pro unlocked instantly (8x/sec polling)
5. Welcome to Pro modal appears

**Optimization opportunities:**
- Add "What you unlock" visual comparison in ProGate modal
- Show social proof: "47 investors already using Pro"
- Add urgency (optional): "Launch pricing — price increases after 100 users"
- Exit-intent popup for free users who visit /login then bounce

---

## 7. Financial Projections

### 7.1 Conservative Scenario (Bootstrap)

| Month | Free Users | Pro Users | MRR (CHF) | Infra Cost | Net |
|-------|-----------|-----------|-----------|------------|-----|
| 1 | 30 | 3 | 45 | 50 | -5 |
| 3 | 100 | 12 | 180 | 70 | 110 |
| 6 | 300 | 35 | 525 | 100 | 425 |
| 12 | 800 | 100 | 1,500 | 150 | 1,350 |
| 24 | 2,500 | 300 | 4,500 | 300 | 4,200 |

### 7.2 Growth Scenario (One Viral Hit)

| Month | Free Users | Pro Users | MRR (CHF) |
|-------|-----------|-----------|-----------|
| 1 | 80 | 8 | 120 |
| 3 | 400 | 45 | 675 |
| 6 | 1,200 | 150 | 2,250 |
| 12 | 4,000 | 500 | 7,500 |

**Trigger for growth scenario:** Product Hunt top 5, Swiss press feature, or HSG viral moment.

### 7.3 Key Unit Economics

| Metric | Value |
|--------|-------|
| ARPU (Pro) | CHF 15/month |
| LTV (assumed 18-month retention) | CHF 270 |
| CAC (organic, founder time only) | ~CHF 0 cash |
| LTV/CAC ratio (current) | ∞ (zero paid acquisition) |
| Churn target | <5%/month |
| Payback period | Month 1 (no CAC) |

---

## 8. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Yahoo Finance API ban/change | MEDIUM | HIGH | Add Polygon.io fallback (Sprint 2) |
| Parqet launches Sharpe/Frontier | LOW | HIGH | Deepen quant moat (what-if, VaR UI) |
| Alpha Vantage rate limits break fundamentals | HIGH | MEDIUM | Migrate to FMP (Sprint 2, CHF 14/mo) |
| Swiss FINMA scrutiny | LOW | MEDIUM | FIDLEG disclaimers already in place |
| Single-founder burnout (post-Matura) | MEDIUM | HIGH | Scope control; no feature bloat |
| Supabase outage | LOW | HIGH | Vercel functions cache; add DB read replica |
| Users don't convert (bad PMF) | MEDIUM | HIGH | Validate with 5 user interviews post-launch |

---

## 9. Strategic Recommendations

### Immediate (This Month)
1. **Fix fundamentals rate limit** → FMP API (CHF 14/mo) — this breaks Pro demos
2. **Ship LinkedIn founder post** ("first paying user" trigger) — maximum attention window is NOW
3. **Add social proof to ProGate modal** — "Join X investors using Pro" (even if X=1)
4. **Annual plan** — CHF 150/year (mention in upgrade flow immediately after launch)

### Short-term (Month 2–3)
5. **HSG Finance Club demo** — one presentation = 50–100 qualified signups
6. **SEO blog** — start with 2 articles: "How to calculate Sharpe ratio" and "Best portfolio tools for Swiss investors"
7. **Swissquote parser** — largest Swiss broker; unlock 3x the addressable market
8. **Backend RLS hardening** — before 10 users; Pro bypass risk is real

### Medium-term (Month 4–6)
9. **Product Hunt launch** — after collecting 10+ positive user testimonials
10. **EUR pricing in Stripe** — opens Germany/Austria market (2x Swiss TAM)
11. **What-if simulator** — highest-demand Pro feature; significant moat deepening
12. **Press outreach** — Finews.ch pitch: "18-year-old builds quant analytics for Swiss retail investors"

---

## 10. Conclusion

Quantfoli occupies a genuine white space: **Swiss-optimized, quant-heavy, free broker parsers, FIDLEG-compliant** — no competitor checks all four boxes. The unit economics are nearly ideal (zero CAC, CHF 270 LTV, CHF 50/month infra break-even at 4 users).

The single largest risk is not competition — it's **distribution velocity**. The product is live and superior to alternatives; the question is purely whether enough Swiss investors find it before Parqet or a well-funded competitor closes the feature gap.

**Highest-ROI action today:** Post the founder trigger on LinkedIn. Every day of delay is lost compound growth on a distribution loop that has zero marginal cost.
