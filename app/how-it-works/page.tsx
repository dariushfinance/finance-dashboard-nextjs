import type { Metadata } from 'next'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import { ADVISOR_TERMS_VERSION } from '@/lib/advisor-terms'
import { HeroChart } from '@/components/backtest/HeroChart'
import { SamplePortfolioCard, loadPortfolio } from '@/components/backtest/SamplePortfolioCard'
import { CopyLinkButton } from '@/components/backtest/CopyLinkButton'
import { CTACards } from '@/components/backtest/CTACards'
import { Disclaimer } from '@/components/backtest/Disclaimer'

const TITLE = 'Markowitz, Sharpe, and stress tests — on your actual ZKB depot.'
const DESC  = 'Out-of-sample, walk-forward backtests on Swiss-broker-accessible instruments, 2019–2024, net of Swiss trading costs and stamp duty.'

export const metadata: Metadata = {
  title: 'How it works · Quantfoli',
  description: 'The portfolio tool your quant friend uses. Walk-forward backtests on a typical Swiss portfolio, net of costs.',
  openGraph: { title: TITLE, description: DESC, type: 'website' },
  twitter:   { card: 'summary_large_image', title: TITLE, description: DESC },
}

interface AggregateJson {
  pooled: Record<string, {
    sharpeDelta: { mean: number; median: number; n: number; pctPositive: number }
    volDelta:    { mean: number; median: number; n: number; pctPositive: number }
  }>
  worstQuarter: { date: string; portfolio: string; benchmark: string; sharpeDelta: number } | null
  portfolios: { id: string; title: string; nRebalances: number }[]
}

async function loadAggregate(): Promise<AggregateJson> {
  const raw = await fs.readFile(path.join(process.cwd(), 'public', 'backtests', 'aggregate.json'), 'utf8')
  return JSON.parse(raw)
}

function pct(x: number, d = 0) { return `${(x * 100).toFixed(d)}%` }

export default async function HowItWorksPage() {
  const [aggregate, conservative, growth, concentrated] = await Promise.all([
    loadAggregate(),
    loadPortfolio('conservative'),
    loadPortfolio('growth'),
    loadPortfolio('concentrated'),
  ])

  const eqStats = aggregate.pooled['equal-weight']
  const startStats = aggregate.pooled['starting-allocation']

  return (
    <main data-tier="advisor" style={{
      fontFamily: 'Inter, sans-serif',
      maxWidth: 980, margin: '0 auto',
      padding: '48px 24px 80px',
      color: 'var(--ink-2)',
    }}>
      <Link
        href="/"
        style={{ fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28 }}
      >
        ← Back to Quantfoli
      </Link>

      {/* Hero */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ width: 48, height: 3, borderRadius: 2, background: 'var(--grad-brand)', boxShadow: '0 0 18px oklch(0.64 0.190 285 / 0.45)', marginBottom: 18 }} />
        <h1 style={{
          fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em',
          margin: '0 0 10px',
          background: 'var(--grad-brand)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', display: 'inline-block',
        }}>
          {TITLE}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 720 }}>
          {DESC}
        </p>

        <div style={{
          border: '1px solid var(--line-soft)', borderRadius: 14, padding: 18,
          background: 'var(--bg-1)',
        }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', marginBottom: 10 }}>
            Sample portfolio: SMI single-stock-heavy retail · {concentrated.range.start} → {concentrated.range.end}
          </div>
          <HeroChart data={concentrated} height={320} />
        </div>
      </section>

      {/* Methodology */}
      <section id="methodology" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
          How we tested this
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, lineHeight: 1.6 }}>
          <li><strong style={{ color: 'var(--ink)' }}>Out-of-sample only.</strong> The model at date T sees no data from after T.</li>
          <li><strong style={{ color: 'var(--ink)' }}>Walk-forward.</strong> Re-fitted every quarter on the data available at that moment, then frozen for the following 90 days.</li>
          <li><strong style={{ color: 'var(--ink)' }}>Net of costs.</strong> 0.50% commission, 0.10% spread, 0.15% Swiss stamp duty (0.30% for foreign-domiciled instruments) subtracted on every simulated trade.</li>
          <li><strong style={{ color: 'var(--ink)' }}>All backtests shown.</strong> Losing periods are reported alongside winning ones — see aggregate statistics below.</li>
          <li><strong style={{ color: 'var(--ink)' }}>Two benchmarks per run.</strong> Each model run is compared against an equal-weighted rebalanced portfolio and a buy-and-hold version of the same starting allocation.</li>
        </ul>
      </section>

      {/* Aggregate stats — screenshot-quotable */}
      <section
        id="aggregate-stats"
        style={{
          scrollMarginTop: 80,
          padding: 24, marginBottom: 40,
          border: '1.5px solid oklch(0.78 0.16 305 / 0.35)',
          background: 'oklch(0.78 0.16 305 / 0.04)',
          borderRadius: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em' }}>
            Aggregate results · {eqStats.sharpeDelta.n} measured periods
          </h2>
          <CopyLinkButton anchor="aggregate-stats" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <StatBox
            headline={`+Sharpe in ${pct(eqStats.sharpeDelta.pctPositive)} of quarters`}
            detail={`vs. equal-weighted · n = ${eqStats.sharpeDelta.n} rebalances`}
          />
          <StatBox
            headline={`Mean Sharpe Δ: ${eqStats.sharpeDelta.mean >= 0 ? '+' : ''}${eqStats.sharpeDelta.mean.toFixed(3)}`}
            detail={`Median: ${eqStats.sharpeDelta.median >= 0 ? '+' : ''}${eqStats.sharpeDelta.median.toFixed(3)}`}
          />
          <StatBox
            headline={`Vol reduced in ${pct(1 - eqStats.volDelta.pctPositive)} of cases`}
            detail={`Mean Δ vol: ${eqStats.volDelta.mean >= 0 ? '+' : ''}${(eqStats.volDelta.mean * 100).toFixed(2)} pp`}
          />
          {aggregate.worstQuarter && (
            <StatBox
              headline={`Worst quarter: ${aggregate.worstQuarter.sharpeDelta.toFixed(2)} Sharpe`}
              detail={`${aggregate.worstQuarter.date} · ${aggregate.worstQuarter.portfolio} vs. ${aggregate.worstQuarter.benchmark}`}
              negative
            />
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 16, lineHeight: 1.6 }}>
          Vs. the user&apos;s starting allocation rebalanced on the same schedule, the model improved Sharpe in {pct(startStats.sharpeDelta.pctPositive)} of periods
          (mean Δ {startStats.sharpeDelta.mean >= 0 ? '+' : ''}{startStats.sharpeDelta.mean.toFixed(3)}).
          In periods following major regime changes (COVID March 2020, 2022 rate shock), the model has historically produced lower returns than the buy-and-hold benchmark —
          walk-forward optimization adapts after the regime change, not during it.
        </p>
      </section>

      {/* Sample portfolios */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 18px', letterSpacing: '-0.01em' }}>
          Three sample portfolios
        </h2>
        <SamplePortfolioCard
          data={conservative}
          anchor="portfolio-conservative"
          whyText="Mixing global equity with global aggregate bonds gives the optimizer two genuinely different return drivers — Markowitz has room to re-weight as the equity/bond risk balance shifts across regimes."
        />
        <SamplePortfolioCard
          data={growth}
          anchor="portfolio-growth"
          whyText="Four distinct equity buckets (global, US large-cap, developed-world, emerging) carry different exposures to the dollar, US tech, and EM growth — enough cross-sectional variation for the optimizer to add value net of costs."
        />
        <SamplePortfolioCard
          data={concentrated}
          anchor="portfolio-concentrated"
          whyText="Swiss large-caps are highly correlated — NESN, NOVN, ROG, UBSG and ZURN all move with global risk-on / risk-off. Markowitz has little to diversify across, so per-rebalance trading costs outweigh the small allocation gains. The Advisor report flags exactly this kind of structural concentration and describes the correlation properties of the holdings and quantifies the diversification deficit relative to the broader market."
        />
      </section>

      {/* CTA */}
      <CTACards />

      {/* Disclaimer */}
      <Disclaimer termsVersion={ADVISOR_TERMS_VERSION} />
    </main>
  )
}

function StatBox({ headline, detail, negative }: { headline: string; detail: string; negative?: boolean }) {
  return (
    <div style={{
      padding: '16px 18px',
      background: 'var(--bg-1)',
      border: '1px solid var(--line-soft)',
      borderRadius: 10,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700,
        color: negative ? 'var(--neg)' : 'var(--accent, oklch(0.82 0.15 305))',
        lineHeight: 1.3,
      }}>
        {headline}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
        {detail}
      </div>
    </div>
  )
}
