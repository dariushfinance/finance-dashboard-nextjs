import type { Metadata } from 'next'
import { LegalLayout, LegalSection, LegalLink } from '@/components/LegalLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy — Quantfoli',
}

const EMAIL = 'dariush.tahajomi@gmail.com'

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="12 May 2026">
      <LegalSection title="1. Who We Are">
        <p>
          Quantfoli (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a portfolio analytics platform operated by
          Dariush Tahajomi as an Einzelunternehmen based in Schaffhausen, Switzerland.
          Contact: <LegalLink href={`mailto:${EMAIL}`}>{EMAIL}</LegalLink>
        </p>
      </LegalSection>

      <LegalSection title="2. Data We Collect">
        <p>We collect the following data when you use Quantfoli:</p>
        <ul>
          <li><strong>Account data:</strong> email address and password (stored securely via Supabase Auth).</li>
          <li><strong>Portfolio data:</strong> ticker symbols, share quantities, purchase prices, and dates that you enter or import.</li>
          <li><strong>Payment data:</strong> billing information processed by Stripe. We never store card details — Stripe handles this entirely.</li>
          <li><strong>Usage data:</strong> anonymous analytics (page views, feature usage) via Vercel Analytics.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How We Use Your Data">
        <ul>
          <li>To provide portfolio analytics, returns calculation, and risk metrics.</li>
          <li>To process payments and manage your subscription via Stripe.</li>
          <li>To improve the product based on aggregated usage patterns.</li>
          <li>To contact you about your account if necessary.</li>
        </ul>
        <p>We do not sell your data. We do not use your portfolio data for advertising.</p>
      </LegalSection>

      <LegalSection title="4. Third-Party Services">
        <p>We use the following third-party services, each with their own privacy policies:</p>
        <ul>
          <li><strong>Supabase</strong> — database and authentication (EU servers)</li>
          <li><strong>Stripe</strong> — payment processing</li>
          <li><strong>Vercel</strong> — hosting and analytics</li>
          <li><strong>Yahoo Finance</strong> — market data (public endpoints, no personal data sent)</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Data Retention">
        <p>
          We retain your data as long as your account is active. You may request deletion of your account
          and all associated data at any time by emailing{' '}
          <LegalLink href={`mailto:${EMAIL}`}>{EMAIL}</LegalLink>. We will process deletion requests within 30 days.
        </p>
      </LegalSection>

      <LegalSection title="6. Your Rights (GDPR)">
        <p>If you are located in the EU or Switzerland, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict processing</li>
          <li>Data portability</li>
        </ul>
        <p>
          To exercise any of these rights, contact{' '}
          <LegalLink href={`mailto:${EMAIL}`}>{EMAIL}</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>All data is transmitted over HTTPS. Portfolio data is stored in a secured Supabase database with row-level security. Passwords are never stored in plaintext.</p>
      </LegalSection>

      <LegalSection title="8. Cookies">
        <p>We use a single session cookie for authentication purposes. We do not use tracking or advertising cookies.</p>
      </LegalSection>

      <LegalSection title="9. Changes to This Policy">
        <p>We may update this policy from time to time. We will notify users of material changes via email or an in-app notice.</p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Questions about this policy? Email{' '}
          <LegalLink href={`mailto:${EMAIL}`}>{EMAIL}</LegalLink>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
