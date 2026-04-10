'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, AlertCircle, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'

interface MemberStats {
  userId: string
  name: string
  total: number
  completed: number
}

export function TeamOverview() {
  const { user } = useUser()
  const [stats, setStats] = useState<MemberStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!user?.organization_id) return
    setLoading(true)
    setError(null)
    try {
      // Fetch all non-archived tasks in org with assigned_to populated
      const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select('id, status, assigned_to, users(name)')
        .eq('organization_id', user.organization_id)
        .not('assigned_to', 'is', null)

      if (tErr) throw tErr

      // Group by assigned_to
      const map = new Map<string, { name: string; total: number; completed: number }>()
      for (const t of tasks || []) {
        const uid = t.assigned_to as string
        const name = (t as any).users?.name || 'Unknown'
        if (!map.has(uid)) map.set(uid, { name, total: 0, completed: 0 })
        const entry = map.get(uid)!
        entry.total += 1
        if (t.status === 'Completed') entry.completed += 1
      }

      const result: MemberStats[] = Array.from(map.entries())
        .map(([userId, v]) => ({ userId, ...v }))
        .sort((a, b) => b.total - a.total)

      setStats(result)
    } catch (err: any) {
      setError(err.message || 'Failed to load team data')
    } finally {
      setLoading(false)
    }
  }, [user?.organization_id])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return { bar: 'from-emerald-500 to-emerald-400', text: 'text-emerald-400' }
    if (pct >= 50) return { bar: 'from-amber-500 to-amber-400', text: 'text-amber-400' }
    return { bar: 'from-rose-500 to-rose-400', text: 'text-rose-400' }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="glass-panel border border-white/10 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded bg-white/10 shimmer w-3/4" />
                <div className="h-3 rounded bg-white/5 shimmer w-1/2" />
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/10 shimmer" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-panel border border-rose-500/20 p-8 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <p className="text-white text-sm font-semibold">Failed to load team overview</p>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" /> Retry
        </button>
      </div>
    )
  }

  if (stats.length === 0) {
    return (
      <div className="glass-panel border border-white/10 p-10 flex flex-col items-center text-center">
        <Users className="w-10 h-10 text-slate-600 mb-3" />
        <p className="text-slate-400 text-sm">No assigned tasks yet. Assign tasks to team members to see their progress here.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((member, i) => {
        const pct = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0
        const { bar, text } = getProgressColor(pct)
        const initials = member.name
          .split(' ')
          .map(w => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()

        return (
          <motion.div
            key={member.userId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-panel border border-white/10 p-5 rounded-2xl space-y-4 hover:border-white/20 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                <p className="text-xs text-slate-500">
                  {member.completed} / {member.total} tasks completed
                </p>
              </div>
              <span className={`text-sm font-bold ${text}`}>{pct}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.06 + 0.2 }}
                className={`h-full rounded-full bg-gradient-to-r ${bar}`}
                style={{ boxShadow: pct >= 80 ? '0 0 8px rgba(16,185,129,0.4)' : undefined }}
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400/60 inline-block" />
                {member.total - member.completed} active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400/60 inline-block" />
                {member.completed} done
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
