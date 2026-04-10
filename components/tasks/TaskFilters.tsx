'use client'

import React from 'react'
import { Search, X } from 'lucide-react'

type DueDateFilter = 'all' | 'today' | 'week' | 'overdue'
type StatusFilter = 'All' | 'Pending' | 'In Progress' | 'Completed'

interface TaskFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: StatusFilter
  onStatusChange: (v: StatusFilter) => void
  dueDateFilter: DueDateFilter
  onDueDateChange: (v: DueDateFilter) => void
  assigneeFilter: string
  onAssigneeChange: (v: string) => void
  users: { id: string; name: string }[]
  showAssignee: boolean
  onClearAll: () => void
}

const STATUS_TABS: StatusFilter[] = ['All', 'Pending', 'In Progress', 'Completed']
const DUE_DATE_OPTIONS: { label: string; value: DueDateFilter }[] = [
  { label: 'All Dates', value: 'all' },
  { label: 'Due Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'Overdue', value: 'overdue' },
]

export function TaskFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dueDateFilter,
  onDueDateChange,
  assigneeFilter,
  onAssigneeChange,
  users,
  showAssignee,
  onClearAll,
}: TaskFiltersProps) {
  const hasActiveFilters =
    search !== '' ||
    statusFilter !== 'All' ||
    dueDateFilter !== 'all' ||
    assigneeFilter !== 'All'

  return (
    <div className="glass-panel border border-white/10 p-4 rounded-2xl space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Text Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
          />
        </div>

        {/* Status Segmented Control */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Due Date Quick Filter */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {DUE_DATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onDueDateChange(opt.value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                dueDateFilter === opt.value
                  ? opt.value === 'overdue'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Assignee (Admin/Manager) */}
        {showAssignee && (
          <select
            value={assigneeFilter}
            onChange={e => onAssigneeChange(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500/60 transition-colors"
          >
            <option value="All">All Assignees</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
