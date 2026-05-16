import type { Metadata } from 'next'
import { LegalLayout, LegalSection, LegalLink } from '@/components/LegalLayout'

export const metadata: Metadata = {
  title: 'Terms of Service — Quantfoli',
}

const EMAIL = 'dariush.tahajomi@gmail.com'

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="12 May 2026">
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By accessing or using Quantfoli (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
          If you do not agree, do not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="2. Description of Service">
        <p>
          Quantfoli is a portfolio analytics platform that provides financial information, risk metrics,
          and quantitative analysis tools for self-directed investors. The Service is operated by Dariush
          Tahajomi as an Einzelunternehmen based in Schaffhausen, Switzerland.
        </p>
      </LegalSection>

      <LegalSection title="3. No Investment Advice">
        <p>
          <strong>Important:</strong> Quantfoli provides financial information and analytical tools for
          informational purposes only. Nothing on this platform constitutes investment advice, financial
          advice, trading advice, or any other type of advice. All analysis, metrics, and outputs (including
          Sharpe Ratio, Efficient Frontier, stress test results, and rebalancing indicators) are illustrative
          and based on historical data.
        </p>
        <p>
          Past performance is not indicative of future results. You are solely responsible for your investment
          decisions. Always consult a qualified financial adviser before making investment decisions.
        </p>
      </LegalSection>

      <LegalSection title="4. Eligibility">
        <p>You must be at least 18 years old to use the Service. By using the Service, you represent that you meet this requirement.</p>
      </LegalSection>

      <LegalSection title="5. User Accounts">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials. You are
          responsible for all activity that occurs under your account. Notify us immediately at{' '}
          <LegalLink href={`mailto:${EMAIL}`}>{EMAIL}</LegalLink> if you suspect unauthorised access.
        </p>
      </LegalSection>

      <LegalSection title="6. Subscriptions and Payments">
        <ul>
          <li>Pro subscriptions are billed monthly at CHF 15/month or yearly at CHF 150/year.</li>
          <li>Advisor subscriptions are billed monthly at CHF 50/month or yearly at CHF 500/year, subject to the additional <LegalLink href="/advisor-legal">Advisor Terms &amp; Disclaimer</LegalLink>.</li>
          <li>Payments are processed by Stripe. By subscribing, you agree to Stripe&apos;s terms of service.</li>
          <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
          <li>You may cancel at any time via the &quot;Manage Subscription&quot; option in the app. Access continues until the end of the current billing period.</li>
          <li>We do not offer refunds for partial months.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to reverse-engineer, scrape, or exploit the Service</li>
          <li>Share your account credentials with others</li>
          <li>Use automated tools to access the Service at scale</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Data Accuracy">
        <p>Market data is sourced from third-party providers (Yahoo Finance, Alpha Vantage). We do not guarantee the accuracy, completeness, or timeliness of any data displayed. Do not rely on this data for time-sensitive trading decisions.</p>
      </LegalSection>

      <LegalSection title="9. Limitation of Liability">
        <p>To the maximum extent permitted by applicable law, Quantfoli and its operator shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits or investment losses, arising from your use of the Service.</p>
        <p>Our total liability to you for any claim arising from the use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
      </LegalSection>

      <LegalSection title="10. Intellectual Property">
        <p>All content, design, and code on Quantfoli is the property of Dariush Tahajomi. You may not reproduce, distribute, or create derivative works without explicit written permission.</p>
      </LegalSection>

      <LegalSection title="11. Governing Law">
        <p>These Terms are governed by the laws of Switzerland. Any disputes shall be subject to the exclusive jurisdiction of the courts of Schaffhausen, Switzerland.</p>
      </LegalSection>

      <LegalSection title="12. Changes to Terms">
        <p>We reserve the right to modify these Terms at any time. We will notify users of material changes via email or in-app notice. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          Questions about these Terms? Email{' '}
          <LegalLink href={`mailto:${EMAIL}`}>{EMAIL}</LegalLink>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
