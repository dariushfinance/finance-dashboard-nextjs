import { permanentRedirect } from 'next/navigation'

// /backtests is the SEO-tight alias. Canonical is /how-it-works.
export default function BacktestsRedirect() {
  permanentRedirect('/how-it-works')
}
