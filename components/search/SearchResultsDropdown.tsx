'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Briefcase, CheckSquare, Loader2, SearchX } from 'lucide-react'

export type SearchResultItem = {
  id: string
  type: 'customer' | 'deal' | 'task'
  label: string
  sub: string
  rank: number
}

export type SearchResults = {
  customers: SearchResultItem[]
  deals: SearchResultItem[]
  tasks: SearchResultItem[]
}

type Props = {
  results: SearchResults | null
  loading: boolean
  query: string
  isOpen: boolean
  focusedIndex: number
  onClose: () => void
  onFocusChange: (index: number) => void
}

const ICONS = {
  customer: <Users className="w-4 h-4 text-blue-400" />,
  deal:     <Briefcase className="w-4 h-4 text-indigo-400" />,
  task:     <CheckSquare className="w-4 h-4 text-emerald-400" />,
}

const SECTION_LABELS: Record<string, string> = {
  customers: '🏢 Customers',
  deals:     '💼 Deals',
  tasks:     '✅ Tasks',
}

function flattenResults(results: SearchResults): SearchResultItem[] {
  return [
    ...results.customers,
    ...results.deals,
    ...results.tasks,
  ]
}

export function SearchResultsDropdown({
  results,
  loading,
  query,
  isOpen,
  focusedIndex,
  onClose,
  onFocusChange,
}: Props) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const totalItems = results ? flattenResults(results).length : 0

  const handleSelect = useCallback((item: SearchResultItem) => {
    onClose()
    if (item.type === 'customer') {
      router.push(`/customers?highlight=${item.id}`)
    } else if (item.type === 'deal') {
      router.push(`/pipeline?highlight=${item.id}`)
    } else if (item.type === 'task') {
      router.push(`/tasks?highlight=${item.id}`)
    }
  }, [router, onClose])

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && containerRef.current) {
      const items = containerRef.current.querySelectorAll('[data-result-item]')
      const el = items[focusedIndex] as HTMLElement
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  const hasAnyResults = results &&
    (results.customers.length > 0 || results.deals.length > 0 || results.tasks.length > 0)

  const isEmpty = !loading && query.length > 0 && !hasAnyResults

  // Build flat index for focused navigation across categories
  let currentFlatIndex = -1

  const renderSection = (
    key: 'customers' | 'deals' | 'tasks',
    items: SearchResultItem[]
  ) => {
    if (!items.length) return null
    return (
      <div key={key}>
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-white/5">
          {SECTION_LABELS[key]}
        </div>
        {items.map((item) => {
          currentFlatIndex++
          const idx = currentFlatIndex
          const isFocused = focusedIndex === idx
          return (
            <motion.button
              key={item.id}
              data-result-item
              whileHover={{ x: 2 }}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => onFocusChange(idx)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                isFocused
                  ? 'bg-blue-500/15 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span className="flex-shrink-0">{ICONS[item.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.label}</p>
                {item.sub && (
                  <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                )}
              </div>
              {isFocused && (
                <span className="text-xs text-slate-500 flex-shrink-0">↵</span>
              )}
            </motion.button>
          )
        })}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="absolute top-full mt-2 left-0 right-0 z-[200] overflow-hidden"
          style={{
            background: 'rgba(15, 20, 30, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            maxHeight: '380px',
            overflowY: 'auto',
          }}
          ref={containerRef}
        >
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Searching…</span>
            </div>
          )}

          {/* Results */}
          {!loading && hasAnyResults && results && (
            <div>
              {renderSection('customers', results.customers)}
              {renderSection('deals', results.deals)}
              {renderSection('tasks', results.tasks)}
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
              <SearchX className="w-6 h-6" />
              <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {/* If no query yet */}
          {!loading && query.length === 0 && (
            <div className="py-6 text-center text-sm text-slate-500">
              Start typing to search customers, deals, and tasks&hellip;
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
