// Structured-data builders for SEO + AEO (answer-engine optimization).
// Centralized so Organization / SoftwareApplication / FAQ markup stays
// consistent across the unified landing and the /portfolio product page.
//
// FIDLEG note: every string surfaced here is factual product description.
// No prescriptive or advisory language — keep it that way. New FAQ entries
// must pass @agent-fidleg-reviewer before shipping.

const SITE_URL = 'https://quantfoli.com'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Quantfoli',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description:
      'Swiss portfolio analytics for self-directed investors. Markowitz efficient frontier, stress testing, and risk metrics on ZKB, Yuh, and Neon depots.',
    founder: [
      { '@type': 'Person', name: 'Dariush Tahajomi', url: 'https://www.linkedin.com/in/dariush-tahajomi-09348b370/' },
    ],
    foundingLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'CH', addressLocality: 'Schaffhausen' } },
    sameAs: ['https://www.linkedin.com/in/dariush-tahajomi-09348b370/'],
  }
}

// Describes the portfolio tool itself so answer engines can name it, price it,
// and list its capabilities when asked "best Swiss portfolio analytics tool".
export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Quantfoli',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    url: `${SITE_URL}/portfolio`,
    description:
      'Portfolio analytics for Swiss self-directed investors. Imports ZKB, Yuh, and Neon CSV exports, converts positions to CHF, and computes Sharpe, Sortino, beta, alpha, an efficient frontier, and historical stress tests.',
    featureList: [
      'ZKB, Yuh, and Neon CSV import',
      'FX-adjusted returns in CHF',
      'Sharpe, Sortino, beta, alpha',
      'Markowitz efficient frontier',
      'Historical stress testing',
      'Rolling volatility and correlation matrix',
    ],
    inLanguage: ['en', 'de'],
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'CHF',
        description: 'Portfolio tracker, EOD prices, S&P 500 benchmark, Swiss broker CSV import, multi-currency display.',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '15',
        priceCurrency: 'CHF',
        description: 'Adds Sharpe, Sortino, beta, alpha, Markowitz frontier, stress testing, and risk diversification metrics. CHF 150/year.',
      },
    ],
    publisher: { '@type': 'Organization', name: 'Quantfoli', url: SITE_URL },
  }
}

export interface FaqItem { q: string; a: string }

export function faqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

// Canonical FAQ used on the /portfolio product page. Rendered both as visible
// text and as FAQPage JSON-LD — answer engines weight on-page extractable text.
// FIDLEG-safe: factual descriptions of the tool, no investment advice.
export const PORTFOLIO_FAQ: FaqItem[] = [
  {
    q: 'What is Quantfoli?',
    a: 'Quantfoli is a Swiss portfolio analytics tool for self-directed investors. It imports CSV exports from ZKB, Yuh, and Neon, converts positions to CHF, and computes risk and performance metrics such as Sharpe ratio, beta, alpha, an efficient frontier, and historical stress tests.',
  },
  {
    q: 'Does Quantfoli work with ZKB, Yuh, and Neon?',
    a: 'Yes. Quantfoli parses CSV exports from ZKB, Yuh, and Neon, resolves ISINs to tickers, and matches positions against historical price data. Foreign-currency holdings are converted to CHF before any metric is computed.',
  },
  {
    q: 'How much does Quantfoli cost?',
    a: 'The Free tier is permanent and requires no credit card. Pro costs CHF 15 per month or CHF 150 per year and adds the Markowitz efficient frontier, stress testing, and the full risk-metric suite.',
  },
  {
    q: 'What risk metrics does Quantfoli calculate?',
    a: 'Quantfoli computes Sharpe ratio, Sortino ratio, beta, alpha, value at risk, conditional value at risk, rolling volatility, a correlation matrix, a Markowitz efficient frontier, and historical crisis stress tests. Returns are FX-adjusted to CHF and net of Swiss broker costs.',
  },
  {
    q: 'Is Quantfoli investment advice?',
    a: 'No. Quantfoli is an analytics tool that computes metrics on a portfolio you enter yourself. It does not recommend securities, allocations, or transactions, and it is not a substitute for a licensed financial adviser.',
  },
  {
    q: 'Does Quantfoli handle multiple currencies?',
    a: 'Yes. Positions held in USD, EUR, or other currencies are converted to CHF using historical exchange rates, so every metric reflects a Swiss-franc investor’s actual return rather than the native-currency figure.',
  },
]
