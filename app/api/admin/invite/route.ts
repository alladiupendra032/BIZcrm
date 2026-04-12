import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey        = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Prefer SITE_URL env var; fall back to the request's origin
  const siteUrl = process.env.SITE_URL
    || req.headers.get('origin')
    || 'http://localhost:3000'

  if (!serviceRoleKey || !supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
  }

  // ── Auth: validate caller ──────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const anonClient = createClient(supabaseUrl, anonKey)
  const { data: { user: callerUser }, error: authError } = await anonClient.auth.getUser(token)

  if (authError || !callerUser) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const { data: callerProfile } = await adminClient
    .from('users')
    .select('role, organization_id, name')
    .eq('id', callerUser.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden – Admin only' }, { status: 403 })
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { email?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, role } = body
  if (!email || !role) {
    return NextResponse.json({ error: 'Missing email or role' }, { status: 400 })
  }

  // Map UI label → DB value
  const ROLE_MAP: Record<string, string> = {
    Admin: 'Admin',
    Manager: 'Manager',
    'Team Member': 'Team Member',
  }
  const dbRole = ROLE_MAP[role] ?? 'Team Member'

  // ── Lookup org name ────────────────────────────────────────────────────────
  const { data: orgData } = await adminClient
    .from('organizations')
    .select('name')
    .eq('id', callerProfile.organization_id)
    .single()

  const orgName     = orgData?.name || 'Organization'
  const inviterName = callerProfile.name || 'Admin'

  // ── Generate the Supabase invite link ──────────────────────────────────────
  // This creates the user in Supabase Auth (pending state) and returns the
  // magic action_link URL that the invitee must click to accept.
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${siteUrl}/auth/accept-invite`,
      data: {
        invited_role:    dbRole,
        organization_id: callerProfile.organization_id,
        org_name:        orgName,
        invited_by:      inviterName,
      },
    },
  })

  if (linkError) {
    // A user that is already confirmed gets a special error — surface it clearly
    if (linkError.message?.toLowerCase().includes('already')) {
      return NextResponse.json(
        { error: 'This email has already been invited or is already a member.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: linkError.message }, { status: 400 })
  }

  const invitedUserId = linkData?.user?.id
  const inviteUrl = (linkData as any)?.properties?.action_link as string | undefined

  if (!inviteUrl) {
    return NextResponse.json({ error: 'Failed to generate invite link' }, { status: 500 })
  }

  // ── Send email via Nodemailer (SMTP) ───────────────────────────────────────
  const smtpUser     = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD

  if (smtpUser && smtpPassword) {
    try {
      const { buildInviteEmail } = await import('@/lib/email/inviteTemplate')
      const { subject, html } = buildInviteEmail({
        inviteUrl,
        inviteeName: email.split('@')[0],
        inviterName,
        role: dbRole,
        orgName,
      })

      // @ts-expect-error – nodemailer types not installed as dev dep; works at runtime
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST     || 'smtp.gmail.com',
        port:   parseInt(process.env.SMTP_PORT || '465'),
        secure: parseInt(process.env.SMTP_PORT || '465') === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      })

      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'BizCRM'}" <${process.env.SMTP_FROM_EMAIL || smtpUser}>`,
        to:      email,
        subject,
        html,
      })

      console.log('[invite] ✅ Email sent via Nodemailer SMTP to:', email)
    } catch (smtpErr: any) {
      console.error('[invite] ❌ Nodemailer error:', smtpErr.message)
      return NextResponse.json(
        { error: `SMTP error: ${smtpErr.message}. Check your SMTP credentials in .env.local` },
        { status: 500 }
      )
    }
  } else {
    // No SMTP configured — Supabase already sent its own email when generateLink was called.
    // The link is the Supabase-default one; it still works.
    console.log('[invite] ⚠️  No SMTP configured — Supabase default email was sent to:', email)
  }

  // ── Persist pending user profile ───────────────────────────────────────────
  if (invitedUserId) {
    await adminClient.from('users').upsert({
      id:              invitedUserId,
      email,
      name:            email.split('@')[0],
      role:            dbRole,
      organization_id: callerProfile.organization_id,
    }, { onConflict: 'id' })
  }

  // ── Activity log ───────────────────────────────────────────────────────────
  await adminClient.from('activity_log').insert({
    actor_id:        callerUser.id,
    action:          `Invited ${email} as ${dbRole}`,
    entity_type:     'user',
    entity_id:       invitedUserId || null,
    organization_id: callerProfile.organization_id,
  })

  return NextResponse.json(
    { success: true, message: `Invite sent to ${email}` },
    { status: 200 }
  )
}
