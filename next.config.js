const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Preserve SEO link equity after the /portfolio prefix migration (2026-05-24).
    // Legal pages (/privacy, /terms, /support, /advisor-legal) stay at root — no redirect.
    return [
      { source: '/how-it-works',          destination: '/portfolio/how-it-works',          permanent: true },
      { source: '/how-it-works/:slug*',   destination: '/portfolio/how-it-works/:slug*',   permanent: true },
      { source: '/blog',                  destination: '/portfolio/blog',                  permanent: true },
      { source: '/blog/:slug*',           destination: '/portfolio/blog/:slug*',           permanent: true },
      { source: '/backtests',             destination: '/portfolio/how-it-works',          permanent: true },
      { source: '/login',                 destination: '/portfolio/login',                 permanent: true },
      { source: '/register',              destination: '/portfolio/register',              permanent: true },
      { source: '/finances',              destination: '/portfolio/finances',              permanent: true },
    ]
  },
}

const sentryEnabled =
  !!process.env.SENTRY_AUTH_TOKEN &&
  !!process.env.SENTRY_ORG &&
  !!process.env.SENTRY_PROJECT

module.exports = sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: '/monitoring',
      disableLogger: true,
      automaticVercelMonitors: false,
    })
  : nextConfig
