import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return res
  }

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return res

  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage     = pathname.startsWith('/auth')
  const isAcceptInvite = pathname.startsWith('/auth/accept-invite')
  const isAdminRoute   = pathname.startsWith('/admin')
  const isApiRoute     = pathname.startsWith('/api')

  // ── Always let accept-invite through — it handles its own token exchange ──
  if (isAcceptInvite) return res

  // ── API routes: handled server-side — let them through ──────────────────
  if (isApiRoute) return res

  // ── Authenticated user trying to visit login/signup → send to dashboard ──
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // ── Unauthenticated user → redirect to login ─────────────────────────────
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // ── Role-based protection for /admin/* routes ─────────────────────────────
  if (session && isAdminRoute) {
    // Fetch the user's role from the users table
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'Admin') {
      // Non-admin tries to access /admin — redirect to their dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
