import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey        = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  // Verify caller is Admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const anonClient  = createClient(supabaseUrl, anonKey)

  const { data: { user: callerUser }, error: authErr } = await anonClient.auth.getUser(token)
  if (authErr || !callerUser) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const { data: callerProfile } = await adminClient
    .from('users')
    .select('role, organization_id')
    .eq('id', callerUser.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden – Admin only' }, { status: 403 })
  }

  // Parse body
  let body: { userId?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { userId } = body
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  // Ensure target user is in same org
  const { data: targetUser } = await adminClient
    .from('users')
    .select('id, name, email, organization_id, role')
    .eq('id', userId)
    .single()

  if (!targetUser || targetUser.organization_id !== callerProfile.organization_id) {
    return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 })
  }

  if (userId === callerUser.id) {
    return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 })
  }

  // Remove: clear organization_id so user loses access but preserve auth account
  const { error: updateErr } = await adminClient
    .from('users')
    .update({ organization_id: null, role: 'Team Member' })
    .eq('id', userId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Log the action
  await adminClient.from('activity_log').insert({
    actor_id:        callerUser.id,
    action:          `Removed ${targetUser.email || targetUser.name} from organization`,
    entity_type:     'user',
    entity_id:       userId,
    organization_id: callerProfile.organization_id,
  })

  return NextResponse.json({ success: true })
}
