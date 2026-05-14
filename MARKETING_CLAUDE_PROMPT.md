# Quantfoli — Claude Code Marketing Project Prompt

> **Usage:** Copy this entire prompt into a new Claude Code session to start a dedicated marketing sprint.  
> **Purpose:** Generate, execute, and systematize all marketing assets for Quantfoli's launch phase.

---

## CONTEXT BLOCK (Read First — Do Not Skip)

You are working on **Quantfoli**, a Swiss-first portfolio analytics SaaS platform built by Dariush Tahajomi (age 18, finishing Swiss Matura 2026, entering HSG St. Gallen).

**Product summary:**
- Portfolio tracker + advanced quant analytics dashboard (Next.js 14, Supabase, Stripe)
- Two tiers: Free (portfolio tracking, CSV import) / Pro CHF 15/month (Sharpe, Efficient Frontier, Stress Testing, Risk Dashboard, Fundamentals)
- Swiss broker CSV parsers: ZKB, Yuh, Neon (unique market differentiator)
- FX-adjusted returns with historical CHF rates (key Swiss feature)
- FIDLEG-compliant (no investment advice)
- Hosted on Vercel Frankfurt (GDPR-compliant)

**Competitive gap vs. Parqet (main Swiss competitor):**
Parqet has no: volatility regime analysis, Efficient Frontier, stress testing, what-if simulator, real FX-adjusted returns.

**Target audience:**
- Primary: Swiss self-directed retail investors, age 25–45, technical/finance-literate
- Secondary: Finance students at HSG St. Gallen, ETH, Uni Zürich
- Psychographic: Wants to manage portfolio like a professional. Frustrated that brokers show P&L but not Sharpe, stress exposure, or optimal allocation.

**Business stage:** MVP live, Stripe integrated, first paying user imminent. Pre-PMF validation phase.

**Founder narrative hook:** 18-year-old Swiss student built institutional-grade quant analytics for retail investors. First paying customer was his mom (the founder trigger for LinkedIn).

**Key channels (priority order):**
1. SEO blog — only zero-CAC channel with compounding returns; content half-life: years not hours
2. Swiss fintech press (Finews.ch, The Market NZZ, Handelszeitung) — Phase 1, highest-quality traffic
3. Reddit — r/eupersonalfinance (500k+), r/Finanzen (300k+), r/switzerland (200k+), r/personalfinance_ch, r/SecurityAnalysis
4. LinkedIn — build-in-public, short half-life but high founder-market fit signal
5. Twitter/X — quant finance niche, longer tail
6. Instagram/TikTok — secondary, younger demographic (finance students)
7. Product Hunt — single event, high spike potential
8. YouTube Shorts — product demo clips, zero editing required

**Deferred channels (Q3/Q4 2026):** HSG Finance Club (Dariush starts HSG in Sept 2026 — all in-person campus distribution deferred until then).

**Working directory:** `/c/AI_System/finance-dashboard-nextjs/.claude/worktrees/crazy-mcnulty-d7c94f/`  
**Market analysis file:** `MARKET_ANALYSIS.md` (read this for full context)

---

## MARKETING SPRINT TASKS

**Execution priority order:**
1. Task 8 (ProGate Copy) — ship today, immediate conversion impact
2. Task 3 (SEO Strategy + Pillar Article) — start immediately, 3–6 month compounding lag means every day of delay costs future traffic
3. Task 4 (Press Pitches) — Phase 1, not Phase 2; Swiss press has long lead times, pitch now
4. Task 6 (Reddit) — start in parallel with SEO; zero cost, drives qualified traffic to new articles
5. Task 1 (LinkedIn Calendar) — ongoing, 3x/week cadence
6. Task 9 (Twitter/X Threads) — asynchronous, batch-write weekly
7. Task 7 (Email Onboarding) — once 20+ free users exist
8. Task 11 (Instagram/TikTok/YouTube) — secondary platform expansion
9. Task 2 (Product Hunt) — after 10+ testimonials collected
10. Task 10 (Metrics KPIs) — set up in first week, then automate

**DEFERRED — DO NOT EXECUTE YET:**
- Task 5 (HSG Finance Club Demo) — Dariush starts HSG September 2026, all campus distribution deferred to Q3/Q4 2026. Remove from active sprint.

Execute the following tasks in order of the priority above. For each task, create the actual deliverable — not a plan or outline. Write the real copy, real code, real posts.

---

### TASK 1: LinkedIn Content Calendar (4 Weeks)

**Deliverable:** `marketing/linkedin/content_calendar.md`

Create a 4-week LinkedIn content calendar with:
- 3 posts per week (Tuesday, Wednesday, Thursday)
- Posting time: 07:30–09:00 CET or 17:30–19:00 CET
- Each post: title, hook (first line — must stop the scroll), full post body (max 1,300 chars), hashtags (max 5)

**Content pillars to rotate:**
1. **Build-in-public** — raw progress, revenue milestones, failures, decisions
2. **Quant education** — Sharpe ratio, Markowitz MPT, stress testing — explained simply, non-textbook
3. **Product demo** — specific feature walkthrough (frontier, risk tab, ZKB import)
4. **Founder story** — 18-year-old, Swiss, pre-Matura, no funding, no team

**Tone rules:**
- Voice: direct, slightly provocative, confident but not arrogant
- No corporate speak, no "I'm excited to announce"
- Lead with a counterintuitive statement or a number
- Swiss/European finance context (mention CHF, ZKB, Swiss brokers where natural)
- Do NOT use emojis unless it's a bullet list

**Week 1 must include:**
- Post 1: The "first paying customer" founder trigger (Mom paid CHF 15)
- Post 2: "Why Parqet doesn't show you what matters" (education + competitive differentiation)
- Post 3: Efficient Frontier demo (screen recording hook + explanation)

---

### TASK 2: Product Hunt Launch Kit

**Deliverable:** `marketing/product_hunt/launch_kit.md`

Create the complete Product Hunt launch package:

**2a. Tagline (5 variations, max 60 chars each)**
Test different angles: quant angle, Swiss angle, anti-Bloomberg angle, simplicity angle.

**2b. Description (250 words)**
Covers: what it is, who it's for, key differentiators (frontier, stress test, ZKB import, CHF pricing), how it works (free → pro flow), call to action.

**2c. Maker Comment (First Comment)**
The post the founder makes immediately after launch. Tone: humble, direct, specific. Include the story of why this was built, one specific insight from building it, and a genuine ask for feedback.

**2d. Launch Day Checklist**
Step-by-step launch day operations: pre-launch (hunter outreach, time zone optimization), launch hour (first comment, engagement schedule), post-launch (follow-up DMs, Reddit cross-post, LinkedIn post).

**2e. Hunter Outreach Template**
Cold DM to 5 potential hunters with 500+ followers in fintech/SaaS space. Personalized but efficient.

---

### TASK 3: SEO Strategy + Pillar Article Cluster

**Why SEO is priority #2:** LinkedIn posts have a 24–48h half-life. A well-ranked article drives traffic for 3–5 years. Swiss fintech SaaS searches are low-competition with commercial intent. Starting today means ranking in 3–6 months; starting in 3 months means ranking in 6–9 months. Every week of delay is lost compounding.

**Deliverables:**
- `marketing/seo/keyword_strategy.md` — keyword map and content plan
- `marketing/seo/pillar_article_sharpe.md` — complete publish-ready article #1
- `marketing/seo/article_2_efficient_frontier.md` — complete article #2

---

**3a. Keyword Strategy**

Create a prioritized keyword map for Quantfoli's blog:

| Priority | Keyword | Monthly volume est. | Competition | Commercial intent | Target article |
|----------|---------|-------------------|-------------|-------------------|----------------|
| 1 | Sharpe ratio portfolio | Medium | Low | High | Article 1 |
| 2 | Efficient frontier calculator | Low | Very Low | High | Article 2 |
| 3 | Swiss portfolio tracker | Very Low | None | Very High | Landing page |
| 4 | ZKB portfolio import | None | None | Very High | Help doc / SEO page |
| 5 | stress test portfolio | Low | Low | Medium | Article 3 |
| 6 | best portfolio app Switzerland | Low | Low | Very High | Comparison article |
| 7 | Sharpe ratio berechnen | Low | Low | High | DE article (bilingual) |
| 8 | Parqet Alternative | Very Low | None | Very High | Comparison article |

For each keyword: write the rationale (why Quantfoli can rank, what intent it serves).

**3b. Pillar Article #1 — Sharpe Ratio**

**Title:** "Sharpe Ratio Calculator for Portfolio Investors — What It Is, How to Use It, and Why Your Broker Doesn't Show It"

**Target keyword:** "Sharpe ratio portfolio" (primary), "Sharpe ratio calculator" (secondary)

Requirements:
- Length: 1,800–2,500 words
- Structure: H1, H2s, H3s — proper hierarchy
- Include: formula explanation, worked example with real CHF numbers (e.g., CHF 80k portfolio, 3 positions), Python code snippet for manual calculation, comparison table (Quantfoli vs. Excel vs. Parqet vs. nothing)
- CTA at bottom: soft CTA to try Sharpe ratio in Quantfoli (free tier)
- Tone: expert but readable for a non-quant; no textbook language
- SEO meta description (155 chars)
- Suggested internal links to articles 2 and 3 (marked with `<!-- INTERNAL LINK: -->` comments)
- German version note: flag sentences that should be adapted for a bilingual DE/EN Swiss audience

**3c. Pillar Article #2 — Efficient Frontier**

**Title:** "Efficient Frontier: How to Find the Optimal Portfolio Allocation (Without a Bloomberg Terminal)"

**Target keyword:** "efficient frontier calculator" (primary), "Markowitz portfolio optimization" (secondary)

Requirements:
- Length: 1,500–2,000 words
- Include: intuitive explanation of MPT (no math-first), worked example with 3-asset CHF portfolio, screenshot description of what Quantfoli's frontier chart looks like, why 2,000 Monte Carlo simulations matter
- CTA: "Run your efficient frontier free — no Excel needed"
- Meta description (155 chars)

---

### TASK 4: Swiss Fintech Press Pitch

**Why Phase 1, not Phase 2:** Swiss press (especially Finews.ch) has lead times of 2–6 weeks. Pitching now means coverage hits when Quantfoli has 20–50 users — more credible than a cold product. One Finews.ch article delivers exactly the target audience: Swiss, finance-literate, 35–55, CHF-denominated portfolios. Estimated value: 1,000–5,000 targeted visitors, converting at 3–5x above average because the article self-selects for intent.

**Story angle that actually works for Swiss press:**
"Ein 18-jähriger Schweizer Maturand hat ein FIDLEG-konformes Portfolio-Analysetool gebaut, das institutionelle Quant-Methoden (Markowitz, Sharpe, Stress-Tests) für CHF 15/Monat zugänglich macht — und dabei die grössten Retail-Broker der Schweiz (ZKB, Yuh, Neon) direkt integriert."

This angle works because: (a) age = human story, (b) FIDLEG-compliant = legal credibility, (c) ZKB integration = Swiss-specific and verifiable, (d) CHF 15 vs. Bloomberg = concrete contrast.

**Deliverable:** `marketing/press/press_pitches.md`

Write cold pitch emails for all three publications:

**4a. Finews.ch** (Swiss fintech / financial news, German + English)
- Subject line: 3 options
- Body: max 200 words, German preferred
- Lead with: news angle, not product pitch
- Include: age of founder, FIDLEG compliance, ZKB integration, CHF 15 price point
- Attach suggestion: what to include (no attachments >5MB)
- Contact research note: include how to find the correct editor (fintech desk, not general)

**4b. The Market (NZZ)** (sophisticated financial audience, German)
- Different angle: MPT/quant methodology; how Markowitz is now accessible to retail
- Longer body acceptable (250 words) — NZZ readers read
- Lead with: the academic/institutional angle, not the founder story

**4c. Handelszeitung** (Swiss business press, German)
- Angle: entrepreneurship + Swiss fintech ecosystem
- Frame as: Swiss startup story, self-funded, product-market fit validation
- Mention: no VC, no team, bootstrapped while finishing Matura

**4d. Follow-up sequence:**
Write 1 follow-up email (7 days after pitch) for each publication. Short (max 80 words). New hook, not a resend.

---

### TASK 5: HSG Finance Club Demo Script

> **STATUS: DEFERRED — DO NOT EXECUTE IN THIS SPRINT**
>
> Dariush starts HSG St. Gallen in September 2026. All campus/in-person distribution is deferred to Q3/Q4 2026. Execute this task no earlier than August 2026 as pre-semester preparation. Move to a separate sprint at that time.
>
> **Rationale:** Premature preparation of event materials 4+ months before the event wastes tokens and becomes stale. The product will have changed significantly by then (new features, more users, real testimonials).

*Task placeholder preserved for future sprint. Skip during current marketing sprint.*

---

### TASK 6: Reddit Community Strategy

**Deliverable:** `marketing/reddit/strategy.md`

**Target subreddits (confirmed, >500k combined relevant users):**

| Subreddit | Size | Relevance | Self-promo rules |
|-----------|------|-----------|------------------|
| r/eupersonalfinance | ~600k | PRIMARY — European investors, CHF-aware, English | Strict: no affiliate links, tool mentions OK if helpful |
| r/Finanzen | ~400k | PRIMARY — DACH investors, German, Parqet users live here | Moderate: community-oriented, value first |
| r/switzerland | ~300k | SECONDARY — Swiss-specific, high local intent | Allowed with context, not finance-only |
| r/personalfinance_ch | ~15k | PRIMARY — exact target, small but high-intent | Very permissive, community is small |
| r/SecurityAnalysis | ~200k | SECONDARY — advanced investors, quant-curious | No promo; education only |
| r/investing | ~2M | TERTIARY — broad, noisy, low conversion rate | Strict, easy to get banned |
| r/financialindependence | ~1.5M | TERTIARY — FIRE crowd, long-horizon investors | Moderate, tool mentions OK in comments |
| r/ETFs | ~500k | SECONDARY — passive investors, frontier/allocation angle | Permissive if ETF-relevant |

**Priority for first 30 days:** r/eupersonalfinance + r/Finanzen + r/personalfinance_ch — highest intent, lowest noise.

**6a. Community mapping (detailed):**
For each of the 8 subreddits above: posting rules verbatim, best posting times, content format that performs (text post vs. link vs. image), karma threshold for posting, examples of high-upvote posts in that community.

**6b. Value-first posts (5 complete posts, ready to copy-paste):**

Post 1 — r/eupersonalfinance: "I calculated Sharpe ratios for 10 common ETF portfolios. Here's what I found."
Post 2 — r/Finanzen: "Ich habe das Efficient Frontier meines ZKB-Portfolios berechnet — hier die Ergebnisse" (German)
Post 3 — r/personalfinance_ch: "Swiss broker CSV comparison: ZKB vs. Neon vs. Yuh — which has the most useful export format?"
Post 4 — r/eupersonalfinance: "How to stress-test your portfolio against GFC 2008 in Python (with worked example)"
Post 5 — r/Finanzen: "Warum zeigt dein Broker nicht den Sharpe Ratio? (Und wie du ihn selber berechnest)"

Each post: full title, body text (500–1,000 words), flair, natural tool mention at end.

**6c. Comment templates (7 templates):**
Scenarios: "what portfolio tracker do you use?", "how do I calculate Sharpe?", "is Parqet good?", "what's the best tool for Swiss investors?", "how do I run a stress test?", "what is efficient frontier in practice?", "EUR vs CHF for Swiss investors"

Each template: helpful first (3–5 sentences), tool mention last (1 sentence, not a link dump).

**6d. Safe self-promotion rules (10 rules):**
Specific rules based on actual Reddit community norms. Include: karma warm-up strategy (post 10 helpful comments before any tool mention), link formatting (never raw URLs), how to handle mod warnings, when to go direct vs. indirect.

---

### TASK 7: Email Onboarding Sequence

**Deliverable:** `marketing/email/onboarding_sequence.md`

Write a 5-email onboarding sequence for new free users:

| Email | Timing | Goal |
|-------|--------|------|
| Email 1: Welcome | Immediately on signup | Orient → first action (import CSV) |
| Email 2: Aha moment | Day 2 if no import yet | Drive CSV import (the activation event) |
| Email 3: Feature unlock | Day 5 after first import | Introduce Pro features they can't access |
| Email 4: Social proof | Day 10 | Testimonial/story → conversion nudge |
| Email 5: Upgrade offer | Day 14 | Direct Pro upgrade with specific benefit framing |

**For each email:**
- Subject line (primary + A/B variant)
- Preview text (max 90 chars)
- Full email body (plain text, no heavy HTML)
- Primary CTA (single action)
- Unsubscribe and legal footer note

**Tone:** Direct, no fluff, no fake enthusiasm. Write like a quant, not a marketer.

---

### TASK 8: ProGate Modal Copy Optimization

**Deliverable:** Edit files directly in the codebase.

Find the ProGate modal component in the codebase (likely in `components/`) and optimize the copy:

**Current state:** Likely shows generic lock icon + "Upgrade to Pro — CHF 15/mo"

**Rewrite to include:**
1. Specific feature name (e.g., "Efficient Frontier requires Pro")
2. One concrete benefit sentence (e.g., "See the optimal allocation that maximizes your Sharpe ratio")
3. Social proof line (e.g., "Join 47 investors already using Pro" — use a variable or hardcoded placeholder)
4. Primary CTA button: "Unlock Pro — CHF 15/mo"
5. Secondary link: "See what's included →" (links to /pricing or inline list)
6. Risk reversal: "Cancel anytime. No commitment."

**Implementation:**
- Find the actual component file
- Read its current state
- Implement the improved copy
- Preserve all existing functionality and styling

---

### TASK 9: Twitter/X Thread Templates

**Deliverable:** `marketing/twitter/thread_templates.md`

Write 3 complete Twitter/X threads (10–15 tweets each):

**Thread 1: "How I built a Bloomberg-killer for CHF 15/month" (founder story)**
- Start with provocative hook about Bloomberg pricing
- Walk through the technical build (brief, accessible)
- End with product reveal + signup link

**Thread 2: "Your broker is lying to you about your returns" (education + problem)**
- Hook: most investors don't know their real return (TWR vs. simple return)
- Explain Time-Weighted Returns simply
- Show why FX matters for Swiss investors
- Soft product mention at end

**Thread 3: "I ran GFC 2008 stress test on my portfolio. Here's what I found." (demo)**
- Personal portfolio stress test results (anonymized/example data)
- Walk through each crash scenario
- What it means for allocation
- CTA: run yours for free

---

### TASK 11: Multi-Platform Distribution Strategy

**Deliverable:** `marketing/platforms/multi_platform_strategy.md`

LinkedIn has a 24–48h content half-life. The following platforms compound differently and reach segments LinkedIn misses (younger demographic, German-speaking DACH, passive scrollers, search-intent users).

---

**11a. Instagram — Product Demo Reels**

**Audience:** Finance students, younger self-directed investors (22–35), Swiss/German-speaking
**Content format:** 15–30s Reels (screen recordings of product with voiceover or text overlay)
**No-editing approach:** Use QuickTime/OBS → screen record a feature → add text overlay in Instagram → post

Write 5 complete Reel scripts:
- Reel 1: "ZKB import → portfolio in 30 seconds" (product demo)
- Reel 2: "My Sharpe ratio was 0.3. After optimizing: 0.87." (frontier outcome)
- Reel 3: "How my portfolio would have performed in GFC 2008" (stress test demo)
- Reel 4: "What your broker doesn't show you" (problem awareness)
- Reel 5: "I built this tool in 6 weeks. CHF 15/mo. Here's what it does." (founder story)

For each: opening hook (text overlay, first 3 frames), voiceover script (max 30 words), closing CTA (swipe up / link in bio), hashtags (max 10).

**11b. TikTok — Educational Finance Shorts**

**Audience:** Gen Z investors (18–28), Swiss, German, Austrian — finance-curious but not yet self-directed
**Content format:** 30–60s videos, talking head OR screen recording with voiceover
**Best angle:** Education first (Sharpe ratio explained, Markowitz explained), product reveal at end

Write 4 complete TikTok scripts:
- TikTok 1: "Was ist der Sharpe Ratio? (Erklärt in 45 Sekunden)" — German, education
- TikTok 2: "Why most investors don't know their real portfolio risk" — English, problem framing
- TikTok 3: "I stress-tested my portfolio against the 2008 crash. The result shocked me." — English, hook/reveal
- TikTok 4: "POV: You're 18 and you built a Bloomberg alternative" — founder story, Gen Z format

For each: hook (first 3 seconds — must prevent scroll), full script (word-for-word), CTA, trending audio suggestion (describe style, don't name specific tracks).

**11c. YouTube Shorts — Product Walkthroughs**

**Audience:** Self-directed investors who search YouTube for finance tools, tutorials
**Search intent:** "portfolio tracker tutorial", "Sharpe ratio explained", "how to use efficient frontier"
**Advantage:** YouTube Shorts appear in Google search results — directly extends SEO strategy

Write 3 complete YouTube Shorts scripts:
- Short 1: "Quantfoli Demo — Full Portfolio in 60 Seconds" (product overview)
- Short 2: "Efficient Frontier Explained in 60 Seconds" (educational, soft product mention)
- Short 3: "How I Built a SaaS Tool While Still in High School" (founder story, algorithm-friendly)

For each: title (SEO-optimized), description (include target keyword), full script, thumbnail description, tags list.

**11d. YouTube Long-form (Optional, Month 3+)**

Plan for 1 full YouTube video (10–15 min) to go alongside the SEO blog:
- Title: "How to Analyze Your Portfolio Like a Hedge Fund (Free Tool)"
- Chapter structure
- SEO meta
- Description template with keyword placement

**11e. Cross-Platform Repurposing Matrix**

Create a table showing how each piece of content maps across platforms:

| Core content | LinkedIn post | Reddit post | Instagram Reel | TikTok | YouTube Short | Blog article |
|-------------|--------------|-------------|----------------|--------|----------------|--------------|
| Sharpe ratio explanation | ✅ (thread) | ✅ (tutorial) | ✅ (30s) | ✅ (45s) | ✅ (60s) | ✅ (pillar) |
| GFC stress test results | ✅ | ✅ | ✅ | ✅ | ✅ | future |
| ZKB import demo | ✅ | comment | ✅ | ✅ | ✅ | ✅ (help doc) |
| Founder story | ✅ (Week 1) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Frontier optimization | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ (article 2) |

**Rule:** Create once (LinkedIn/blog), atomize into every format. Never create platform-specific content from scratch — always derive from a core asset.

---

### TASK 10: Metrics Dashboard — Marketing KPIs

**Deliverable:** `marketing/metrics/kpi_tracker.md`

Create the complete marketing KPI tracking framework:

**10a. North Star Metric:** Define the single most important metric for this stage (pre-PMF).

**10b. Weekly KPI dashboard template:**
Build a simple markdown table updated weekly with:
- Acquisition: LinkedIn impressions, clicks, signups from LinkedIn
- Activation: CSV imports completed, time-to-first-value
- Revenue: New Pro conversions, MRR, churn
- Referral: Signups from word-of-mouth (UTM source=referral)

**10c. 90-day OKR:**
Write 3 Objectives with 2–3 Key Results each. Ambitious but achievable for a solo founder.

**10d. Decision rules:**
For each KPI, define the threshold that triggers a strategic pivot. Example: "If free → Pro conversion rate <1% after 100 free users → interview 5 users before any new features."

---

## EXECUTION RULES

1. **Do not plan — build.** Every task produces a real deliverable, not a roadmap.
2. **For copy tasks:** Write the actual copy, not placeholders. No [INSERT NAME HERE].
3. **For code tasks:** Read the file first, then edit. Verify the change compiles.
4. **For strategy tasks:** Be specific. "Post on Reddit" is not a strategy. "Post a tutorial thread on r/personalfinance_ch explaining Sharpe ratio with a worked CHF example, mentioning Quantfoli as the tool used to generate the chart" is a strategy.
5. **Token efficiency:** Output deliverables directly. Skip preamble and meta-commentary.
6. **Swiss context:** When in doubt, use CHF not USD, mention ZKB not Schwab, think FIDLEG not SEC. The product is Swiss-first.
7. **Founder voice:** All copy must sound like a 18-year-old quantitative finance obsessive who actually knows what they're talking about — not a marketing department.

---

## DELIVERABLE STRUCTURE

After completing all tasks, the `marketing/` directory should contain:

```
marketing/
├── linkedin/
│   └── content_calendar.md
├── seo/
│   ├── keyword_strategy.md
│   ├── pillar_article_sharpe.md
│   └── article_2_efficient_frontier.md
├── press/
│   └── press_pitches.md
├── reddit/
│   └── strategy.md
├── platforms/
│   └── multi_platform_strategy.md      ← Instagram, TikTok, YouTube
├── email/
│   └── onboarding_sequence.md
├── twitter/
│   └── thread_templates.md
├── product_hunt/
│   └── launch_kit.md
├── metrics/
│   └── kpi_tracker.md
└── events/
    └── hsg_demo_script.md              ← DEFERRED: execute Q3/Q4 2026
```

**Start sequence:**
1. **Task 8** (ProGate Copy) — ship today, zero dependencies
2. **Task 3** (SEO — keyword strategy first, then articles) — compounding channel, start immediately
3. **Task 4** (Press pitches) — send within first week; 2–6 week editorial lead time
4. **Task 6** (Reddit — join subreddits, begin karma warm-up) — parallel with SEO
5. Everything else follows. Task 5 is suspended until August 2026.
