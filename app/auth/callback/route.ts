import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auth Callback Route
 *
 * Supabase redirects here after verifying the email token (password recovery,
 * magic link, invite, etc.). This route exchanges the PKCE authorisation code
 * for a session and then redirects the user to their intended destination.
 *
 * Expected query params:
 *  - code  : PKCE auth code from Supabase
 *  - next  : where to redirect after exchange (defaults to /dashboard)
 *  - error : present when Supabase sends an error (e.g. otp_expired)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // If Supabase itself sent an error (e.g. link expired), redirect with info
  if (error) {
    const redirectUrl = new URL('/auth/forgot-password', requestUrl.origin)
    redirectUrl.searchParams.set('error', error)
    redirectUrl.searchParams.set('error_description', errorDescription ?? '')
    return NextResponse.redirect(redirectUrl)
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      // Code exchange failed — redirect to forgot-password with error
      const redirectUrl = new URL('/auth/forgot-password', requestUrl.origin)
      redirectUrl.searchParams.set('error', 'link_expired')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Successfully exchanged — redirect to target page (e.g. /auth/reset-password)
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
