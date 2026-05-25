import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Dashboard from '@/components/Dashboard'
import Landing from '@/components/Landing'
import FaqSection from '@/components/FaqSection'
import { softwareApplicationSchema, faqSchema, PORTFOLIO_FAQ } from '@/lib/schema'

export default async function Home() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* no-op in server component */ },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  if (user) return <Dashboard />

  // Anonymous / crawler view: render the marketing landing plus structured data
  // (SoftwareApplication + FAQPage) and a visible FAQ for answer-engine citation.
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(PORTFOLIO_FAQ)) }} />
      <Landing />
      <FaqSection items={PORTFOLIO_FAQ} />
    </>
  )
}
