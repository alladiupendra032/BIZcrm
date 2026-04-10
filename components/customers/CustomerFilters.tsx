'use client'

import React, { useState, useEffect } from 'react'
import { Search, CalendarRange, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface CustomerFiltersProps {
  searchTerm: string
  onSearchChange: (s: string) => void
  statusFilter: string
  onStatusChange: (s: string) => void
  showArchived: boolean
  onArchivedChange: (a: boolean) => void
  statusOptions: string[]
  dateFrom: string
  dateTo: string
  onDateFromChange: (d: string) => void
  onDateToChange: (d: string) => void
  onClearAll: () => void
}

export function CustomerFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  showArchived,
  onArchivedChange,
  statusOptions,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearAll,
}: CustomerFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm)

  // Sync external changes (e.g. from URL)
  useEffect(() => { setLocalSearch(searchTerm) }, [searchTerm])

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => onSearchChange(localSearch), 300)
    return () => clearTimeout(handler)
  }, [localSearch, onSearchChange])

  const hasActiveFilters =
    statusFilter !== 'All' || showArchived || dateFrom || dateTo || searchTerm

  // Quick date presets
  const applyPreset = (preset: 'week' | 'month') => {
    const now = new Date()
    if (preset === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      onDateFromChange(weekAgo.toISOString().slice(0, 10))
      onDateToChange(now.toISOString().slice(0, 10))
    } else {
      const monthAgo = new Date(now)
      monthAgo.setDate(1) // start of current month
      onDateFromChange(monthAgo.toISOString().slice(0, 10))
      onDateToChange(now.toISOString().slice(0, 10))
    }
  }

  return (
    <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by name or company..."
            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 hover:border-white/20 transition-all"
          />
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 transition-opacity focus-within:opacity-100 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex bg-black/20 rounded-xl border border-white/10 p-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`relative px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === status ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {statusFilter === status && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{status}</span>
              </button>
            ))}
          </div>

          {/* Archived Toggle */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={showArchived}
                onChange={(e) => onArchivedChange(e.target.checked)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showArchived ? 'bg-blue-500' : 'bg-white/10'}`} />
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showArchived ? 'transform translate-x-4' : ''}`} />
            </div>
            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Archived</span>
          </label>

          {/* Clear All */}
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onClearAll}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-400/50 rounded-lg px-2.5 py-1.5 transition-all"
            >
              <X className="w-3 h-3" />
              Clear All
            </motion.button>
          )}
        </div>
      </div>

      {/* Date Range Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarRange className="w-3.5 h-3.5" />
          <span>Created:</span>
        </div>
        {/* Quick presets */}
        <div className="flex gap-1.5">
          {(['This Week', 'This Month'] as const).map((label) => {
            const preset = label === 'This Week' ? 'week' : 'month'
            return (
              <button
                key={label}
                onClick={() => applyPreset(preset)}
                className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
              >
                {label}
              </button>
            )
          })}
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="bg-black/20 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-all"
        />
        <span className="text-slate-600 text-xs">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="bg-black/20 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-all"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { onDateFromChange(''); onDateToChange('') }}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
