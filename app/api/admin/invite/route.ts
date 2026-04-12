import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey        = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Prefer SITE_URL env var; fall back to request origin
  const siteUrl = process.env.SITE_URL
    || req.headers.get('origin')
    || 'http://localhost:3000'

  if (!serviceRoleKey || !supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
  }

  // ── Auth: validate caller is Admin ─────────────────────────────────────────
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
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const { email, role } = body
  if (!email || !role) {
    return NextResponse.json({ error: 'Missing email or role' }, { status: 400 })
  }

  const ROLE_MAP: Record<string, string> = {
    Admin: 'Admin',
    Manager: 'Manager',
    'Team Member': 'Team Member',
  }
  const dbRole = ROLE_MAP[role] ?? 'Team Member'

  // ── Lookup org ─────────────────────────────────────────────────────────────
  const { data: orgData } = await adminClient
    .from('organizations')
    .select('name')
    .eq('id', callerProfile.organization_id)
    .single()

  const orgName     = orgData?.name || 'Organization'
  const inviterName = callerProfile.name || 'Admin'

  // ── Determine if real SMTP credentials are present ─────────────────────────
  const smtpUser     = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD
  const hasSmtp = !!(
    smtpUser &&
    smtpPassword &&
    smtpUser !== 'your-gmail@gmail.com' &&
    smtpPassword !== 'your-gmail-app-password'
  )

  let invitedUserId: string | null | undefined = null

  if (hasSmtp) {
    // ── PATH A: SMTP configured — generateLink + Nodemailer ──────────────────
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
      if (linkError.message?.toLowerCase().includes('already')) {
        return NextResponse.json(
          { error: 'This email has already been invited or is already a member.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: linkError.message }, { status: 400 })
    }

    invitedUserId = linkData?.user?.id
    const inviteUrl = (linkData as any)?.properties?.action_link as string | undefined

    if (!inviteUrl) {
      return NextResponse.json({ error: 'Failed to generate invite link' }, { status: 500 })
    }

    try {
      const { buildInviteEmail } = await import('@/lib/email/inviteTemplate')
      const { subject, html } = buildInviteEmail({
        inviteUrl,
        inviteeName: email.split('@')[0],
        inviterName,
        role: dbRole,
        orgName,
      })

      // @ts-expect-error – nodemailer types optional
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST || 'smtp.gmail.com',
        port:   parseInt(process.env.SMTP_PORT || '465'),
        secure: parseInt(process.env.SMTP_PORT || '465') === 465,
        auth: { user: smtpUser, pass: smtpPassword },
      })

      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'BizCRM'}" <${process.env.SMTP_FROM_EMAIL || smtpUser}>`,
        to:   email,
        subject,
        html,
      })
      console.log('[invite] ✅ Sent via SMTP (Nodemailer) to:', email)
    } catch (smtpErr: any) {
      console.error('[invite] ❌ SMTP error:', smtpErr.message)
      return NextResponse.json(
        { error: `SMTP failed: ${smtpErr.message}. Check your SMTP credentials.` },
        { status: 500 }
      )
    }
  } else {
    // ── PATH B: No SMTP — use Supabase inviteUserByEmail (sends email itself) ─
    console.log('[invite] No SMTP configured — using Supabase built-in email sender')

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/accept-invite`,
      data: {
        invited_role:    dbRole,
        organization_id: callerProfile.organization_id,
        org_name:        orgName,
        invited_by:      inviterName,
      },
    })

    if (inviteError) {
      if (inviteError.message?.toLowerCase().includes('already')) {
        return NextResponse.json(
          { error: 'This email has already been invited or is already a member.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    invitedUserId = inviteData?.user?.id
    console.log('[invite] ✅ Invite email sent via Supabase to:', email)
  }

  // ── Persist profile ────────────────────────────────────────────────────────
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
    { success: true, message: `Invite email sent to ${email}` },
    { status: 200 }
  )
}
