import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Papa from 'papaparse'

export const dynamic = 'force-dynamic'

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
  const statusFilter = searchParams.get('status')
  const q = searchParams.get('q')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  // ── Fetch data ──
  let query = supabase
    .from('customers')
    .select('name, email, phone, company, status, notes, created_at')
    .eq('organization_id', userProfile.organization_id)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'All') {
    query = query.eq('status', statusFilter)
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,company.ilike.%${q}%`)
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo + 'T23:59:59Z')
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }

  // ── Generate CSV ──
  const formatted = (data || []).map((row: any) => ({
    Name: row.name,
    Email: row.email || '',
    Phone: row.phone || '',
    Company: row.company || '',
    Status: row.status,
    Notes: row.notes || '',
    'Created Date': new Date(row.created_at).toLocaleDateString('en-US'),
  }))

  const csv = Papa.unparse(formatted)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="customers_export_${Date.now()}.csv"`,
    },
  })
}
