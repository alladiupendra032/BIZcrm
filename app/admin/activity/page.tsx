'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Search, Filter, User, Building2, Briefcase, ClipboardList,
  ChevronLeft, ChevronRight, RotateCcw, AlertCircle, Download
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'

interface LogEntry {
  id: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  created_at: string
  organization_id: string
  actor_name?: string
}

const ENTITY_ICON: Record<string, React.ReactNode> = {
  customer: <Building2 className="w-3.5 h-3.5 text-cyan-400" />,
  deal: <Briefcase className="w-3.5 h-3.5 text-blue-400" />,
  task: <ClipboardList className="w-3.5 h-3.5 text-amber-400" />,
  user: <User className="w-3.5 h-3.5 text-purple-400" />,
}

const ACTION_COLOR: Record<string, string> = {
  created: 'text-emerald-400 bg-emerald-500/10',
  updated: 'text-blue-400 bg-blue-500/10',
  deleted: 'text-rose-400 bg-rose-500/10',
  invited: 'text-purple-400 bg-purple-500/10',
  archived: 'text-amber-400 bg-amber-500/10',
  converted: 'text-teal-400 bg-teal-500/10',
  stage_changed: 'text-indigo-400 bg-indigo-500/10',
  completed: 'text-emerald-400 bg-emerald-500/10',
}

const PAGE_SIZE = 20

function getActionColor(action: string) {
  const key = Object.keys(ACTION_COLOR).find(k => action.toLowerCase().includes(k))
  return key ? ACTION_COLOR[key] : 'text-slate-400 bg-white/5'
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function ActivityLogPage() {
  const { user } = useUser()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchLogs = useCallback(async () => {
    if (!user?.organization_id) return
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('activity_log')
        .select(`
          id, actor_id, action, entity_type, entity_id, created_at, organization_id,
          users(name)
        `, { count: 'exact' })
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter)
      if (search) query = query.ilike('action', `%${search}%`)

      const { data, error: err, count } = await query
      if (err) throw err

      const mapped = (data || []).map((r: any) => ({
        ...r,
        actor_name: r.users?.name || 'System',
      }))
      setLogs(mapped)
      setTotal(count || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.organization_id, page, entityFilter, search])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Reset page on filter change
  useEffect(() => { setPage(0) }, [search, entityFilter])

  const ENTITY_TYPES = ['all', 'customer', 'deal', 'task', 'user']
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const exportCSV = () => {
    const header = ['Time', 'Actor', 'Action', 'Entity Type', 'Entity ID']
    const rows = logs.map(l => [
      new Date(l.created_at).toISOString(),
      l.actor_name || '',
      l.action,
      l.entity_type || '',
      l.entity_id || '',
    ])
    const content = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity_log_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
                <Activity className="w-4 h-4 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Activity Log</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Organisation-wide audit trail of all actions. {total > 0 && `${total} total entries.`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={exportCSV}
            className="flex items-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel border border-white/10 p-4 rounded-2xl flex flex-wrap gap-3 items-center"
        >
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search actions..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>

          {/* Entity filter */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {ENTITY_TYPES.map(et => (
              <button
                key={et}
                onClick={() => setEntityFilter(et)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  entityFilter === et
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {et}
              </button>
            ))}
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Log Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-[140px_1fr_100px_120px] gap-4 px-5 py-3 border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Time</span>
            <span>Action</span>
            <span>Type</span>
            <span>Actor</span>
          </div>

          {loading ? (
            <div className="space-y-0">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="grid grid-cols-[140px_1fr_100px_120px] gap-4 px-5 py-4 border-b border-white/5">
                  <div className="h-3.5 rounded bg-white/8 shimmer w-4/5" />
                  <div className="h-3.5 rounded bg-white/8 shimmer w-3/4" />
                  <div className="h-5 rounded-lg bg-white/8 shimmer w-16" />
                  <div className="h-3.5 rounded bg-white/8 shimmer w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-10 flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <p className="text-rose-400 text-sm">{error}</p>
              <Button variant="ghost" size="sm" onClick={fetchLogs}>Retry</Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center">
              <Activity className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No activity found{search ? ' for this search' : ''}.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-[140px_1fr_100px_120px] gap-4 items-center px-5 py-3.5 border-b border-white/5 hover:bg-white/3 transition-colors"
                >
                  {/* Time */}
                  <span className="text-xs text-slate-500" title={new Date(log.created_at).toLocaleString()}>
                    {timeAgo(log.created_at)}
                  </span>

                  {/* Action */}
                  <p className="text-sm text-slate-300 truncate">{log.action}</p>

                  {/* Entity type badge */}
                  {log.entity_type ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium capitalize px-2 py-0.5 rounded-lg bg-white/5 w-fit">
                      {ENTITY_ICON[log.entity_type] || <Filter className="w-3.5 h-3.5" />}
                      <span className="text-slate-300">{log.entity_type}</span>
                    </span>
                  ) : <span className="text-slate-600 text-xs">—</span>}

                  {/* Actor */}
                  <span className="text-xs text-slate-400 truncate">{log.actor_name}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400">Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
