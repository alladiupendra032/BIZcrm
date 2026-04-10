import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Papa from 'papaparse'

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // ── Authenticate ──
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Authorize: Admin or Manager only ──
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', session.user.id)
    .single()

  if (!userProfile || !['Admin', 'Manager'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
  }

  // ── Parse filter params ──
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const ownerId = searchParams.get('owner')
  const minValue = searchParams.get('min')
  const maxValue = searchParams.get('max')
  const closeDateFrom = searchParams.get('closeDateFrom')
  const closeDateTo = searchParams.get('closeDateTo')

  // ── Fetch data ──
  let query = supabase
    .from('deals')
    .select(`
      title, value, stage, expected_close_date, created_at,
      customers(name),
      users(name)
    `)
    .eq('organization_id', userProfile.organization_id)
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }
  if (ownerId && ownerId !== 'All') {
    query = query.eq('assigned_to', ownerId)
  }
  if (minValue) {
    query = query.gte('value', parseFloat(minValue))
  }
  if (maxValue) {
    query = query.lte('value', parseFloat(maxValue))
  }
  if (closeDateFrom) {
    query = query.gte('expected_close_date', closeDateFrom)
  }
  if (closeDateTo) {
    query = query.lte('expected_close_date', closeDateTo)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }

  // ── Generate CSV ──
  const formatted = (data || []).map((row: any) => ({
    Title: row.title,
    Customer: row.customers?.name || '',
    'Value ($)': row.value ?? '',
    Stage: row.stage,
    'Expected Close Date': row.expected_close_date
      ? new Date(row.expected_close_date).toLocaleDateString('en-US')
      : '',
    'Assigned To': row.users?.name || '',
    'Created Date': new Date(row.created_at).toLocaleDateString('en-US'),
  }))

  const csv = Papa.unparse(formatted)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="deals_export_${Date.now()}.csv"`,
    },
  })
}
