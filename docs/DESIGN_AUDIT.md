# Design Audit — Quantfoli vs. Linear / Vercel / Stripe

**Date:** 2026-05-19
**Author:** Claude (Opus 4.7)
**Scope:** Read-only visual / typographic / system audit. No code changes.
**Reference brands:** Linear.app, Vercel.com, Stripe.com.

---

## TL;DR

The Quantfoli design system is **already strong** — oklch-based palette, tier-aware accent tokens, JetBrains Mono for numeric data, Inter Tight for display, dot-grid texture, glassmorphic surfaces. It does not look like a Tailwind defaults site.

But it reads as **"premium technical SaaS"**, not **"Swiss precision quant tool"**. Three generic markers across surfaces:

1. **Heavy ambient blur + colored blob gradients on every surface.** Linear has them, Vercel doesn't, Stripe doesn't. Reads as "AI-startup, 2024" not "instrument."
2. **Single-axis type system.** Inter / Inter Tight / JetBrains Mono is the same stack as 80% of dev-tool SaaS. No proprietary or unusual choice signals brand.
3. **No Swiss-specific visual signature.** Nothing on the page says "this is a Swiss product." The flag, the CHF symbol, the Helvetica heritage — all absent. The product positions itself on Swissness but does not show Swissness.

The single highest-leverage change is **typography**: drop Inter Tight, adopt a proprietary or distinctive display face (e.g. **GT Walsheim**, **Söhne**, **PP Editorial New**, **Pangram Sans**, or self-hosted **Inter Variable with custom features off**), commit to one heavy weight (700/800) at clamped display sizes, and tighten letter-spacing -3.5% to -4.5%. Everything else is reversible polish.

---

## Section A — Current state per surface

### A.1 Landing (`/`)

**Typography:**
- H1: `Inter Tight 700`, `clamp(42px, 6.5vw, 78px)`, `-0.04em`. The split-line `<br />` + grad-text on second line is well-executed.
- Section H2: `clamp(30px, 4.2vw, 48px)`, `-0.03em`. Consistent.
- Body: 15-19px Inter, line-height 1.6.
- Eyebrow: 11px mono, 0.16em tracking, "oklch(0.78 0.15 258)" indigo.

**Color:**
- Three blob gradients (indigo, violet, mint) at 8-20% opacity, animated.
- Dot grid 28-32px, 2.5% opacity, radial mask.
- Brand gradient indigo→violet on Q mark, primary CTA, status pill.

**Spacing:**
- Section padding 72-96px vertical, mostly consistent.
- Cards `var(--radius)` = 14px, `var(--radius-lg)` = 22px. 4-tier radius scale.

**Component patterns:**
- 6-feature grid (auto-fit minmax 280px).
- Stats strip 4×, indigo grad-text numbers.
- About section with avatar + bio side-by-side.
- Pricing cards with rotating conic-gradient border on Pro card (showy, distinctive).

**Information density:** Balanced. Hero is sparse (good); features section dense (good); about section verbose (slightly long, could trim the second paragraph).

### A.2 Dashboard (`/`)

**Typography:**
- Brand mark `Inter Tight 800`, gradient accent.
- Sidebar nav 13px Inter, 9.5px mono labels with 0.16em tracking. Very nice Linear-esque hierarchy.
- Metric hero: 62px Inter Tight 700, `-0.038em`, with separate `cur` (small currency prefix) and `dec` (smaller decimals). This is the strongest typographic detail in the app.
- Stat box vals: 16-20px JetBrains Mono with tabular-nums.
- Tab bar: 12.5px, animated gradient underline with `tab-underline` keyframe.

**Color:**
- Tier-aware `--accent` tokens — Free indigo, Pro gold (84/.148/80), Advisor purple (78/.16/305). Re-themes the whole shell.
- Ambient tier glow above page (220px height radial).
- Negative `--neg` is true red (70/.175/26), positive `--pos` is mint (82/.156/162). Mint instead of green is distinctive.

**Spacing:**
- Page padding 28px, drops to 14px mobile, 12px ultra-small.
- Card padding `20px 22px`. Consistent.

**Component patterns:**
- Glassmorphic cards (`backdrop-filter: blur(8px)`, `--bg-1` at 90% opacity).
- Sticky topbar with `blur(28px) saturate(2.2)`.
- Animated row-in stagger on table rows (`row-in 0.38s` × 10 staggered delays).
- Ticker tape with edge fades + animated track.

**Information density:** Dense. Reads more "Bloomberg Terminal" than "Linear" — appropriate for the ICP.

### A.3 `/how-it-works`

**Typography:** Inherits dashboard tokens. Hero uses `<main data-tier="advisor">` so accents go purple. Per-portfolio cards use the metric grid pattern.

**Color:** Advisor purple as dominant accent. Disclaimer in low-contrast `var(--ink-3)`.

**Density:** High — methodology block, aggregate stats block, three sample portfolio cards, dual CTA. This is the right call for a marketing-as-methodology page.

### A.4 `/pricing` (inline on landing)

Pricing cards live in `LandingClient.tsx`. Pro card has the rotating conic-gradient border (`lp-pro-card`). Visually loudest element on the page.

### A.5 `/blog`

Pure white text on dark per `48e7154`. Fine. Generic blog layout, nothing distinctive.

---

## Section B — Generic markers identified

For each surface, the top 3 things that make it look "generic AI-startup" rather than "Swiss precision quant tool":

### Landing
1. **Blob gradients + grad-text headline.** This visual vocabulary (purple blobs, gradient text, animated dots) is the dominant 2024 design pattern across Stripe-adjacent SaaS. Linear actively avoids it. Vercel does not use it.
2. **Inter Tight at -0.04em is the default "AI-startup display face" right now.** Cognition, Anthropic, Replit, dozens of others use the same combination. No brand differentiation.
3. **Rotating conic-gradient border on the Pro card.** Effective attention grab; reads as "marketing-Web3" not "precision."

### Dashboard
1. **Glassmorphic ambient blur + blob gradients behind a sticky topbar.** Linear's app surface is matte and unblurred. Bloomberg is unblurred. The blur softens what should be sharp.
2. **Mint positive (`oklch(0.82 0.156 162)`) — perceptually closer to teal than to a finance-trad green or red/blue.** Distinctive but not Swiss. The Swiss flag red is not present anywhere except the `--neg` red, which is dimmer.
3. **`tabbar__btn--active::after` uses `--grad-brand`** (indigo→violet) with `box-shadow: 0 0 10px ...0.55`. Gradient on a 2.5px line is over-articulated.

### `/how-it-works`
1. Same Inter Tight + indigo eyebrow as the marketing page. Nothing visually distinguishes a methodology surface from a sales surface.
2. **No tables of numbers visible above the fold** — the page is "card after card" rather than "here are the numbers." A Bloomberg/quant-doc would lead with the table.
3. **Disclaimer is rendered low-contrast.** Reads as fine-print apology, not as part of the credibility argument. Stripe puts compliance copy in the *same* type weight as body text — it's a feature, not a hide.

---

## Section C — Reference patterns that would translate

### From Linear
- **Sharp corners on dense data surfaces.** Linear uses 6-8px radii in app, 12-16px in marketing. Quantfoli uses 14-22px everywhere. Drop dashboard cards to 10px to look more "instrument."
- **No animated blobs on the app shell.** Static, sharp, no ambient motion. Reserve animation for purposeful state changes.
- **Type uses one display face at three sizes max.** Quantfoli already approximates this; the issue is which display face.

### From Vercel
- **Geist Mono + Geist Sans** — proprietary type system. The strongest brand-signature move in adjacent dev-tool. Quantfoli could buy/license/self-host a distinctive display face for the same effect.
- **Maximum-contrast surfaces.** Vercel's dashboard is `#000` on `#FFF` (light) or `#FFF` on `#000` (dark). Quantfoli's `--bg` is `oklch(0.118 0.012 255)` — slightly blue, slightly off-pure-black. The slight blue is a style choice that costs contrast.
- **No gradient text in product surfaces.** Reserved for the homepage hero only.

### From Stripe
- **Numbers as the hero.** Stripe Atlas, Stripe Sigma, Stripe Reports pages lead with literal numbers ($X processed, Y% growth). `/how-it-works` should do this: the "66 rebalances, +Sharpe in 56% of quarters" statistic should be 80px Inter Tight at the top of the page, not a side-card.
- **Gradient lines as system motif.** Stripe uses the same gradient-line pattern across every product page as visual continuity. Quantfoli could use **a single thin gradient line under every section H2** as a system-wide signature.
- **Compliance copy in body weight.** Don't hide disclaimers.

---

## Section D — Proposed direction

### D.1 Typography (highest leverage)

Recommend **GT Walsheim Pro** or **Söhne** or **Pangram Sans** for display. Reasoning:
- Both have a slight geometric/Swiss-modernist character that fits the brand story.
- Söhne is licensed by Tobias Frere-Jones — strong type design pedigree; trusted by Bloomberg, Apple, NYT (similar editorial register).
- GT Walsheim Pro has Swiss-design heritage (Grilli Type, Zürich). Direct brand fit.
- If budget-constrained: **JetBrains Mono** stays, **Inter** stays for UI, but **drop Inter Tight** and replace display with a free Swiss-character face like **Public Sans**, **Söhne Mono** (free trial), or **PP Editorial New** (paid but cheaper).

Concrete plan:
```css
--font-display: 'Söhne Breit', 'GT Walsheim Pro', 'Inter Tight', system-ui, sans-serif;
--font-ui:      'Inter Variable', system-ui, sans-serif;
--font-mono:    'JetBrains Mono Variable', ui-monospace, monospace;
```

Apply to: `app/layout.tsx` font imports, `app/globals.css` `:root` font tokens. No other code touches.

Scale recommendation (sharper than current):
| Token | Now | Proposed |
|---|---|---|
| Hero H1 | clamp(42, 6.5vw, 78) | clamp(48, 7vw, 96) |
| Section H2 | clamp(30, 4.2vw, 48) | clamp(34, 4.5vw, 56) |
| Metric hero val | 62 | 72 |
| Letter-spacing display | -0.04em | -0.045em (display only); -0.025em (sections) |

### D.2 Color refinement

Keep `--accent-pro` (gold, 84/.148/80) and `--accent-advisor` (purple, 78/.16/305). Per the brand rules, do not touch.

Refine free-tier `--accent` indigo (68/.180/258) — currently identical to Linear's primary. Shift to **slightly cooler / less saturated** to avoid reading as Linear-clone:
- Proposed: `oklch(0.72 0.155 245)` — cleaner blue, less violet undertone.
- Or: introduce a **Swiss accent red** (`oklch(0.62 0.21 28)`) as the single non-tier system color, used for: critical-state pills, max-drawdown spikes on charts, "your worst scenario" call-outs. This becomes the Swiss visual signature.

`--neg` red (70/.175/26) — keep. It's distinct enough from a hypothetical Swiss-red accent.

### D.3 Spacing system

Already on a `4 / 8 / 12 / 14 / 16 / 20 / 22 / 28` scale. **Consolidate to a strict 4px base:** `4, 8, 12, 16, 24, 32, 48, 64, 96`. Drop 14, 20, 22, 28, 26 → snap to nearest. Audit cost: ~30 minutes find-and-replace in `globals.css` and inline `style={{ padding: 22 }}`-type usages.

Vertical rhythm: section spacing should be **64px between cards, 96px between sections, 16px between intra-card elements.** Current values vary.

### D.4 Quantfoli signature visual element (proposal)

Pick ONE and apply consistently:

**Option A — Gridlines as identity.**
Every chart, every card header, every section H2 sits over a 1px hairline at `var(--line)` opacity 0.4. This is the Bloomberg/Reuters move: data lives on a measurable grid. Easiest to implement (one CSS rule), most consistent with the ICP.

**Option B — A single rotating "Q" mark behind the hero.**
SVG monogram, slow rotation, very low opacity. Distinctive but risks "AI startup logo soup."

**Option C — Sparkline ribbon header.**
Every page-level title has a 4-8 char monospace numeric tag next to it (live portfolio Sharpe, or current FX rate, or session timestamp). Reads as "live instrument." Highest brand-differentiation, medium effort.

**Recommendation:** Option A (gridlines) as default visual continuity; Option C (sparkline ribbon) as a single accent moment per page (topbar already has a ticker tape that does ~50% of this — extend it to the marketing pages).

### D.5 Ambient motion budget

Cut by 60%:
- Keep: ticker tape, `pulse-soft` status dot, `row-in` table stagger, `page-in` page-load.
- Remove from default render: `lp-blob` animation, `lp-grad-text` gradient pan, `lp-cta::after` shimmer, `lp-pro-card` border rotation.
- Move all decorative animation behind `@media (prefers-reduced-motion: no-preference)` AND `data-density="comfortable"` (new attribute on `<html>`).

---

## Section E — Implementation phasing

### Phase 1 — Typography + spacing (lowest risk, biggest impact)

**Scope:**
1. License + self-host new display face (Söhne, GT Walsheim, or free fallback). 1-2 days licensing decision.
2. Swap `--font-display` token. 5 minutes.
3. Adjust scale tokens (H1/H2/metric-hero/letter-spacing). 1 hour.
4. Normalise spacing to strict 4px base. 1-2 hours find-replace.

**Risk:** Display-face license cost ($200-1500 one-time). Free fallback path: use **Public Sans** or **PP Neue Montreal Free** — zero cost.
**Effort:** Half-day execution; 1-2 days waiting on licensing.
**Reversibility:** 100% — just change the CSS token back.

### Phase 2 — Component refinement

**Scope:**
1. Drop card radius from 14px → 10px in dashboard surfaces; keep 14-22px on marketing.
2. Remove `lp-blob` and `lp-grad-text` animations from default state; behind motion gate only.
3. Implement Signature Element A (gridlines under section H2 + above charts).
4. Implement signature Element C lite (extend ticker-tape pattern to `/how-it-works` and `/blog`).

**Risk:** Some pages get visually flatter than now; the team has to decide if "less ambient motion" reads as "more confident." A/B if traffic allows.
**Effort:** 1 day.
**Reversibility:** 100%.

### Phase 3 — Surface-by-surface redesign

Per surface, in priority order:
1. **`/how-it-works`** — lead with the number, drop card-first layout. Move "+Sharpe in 56% of quarters" to a hero-sized treatment. (4 hours.)
2. **Landing hero** — keep H1 copy (locked), refine treatment: drop grad-text on second line, replace with display-weight contrast. (2 hours.)
3. **Dashboard topbar** — reduce backdrop-blur saturation from 2.2 to 1.3. Sharper edges. (15 minutes.)
4. **Dashboard table** — drop animated row-in delays; instant render is more "instrument." (10 minutes.)
5. **Pricing cards** — remove rotating conic gradient on Pro card; replace with static 1px gold rule + larger gold price. (1 hour.)

**Risk:** Pricing card change could hurt conversion — Pro card visual prominence is one of its CTAs. **Do A/B if traffic > 200/day on `/`.**
**Effort:** 1-2 days total.
**Reversibility:** 100% on all changes.

---

## Section F — Highest-leverage single change

If only one thing can ship: **swap `--font-display` to Söhne or GT Walsheim Pro, scale H1 up to clamp(48, 7vw, 96), tighten letter-spacing to -0.045em on display.**

This costs <1 day, costs <$1500 in licensing, and immediately moves the brand from "another technical SaaS" toward "Swiss instrument." Everything else compounds on top of this.

If a free fallback is mandatory: **Public Sans Black + Inter Tight retained as secondary.** Public Sans has slight Swiss-modernist tone, zero license cost, well-tested.

---

## What this audit did NOT do

- Did not implement any visual change.
- Did not touch the Hero copy (Session 10 H1 lock respected).
- Did not propose changes to Advisor purple `--accent-advisor` on `/how-it-works` / `/advisor-legal` (brand-relevant; would need explicit approval).
- Did not propose changes to FIDLEG-compliant copy.
- Did not introduce new dependencies (the type-face question is flagged for explicit Dariush decision).
- Did not test mobile-specific rendering edge cases.
