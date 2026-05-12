import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Quantfoli',
}

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 720, margin: '0 auto', padding: '64px 24px', color: '#e2e8f0', lineHeight: 1.7 }}>
      <Link href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', marginBottom: 40, display: 'inline-block' }}>
        ← Back to Quantfoli
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#f0f4ff' }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 40 }}>Last updated: 12 May 2026</p>

      <Section title="1. Who We Are">
        <p>Quantfoli ("we", "us", "our") is a portfolio analytics platform operated by Dariush Tahajomi, Switzerland. Contact: <a href="mailto:dariush.tahajomi@gmail.com" style={{ color: '#818cf8' }}>dariush.tahajomi@gmail.com</a></p>
      </Section>

      <Section title="2. Data We Collect">
        <p>We collect the following data when you use Quantfoli:</p>
        <ul>
          <li><strong>Account data:</strong> email address and password (stored securely via Supabase Auth).</li>
          <li><strong>Portfolio data:</strong> ticker symbols, share quantities, purchase prices, and dates that you enter or import.</li>
          <li><strong>Payment data:</strong> billing information processed by Stripe. We never store card details — Stripe handles this entirely.</li>
          <li><strong>Usage data:</strong> anonymous analytics (page views, feature usage) via Vercel Analytics.</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Data">
        <ul>
          <li>To provide portfolio analytics, returns calculation, and risk metrics.</li>
          <li>To process payments and manage your subscription via Stripe.</li>
          <li>To improve the product based on aggregated usage patterns.</li>
          <li>To contact you about your account if necessary.</li>
        </ul>
        <p>We do not sell your data. We do not use your portfolio data for advertising.</p>
      </Section>

      <Section title="4. Third-Party Services">
        <p>We use the following third-party services, each with their own privacy policies:</p>
        <ul>
          <li><strong>Supabase</strong> — database and authentication (EU servers)</li>
          <li><strong>Stripe</strong> — payment processing</li>
          <li><strong>Vercel</strong> — hosting and analytics</li>
          <li><strong>Yahoo Finance</strong> — market data (public endpoints, no personal data sent)</li>
        </ul>
      </Section>

      <Section title="5. Data Retention">
        <p>We retain your data as long as your account is active. You may request deletion of your account and all associated data at any time by emailing <a href="mailto:dariush.tahajomi@gmail.com" style={{ color: '#818cf8' }}>dariush.tahajomi@gmail.com</a>. We will process deletion requests within 30 days.</p>
      </Section>

      <Section title="6. Your Rights (GDPR)">
        <p>If you are located in the EU or Switzerland, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict processing</li>
          <li>Data portability</li>
        </ul>
        <p>To exercise any of these rights, contact <a href="mailto:dariush.tahajomi@gmail.com" style={{ color: '#818cf8' }}>dariush.tahajomi@gmail.com</a>.</p>
      </Section>

      <Section title="7. Security">
        <p>All data is transmitted over HTTPS. Portfolio data is stored in a secured Supabase database with row-level security. Passwords are never stored in plaintext.</p>
      </Section>

      <Section title="8. Cookies">
        <p>We use a single session cookie for authentication purposes. We do not use tracking or advertising cookies.</p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>We may update this policy from time to time. We will notify users of material changes via email or an in-app notice.</p>
      </Section>

      <Section title="10. Contact">
        <p>Questions about this policy? Email <a href="mailto:dariush.tahajomi@gmail.com" style={{ color: '#818cf8' }}>dariush.tahajomi@gmail.com</a>.</p>
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
