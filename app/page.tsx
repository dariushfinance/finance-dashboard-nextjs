import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Dashboard from '@/components/Dashboard'
import Landing from '@/components/Landing'

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
  return user ? <Dashboard /> : <Landing />
}
