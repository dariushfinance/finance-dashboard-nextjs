import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isLoginPage  = path === '/portfolio/login' || path.startsWith('/portfolio/login/')
  const isApiRoute   = path.startsWith('/api')
  const isPublicPage =
    path === '/' ||
    path === '/learn' || path.startsWith('/learn/') ||
    path.startsWith('/privacy') ||
    path.startsWith('/terms') ||
    path.startsWith('/support') ||
    path.startsWith('/advisor-legal') ||
    path === '/portfolio' || // portfolio host renders Landing for anon, Dashboard for auth
    path.startsWith('/portfolio/how-it-works') ||
    path.startsWith('/portfolio/backtests') ||
    path.startsWith('/portfolio/register') ||
    path.startsWith('/portfolio/blog')

  if (!user && !isLoginPage && !isApiRoute && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/portfolio/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/portfolio'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
