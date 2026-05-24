import { permanentRedirect } from 'next/navigation'

// /portfolio/backtests is the SEO-tight alias. Canonical is /portfolio/how-it-works.
export default function BacktestsRedirect() {
  permanentRedirect('/portfolio/how-it-works')
}
