'use client'

import React, { useState, useEffect } from 'react'
import { Search, CalendarRange, X } from 'lucide-react'
import { useUser } from '@/lib/UserContext'

interface PipelineFiltersProps {
  searchTerm: string
  onSearchChange: (s: string) => void
  minValue: string
  onMinChange: (s: string) => void
  maxValue: string
  onMaxChange: (s: string) => void
  ownerId: string
  onOwnerChange: (s: string) => void
  users: { id: string, name: string }[]
  closeDateFrom: string
  onCloseDateFromChange: (d: string) => void
  closeDateTo: string
  onCloseDateToChange: (d: string) => void
  onClearAll: () => void
}

export function PipelineFilters({
  searchTerm,
  onSearchChange,
  minValue,
  onMinChange,
  maxValue,
  onMaxChange,
  ownerId,
  onOwnerChange,
  users,
  closeDateFrom,
  onCloseDateFromChange,
  closeDateTo,
  onCloseDateToChange,
  onClearAll,
}: PipelineFiltersProps) {
  const { role } = useUser()
  const isAdmin = role === 'Admin'

  const [localSearch, setLocalSearch] = useState(searchTerm)
  const [localMin, setLocalMin] = useState(minValue)
  const [localMax, setLocalMax] = useState(maxValue)

  useEffect(() => { setLocalSearch(searchTerm) }, [searchTerm])
  useEffect(() => { setLocalMin(minValue) }, [minValue])
  useEffect(() => { setLocalMax(maxValue) }, [maxValue])

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(localSearch)
      onMinChange(localMin)
      onMaxChange(localMax)
    }, 300)
    return () => clearTimeout(handler)
  }, [localSearch, localMin, localMax, onSearchChange, onMinChange, onMaxChange])

  const hasFilters =
    searchTerm || minValue || maxValue || ownerId !== 'All' || closeDateFrom || closeDateTo

  return (
    <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between">
        {/* Search */}
        <div className="relative w-full xl:w-80 shrink-0">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search deals by title or customer..."
            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 hover:border-white/20 transition-all"
          />
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 transition-opacity focus-within:opacity-100 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Value Range */}
          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/10">
            <span className="text-xs font-semibold text-slate-400 pl-2 uppercase tracking-wider">Value $</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Min"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="w-16 bg-transparent border-none text-white text-sm focus:ring-0 p-1 placeholder:text-slate-600 outline-none"
              />
              <span className="text-slate-600">–</span>
              <input
                type="number"
                placeholder="Max"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="w-16 bg-transparent border-none text-white text-sm focus:ring-0 p-1 placeholder:text-slate-600 outline-none"
              />
            </div>
          </div>

          {/* Owner Filter (Admin only) */}
          {isAdmin && users.length > 0 && (
            <div className="flex items-center bg-black/20 rounded-xl border border-white/10 px-3 py-1.5 min-w-[200px]">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-3">Owner</span>
              <select
                value={ownerId}
                onChange={(e) => onOwnerChange(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm border-none outline-none focus:ring-0"
              >
                <option value="All" className="bg-slate-900">All Owners</option>
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-900">{u.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clear All */}
          {hasFilters && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-400/50 rounded-lg px-2.5 py-1.5 transition-all"
            >
              <X className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Close Date Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarRange className="w-3.5 h-3.5" />
          <span>Close Date:</span>
        </div>
        <input
          type="date"
          value={closeDateFrom}
          onChange={(e) => onCloseDateFromChange(e.target.value)}
          className="bg-black/20 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all"
        />
        <span className="text-slate-600 text-xs">to</span>
        <input
          type="date"
          value={closeDateTo}
          onChange={(e) => onCloseDateToChange(e.target.value)}
          className="bg-black/20 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all"
        />
        {(closeDateFrom || closeDateTo) && (
          <button
            onClick={() => { onCloseDateFromChange(''); onCloseDateToChange('') }}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
