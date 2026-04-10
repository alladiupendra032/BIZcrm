import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey        = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const siteUrl = req.headers.get('origin') || process.env.SITE_URL || 'http://localhost:3000'

  if (!serviceRoleKey || !supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
  }

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
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, role } = body
  if (!email || !role) {
    return NextResponse.json({ error: 'Missing email or role' }, { status: 400 })
  }

  const roleMap: Record<string, string> = {
    'Admin': 'Admin',
    'Manager': 'Manager',
    'Team Member': 'Team Member',
    'User': 'Team Member',
  }
  const dbRole = roleMap[role] ?? 'Team Member'

  const { data: orgData } = await adminClient
    .from('organizations')
    .select('name')
    .eq('id', callerProfile.organization_id)
    .single()

  const orgName = orgData?.name || 'Organization'
  const inviterName = callerProfile.name || 'Admin'
  
  /// ---- EMAIL DELIVERY LOGIC ---- ///
  
  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD)
  
  let userIdToLog = null;
  
  if (smtpConfigured) {
    // 1. Generate Link Only (No Supabase Email)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/accept-invite`,
        data: {
          invited_role: dbRole,
          organization_id: callerProfile.organization_id,
          org_name: orgName,
          invited_by: inviterName,
        },
      },
    })
    
    if (linkError) {
       return NextResponse.json({ error: linkError.message }, { status: 400 })
    }
    
    userIdToLog = linkData?.user?.id;
    const inviteUrl = (linkData as any)?.properties?.action_link;
    
    // 2. Build and Send Email Locally setup via Nodemailer
    const { buildInviteEmail } = await import('@/lib/email/inviteTemplate')
    const { subject, html } = buildInviteEmail({
      inviteUrl,
      inviteeName: email.split('@')[0],
      inviterName,
      role: dbRole,
      orgName,
    })
    
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: parseInt(process.env.SMTP_PORT || '465') === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
    
    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'BizCRM'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        subject,
        html,
      })
      console.log('[invite] Sent via Nodemailer to:', email)
    } catch (smtpErr: any) {
      console.error('[invite] Nodemailer send error:', smtpErr)
      return NextResponse.json(
        { error: `SMTP server failed to send email: ${smtpErr.message}. Ensure App Password is correct.` },
        { status: 500 }
      )
    }
  } else {
    // 3. Fallback to Supabase Default (if users hasn't provided SMTP yet)
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/accept-invite`,
      data: {
        invited_role: dbRole,
        organization_id: callerProfile.organization_id,
        org_name: orgName,
        invited_by: inviterName,
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
    userIdToLog = inviteData?.user?.id;
    console.log('[invite] Sent via Supabase GoTrue to:', email)
  }

  // ---- SAVE PROFILE & ACTIVITY LOG ---- //
  if (userIdToLog) {
    await adminClient.from('users').upsert({
      id: userIdToLog,
      email,
      name: email.split('@')[0],
      role: dbRole,
      organization_id: callerProfile.organization_id,
    }, { onConflict: 'id' })
  }

  await adminClient.from('activity_log').insert({
    actor_id: callerUser.id,
    action: `Invited ${email} as ${dbRole}`,
    entity_type: 'user',
    entity_id: userIdToLog || null,
    organization_id: callerProfile.organization_id,
  })

  return NextResponse.json({ success: true, message: `Invite successfully sent to ${email}` }, { status: 200 })
}
