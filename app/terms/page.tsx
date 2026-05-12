import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Quantfoli',
}

export default function TermsPage() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 720, margin: '0 auto', padding: '64px 24px', color: '#e2e8f0', lineHeight: 1.7 }}>
      <Link href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', marginBottom: 40, display: 'inline-block' }}>
        ← Back to Quantfoli
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#f0f4ff' }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 40 }}>Last updated: 12 May 2026</p>

      <Section title="1. Acceptance of Terms">
        <p>By accessing or using Quantfoli ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
      </Section>

      <Section title="2. Description of Service">
        <p>Quantfoli is a portfolio analytics platform that provides financial information, risk metrics, and quantitative analysis tools for self-directed investors. The Service is operated by Dariush Tahajomi, Switzerland.</p>
      </Section>

      <Section title="3. No Investment Advice">
        <p><strong>Important:</strong> Quantfoli provides financial information and analytical tools for informational purposes only. Nothing on this platform constitutes investment advice, financial advice, trading advice, or any other type of advice. All analysis, metrics, and outputs (including Sharpe Ratio, Efficient Frontier, stress test results, and rebalancing indicators) are illustrative and based on historical data.</p>
        <p>Past performance is not indicative of future results. You are solely responsible for your investment decisions. Always consult a qualified financial adviser before making investment decisions.</p>
      </Section>

      <Section title="4. Eligibility">
        <p>You must be at least 18 years old to use the Service. By using the Service, you represent that you meet this requirement.</p>
      </Section>

      <Section title="5. User Accounts">
        <p>You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account. Notify us immediately at <a href="mailto:support@quantfoli.com" style={{ color: '#818cf8' }}>support@quantfoli.com</a> if you suspect unauthorised access.</p>
      </Section>

      <Section title="6. Subscriptions and Payments">
        <ul>
          <li>Pro subscriptions are billed monthly at CHF 15/month.</li>
          <li>Payments are processed by Stripe. By subscribing, you agree to Stripe's terms of service.</li>
          <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
          <li>You may cancel at any time via the "Manage Subscription" option in the app. Access continues until the end of the current billing period.</li>
          <li>We do not offer refunds for partial months.</li>
        </ul>
      </Section>

      <Section title="7. Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to reverse-engineer, scrape, or exploit the Service</li>
          <li>Share your account credentials with others</li>
          <li>Use automated tools to access the Service at scale</li>
        </ul>
      </Section>

      <Section title="8. Data Accuracy">
        <p>Market data is sourced from third-party providers (Yahoo Finance, Alpha Vantage). We do not guarantee the accuracy, completeness, or timeliness of any data displayed. Do not rely on this data for time-sensitive trading decisions.</p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>To the maximum extent permitted by applicable law, Quantfoli and its operator shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits or investment losses, arising from your use of the Service.</p>
        <p>Our total liability to you for any claim arising from the use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
      </Section>

      <Section title="10. Intellectual Property">
        <p>All content, design, and code on Quantfoli is the property of Dariush Tahajomi. You may not reproduce, distribute, or create derivative works without explicit written permission.</p>
      </Section>

      <Section title="11. Governing Law">
        <p>These Terms are governed by the laws of Switzerland. Any disputes shall be subject to the exclusive jurisdiction of the courts of Switzerland.</p>
      </Section>

      <Section title="12. Changes to Terms">
        <p>We reserve the right to modify these Terms at any time. We will notify users of material changes via email or in-app notice. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
      </Section>

      <Section title="13. Contact">
        <p>Questions about these Terms? Email <a href="mailto:support@quantfoli.com" style={{ color: '#818cf8' }}>support@quantfoli.com</a>.</p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#94a3b8' }}>{children}</div>
    </section>
  )
}
