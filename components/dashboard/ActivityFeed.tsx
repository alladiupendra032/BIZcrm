'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'

interface ActivityEntry {
  id: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  organization_id: string | null
  created_at: string
  actor_name?: string // joined from users table
}

interface ActivityFeedProps {
  entries: ActivityEntry[]
  loading?: boolean
}

const ENTITY_COLORS: Record<string, { dot: string; text: string; bg: string }> = {
  deal:     { dot: 'bg-blue-500',  text: 'text-blue-300',  bg: 'bg-blue-500/15' },
  task:     { dot: 'bg-amber-500', text: 'text-amber-300', bg: 'bg-amber-500/15' },
  customer: { dot: 'bg-cyan-500',  text: 'text-cyan-300',  bg: 'bg-cyan-500/15' },
  default:  { dot: 'bg-slate-500', text: 'text-slate-400', bg: 'bg-slate-500/15' },
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ActivityItem({ entry, index }: { entry: ActivityEntry; index: number }) {
  const entityKey = entry.entity_type?.toLowerCase() ?? 'default'
  const colors = ENTITY_COLORS[entityKey] ?? ENTITY_COLORS.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35 }}
      className="flex gap-3 group"
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${colors.dot} shadow-[0_0_6px_currentColor] ring-2 ring-black/40`} />
        <div className="w-px flex-1 bg-white/8 mt-1" />
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-0.5">
          {/* Actor avatar */}
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}
          >
            {getInitials(entry.actor_name)}
          </span>
          <div className="min-w-0">
            <span className="text-white text-xs font-medium">{entry.actor_name ?? 'System'}</span>
            <span className="text-slate-400 text-xs"> {entry.action}</span>
          </div>
        </div>

        {/* Entity type badge + time */}
        <div className="flex items-center gap-2 ml-8 mt-0.5">
          {entry.entity_type && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors.text} ${colors.bg}`}>
              {entry.entity_type.charAt(0).toUpperCase() + entry.entity_type.slice(1)}
            </span>
          )}
          <span className="text-[10px] text-slate-600">{relativeTime(entry.created_at)}</span>
        </div>
      </div>
    </motion.div>
  )
}

export function ActivityFeed({ entries, loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="glass-panel p-6 border border-white/10 space-y-4">
        <div className="h-4 w-32 rounded shimmer mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full shimmer mt-1.5" />
              <div className="w-px flex-1 bg-white/5 mt-1" />
            </div>
            <div className="pb-4 flex-1 space-y-1.5">
              <div className="h-3 w-40 rounded shimmer" />
              <div className="h-2.5 w-24 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass-panel p-6 border border-white/10"
    >
      <h2 className="text-base font-semibold text-white mb-5">Recent Activity</h2>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <Activity className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-400 font-medium">No activity yet</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-[180px]">
            Activity will appear here as your team works
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {entries.map((entry, i) => (
            <ActivityItem key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  )
}
