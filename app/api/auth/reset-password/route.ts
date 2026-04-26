import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/reset-password
 * Body: { email: string, password: string }
 *
 * Looks up the user by email in the `users` table, then uses the
 * Supabase Admin API (service-role key) to update their password directly.
 * No email token / PKCE required.
 */
export async function POST(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'Server misconfiguration: missing environment variables.' },
      { status: 500 }
    )
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { email?: string; password?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }

  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters.' },
      { status: 400 }
    )
  }

  // ── Build admin client ──────────────────────────────────────────────────────
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── Look up user ID by email in our `users` table ──────────────────────────
  const { data: userProfile, error: lookupError } = await adminClient
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (lookupError || !userProfile) {
    // Return generic error to avoid email enumeration
    return NextResponse.json(
      { error: 'No account found with that email address.' },
      { status: 404 }
    )
  }

  // ── Update password via Admin API ───────────────────────────────────────────
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    userProfile.id,
    { password }
  )

  if (updateError) {
    console.error('[reset-password] updateUserById error:', updateError.message)
    return NextResponse.json(
      { error: updateError.message || 'Failed to update password.' },
      { status: 500 }
    )
  }

  console.log('[reset-password] ✅ Password updated for:', email)
  return NextResponse.json({ success: true })
}
