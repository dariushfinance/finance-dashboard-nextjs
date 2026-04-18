import { createClient } from '@supabase/supabase-js'
import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Shared auth helper for API routes — returns the authenticated user or null
export async function getAuthUser() {
  const supabase = createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// For API routes — reads the authenticated user from request cookies
export function createAuthClient() {
  const cookieStore = cookies()
  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},  // middleware handles session refresh
      },
    }
  )
}

// Service role — bypasses RLS, only for admin routes
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Legacy anon client for non-auth public reads
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
