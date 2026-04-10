'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Briefcase, TrendingUp, CheckSquare } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { PipelineChart } from '@/components/dashboard/PipelineChart'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { WinRateCard } from '@/components/dashboard/WinRateCard'
import { useUser } from '@/lib/UserContext'
import { supabase } from '@/lib/supabaseClient'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardMetrics {
  totalCustomers: number
  activeDeals: number
  pipelineValue: number
  pendingTasks: number
}

interface DealStageData {
  stage: string
  count: number
  value: number
}

interface ActivityEntry {
  id: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  organization_id: string | null
  created_at: string
  actor_name?: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, role, loading: userLoading } = useUser()
  const router = useRouter()

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [pipelineData, setPipelineData] = useState<DealStageData[]>([])
  const [allDeals, setAllDeals] = useState<{ stage: string; value: number }[]>([])
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // ── Redirect Team Members ──
  useEffect(() => {
    if (!userLoading && role === 'Team Member') {
      router.push('/tasks')
    }
  }, [role, userLoading, router])

  // ── Fetch all dashboard data in parallel ──
  const fetchDashboardData = useCallback(async () => {
    if (!user?.organization_id) return
    const orgId = user.organization_id
    setDataLoading(true)

    try {
      // Run all queries in parallel
      const [
        customersResult,
        activeDealsResult,
        pipelineValueResult,
        pendingTasksResult,
        dealsByStageResult,
        activityResult,
      ] = await Promise.all([
        // 1. Total Customers
        // SQL: SELECT COUNT(*) FROM customers WHERE organization_id = $orgId AND archived = false
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('archived', false),

        // 2. Active Deals count
        // SQL: SELECT COUNT(*) FROM deals WHERE organization_id = $orgId AND stage NOT IN ('Won','Lost')
        supabase
          .from('deals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .not('stage', 'in', '("Won","Lost")'),

        // 3. Pipeline Value
        // SQL: SELECT SUM(value) FROM deals WHERE organization_id = $orgId AND stage NOT IN ('Won','Lost')
        supabase
          .from('deals')
          .select('value')
          .eq('organization_id', orgId)
          .not('stage', 'in', '("Won","Lost")'),

        // 4. Pending Tasks
        // SQL: SELECT COUNT(*) FROM tasks WHERE organization_id = $orgId AND status IN ('Pending','In Progress')
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['Pending', 'In Progress']),

        // 5. Deals grouped by stage for PipelineChart
        // SQL: SELECT stage, COUNT(*) as count, SUM(value) as value FROM deals WHERE organization_id = $orgId GROUP BY stage
        supabase
          .from('deals')
          .select('stage, value')
          .eq('organization_id', orgId),

        // 6. Activity log (last 10)
        // SQL: SELECT al.*, u.name as actor_name FROM activity_log al LEFT JOIN users u ON al.actor_id = u.id WHERE al.organization_id = $orgId ORDER BY al.created_at DESC LIMIT 10
        supabase
          .from('activity_log')
          .select('id, actor_id, action, entity_type, entity_id, organization_id, created_at, users(name)')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      // Compute pipeline value sum from rows
      const pipelineSum = (pipelineValueResult.data ?? []).reduce(
        (acc: number, row: { value: number | null }) => acc + (row.value ?? 0),
        0
      )

      setMetrics({
        totalCustomers: customersResult.count ?? 0,
        activeDeals: activeDealsResult.count ?? 0,
        pipelineValue: pipelineSum,
        pendingTasks: pendingTasksResult.count ?? 0,
      })

      // Aggregate deals by stage
      // SQL equivalent: SELECT stage, COUNT(*) as count, SUM(value) as value FROM deals GROUP BY stage
      const stageMap: Record<string, { count: number; value: number }> = {}
      for (const row of dealsByStageResult.data ?? []) {
        const s = row.stage as string
        if (!stageMap[s]) stageMap[s] = { count: 0, value: 0 }
        stageMap[s].count += 1
        stageMap[s].value += Number(row.value ?? 0)
      }
      setPipelineData(
        Object.entries(stageMap).map(([stage, d]) => ({ stage, ...d }))
      )

      // Store all deals for WinRateCard
      setAllDeals((dealsByStageResult.data ?? []).map((r: any) => ({ stage: r.stage, value: Number(r.value ?? 0) })))

      // Flatten activity log (joined users table)
      const flatActivity = (activityResult.data ?? []).map((row: any) => ({
        id: row.id,
        actor_id: row.actor_id,
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        organization_id: row.organization_id,
        created_at: row.created_at,
        actor_name: row.users?.name ?? undefined,
      }))
      setActivityEntries(flatActivity)
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
    } finally {
      setDataLoading(false)
    }
  }, [user?.organization_id])

  useEffect(() => {
    if (!userLoading && user?.organization_id) {
      fetchDashboardData()
    }
  }, [userLoading, user?.organization_id, fetchDashboardData])

  // ── Show skeleton while user loads ──
  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="glass-panel p-5 h-36 shimmer border border-white/10 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel h-72 shimmer border border-white/10 rounded-2xl" />
            <div className="glass-panel h-72 shimmer border border-white/10 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back
            {user?.name ? `, ${user.name.split(' ')[0]}` : ''}! Here&apos;s your business at a glance.
          </p>
        </motion.div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Customers"
            value={dataLoading ? '...' : metrics?.totalCustomers ?? 0}
            icon={Users}
            color="text-cyan-400"
            bgColor="bg-cyan-500/15"
            loading={dataLoading}
            delay={0}
          />
          <MetricCard
            title="Active Deals"
            value={dataLoading ? '...' : metrics?.activeDeals ?? 0}
            icon={Briefcase}
            color="text-blue-400"
            bgColor="bg-blue-500/15"
            loading={dataLoading}
            delay={0.08}
          />
          <MetricCard
            title="Pipeline Value"
            value={dataLoading ? '...' : metrics?.pipelineValue ?? 0}
            icon={TrendingUp}
            color="text-indigo-400"
            bgColor="bg-indigo-500/15"
            loading={dataLoading}
            prefix="$"
            delay={0.16}
          />
          <MetricCard
            title="Pending Tasks"
            value={dataLoading ? '...' : metrics?.pendingTasks ?? 0}
            icon={CheckSquare}
            color="text-amber-400"
            bgColor="bg-amber-500/15"
            loading={dataLoading}
            delay={0.24}
          />
        </div>

        {/* Chart + Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Chart — 2/3 */}
          <PipelineChart data={pipelineData} loading={dataLoading} />

          {/* Right column: WinRate + Activity stacked */}
          <div className="flex flex-col gap-6">
            <WinRateCard deals={allDeals} loading={dataLoading} />
            <ActivityFeed entries={activityEntries} loading={dataLoading} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
