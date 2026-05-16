import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalLayout, LegalSection, LegalLink } from '@/components/LegalLayout'
import { ADVISOR_TERMS_VERSION } from '@/lib/advisor-terms'

export const metadata: Metadata = {
  title: 'Advisor Terms — Quantfoli',
  description: 'Quantitative analysis service terms — Quantfoli Advisor tier.',
}

const EMAIL = 'dariush.tahajomi@gmail.com'

export default function AdvisorLegalPage() {
  return (
    <LegalLayout
      title="Advisor Terms & Disclaimer"
      lastUpdated="16 May 2026"
      versionNote={
        <span style={{ color: 'var(--ink-3)' }}>
          Version {ADVISOR_TERMS_VERSION} · v1.1 — descriptive-only example wording in §2;
          no substantive change to your rights or obligations.
        </span>
      }
    >
      <LegalSection title="1. What Advisor Is">
        <p>Quantfoli Advisor is a paid tier of the Quantfoli analytics platform. It provides quantitative analysis of the holdings you have entered into your Quantfoli portfolio, delivered as a monthly written report via email.</p>
        <p>A typical Advisor report contains: descriptive statistics of your current portfolio (weights, volatility, correlations), model-optimal weights computed from Modern Portfolio Theory (Markowitz) using historical return covariance, Fama-French factor exposure breakdowns, and a quarterly weight-drift table. Every figure is generated mathematically from public end-of-day market data.</p>
      </LegalSection>

      <LegalSection title="2. What Advisor Is NOT">
        <p><strong>Advisor is not investment advice.</strong> Quantfoli is not a licensed financial adviser, asset manager, or financial intermediary under Swiss law (FINIG, FIDLEG). Quantfoli has no fiduciary duty to you, performs no suitability assessment, and tailors no recommendation to your personal financial situation, risk tolerance, tax position, or objectives.</p>
        <p>An Advisor report is a descriptive document. A typical line reads, for example: <em>&quot;Position AAPL — current weight 40.0%; model-optimal weight under historical covariance: 28.0%; delta: −12.0pp.&quot;</em> Such lines are mathematical outputs of a historical model. They describe what the model computes; they do not instruct you to take any action. Past performance is not indicative of future results. The Markowitz framework, like any model, can and does fail under regime changes, fat-tail events, and structural market shifts.</p>
      </LegalSection>

      <LegalSection title="3. Your Decisions Are Your Own">
        <p>You alone decide whether to act on any quantitative observation contained in an Advisor report. You execute all trades through your own brokerage. Quantfoli has no access to your brokerage accounts, holds no power of attorney, and cannot place trades on your behalf.</p>
        <p>By subscribing to Advisor you confirm that:</p>
        <ul>
          <li>You are an adult capable of making your own investment decisions;</li>
          <li>You understand that any trade you place is your sole responsibility;</li>
          <li>You will not interpret any Quantfoli report as a personal recommendation to buy, sell, or hold any specific financial instrument;</li>
          <li>You will, where appropriate, consult a licensed Swiss financial adviser before making investment decisions.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. No Guarantee of Performance">
        <p>Quantfoli makes no representation, warranty, or guarantee — express or implied — regarding the future performance of any portfolio, instrument, or strategy. The efficient frontier, Sharpe ratio, beta, alpha, VaR, CVaR, and all other metrics produced by Quantfoli are estimates based on historical data and standard academic assumptions. They may be materially wrong.</p>
      </LegalSection>

      <LegalSection title="5. Data Limitations">
        <p>Market data is sourced from third-party providers (Yahoo Finance, Alpha Vantage). Quantfoli does not guarantee the accuracy, completeness, or timeliness of any data displayed or used in reports. Reports rely on end-of-day prices and may be stale relative to live market conditions at the time you read them.</p>
      </LegalSection>

      <LegalSection title="6. Limitation of Liability">
        <p>To the maximum extent permitted by Swiss law, Quantfoli and its operator (Dariush Tahajomi, Einzelunternehmen, Schaffhausen) shall not be liable for any loss, damage, missed gain, opportunity cost, tax consequence, or other harm — direct, indirect, incidental, consequential, or punitive — arising from your use of the Advisor service or your reliance on any report or output thereof.</p>
        <p>Total liability for any claim arising from the Advisor service shall not exceed the total fees you paid Quantfoli in the twelve months preceding the claim.</p>
      </LegalSection>

      <LegalSection title="7. Cancellation and Refunds">
        <p>You may cancel Advisor at any time via the &quot;Manage Subscription&quot; option in the Quantfoli app or the Stripe Customer Portal. Cancellation takes effect at the end of the current billing period. No refunds are issued for partial months or unused portions of a yearly plan.</p>
      </LegalSection>

      <LegalSection title="8. Record of Acceptance">
        <p>When you subscribe to Advisor, Quantfoli records the date, time, and version of these terms you accepted, together with your user ID. This record is retained for the duration of your account and for ten years thereafter, for the purpose of evidencing the contractual basis of the service.</p>
      </LegalSection>

      <LegalSection title="9. Governing Law and Jurisdiction">
        <p>These Advisor Terms are governed by the substantive laws of Switzerland, excluding its conflict-of-law rules. The exclusive place of jurisdiction for any dispute is Schaffhausen, Switzerland.</p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Questions about these terms? Email{' '}
          <LegalLink href={`mailto:${EMAIL}`}>{EMAIL}</LegalLink>.
        </p>
      </LegalSection>

      <p style={{ marginTop: 48, fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.6 }}>
        These Advisor Terms are read alongside, and supplement, the general{' '}
        <Link href="/terms" style={{ color: 'var(--brand-b)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Quantfoli Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" style={{ color: 'var(--brand-b)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Privacy Policy
        </Link>
        . In case of conflict, these Advisor Terms govern only the Advisor tier.
      </p>
    </LegalLayout>
  )
}
