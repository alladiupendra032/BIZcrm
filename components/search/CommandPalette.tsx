'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Briefcase, CheckSquare, Loader2, SearchX, Clock, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { SearchResults, SearchResultItem } from './SearchResultsDropdown'

const ICONS: Record<string, React.ReactNode> = {
  customer: <Users className="w-4 h-4 text-blue-400" />,
  deal:     <Briefcase className="w-4 h-4 text-indigo-400" />,
  task:     <CheckSquare className="w-4 h-4 text-emerald-400" />,
}

const SECTION_LABELS: Record<string, string> = {
  customers: '🏢 Customers',
  deals:     '💼 Deals',
  tasks:     '✅ Tasks',
}

const RECENT_KEY = 'crm_recent_searches'

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecentSearch(q: string) {
  const prev = getRecentSearches().filter(s => s !== q)
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 5)))
}

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: Props) {
  const { user } = useUser()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults(null)
      setFocusedIndex(-1)
      setRecentSearches(getRecentSearches())
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query || !user?.organization_id) {
      setResults(null)
      return
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data, error } = await (supabase as any).rpc('search_all', {
          query,
          org_id: user.organization_id,
        })
        if (error) {
          console.error('[CommandPalette] RPC error:', error.message, error)
          setResults({ customers: [], deals: [], tasks: [] })
        } else if (data) {
          setResults(data as SearchResults)
        }
      } catch (err) {
        console.error('[CommandPalette] Unexpected error:', err)
        setResults({ customers: [], deals: [], tasks: [] })
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [query, user?.organization_id])

  const flatItems: SearchResultItem[] = results
    ? [...results.customers, ...results.deals, ...results.tasks]
    : []

  const handleSelect = useCallback((item: SearchResultItem) => {
    addRecentSearch(query)
    onClose()
    if (item.type === 'customer') router.push(`/customers?highlight=${item.id}`)
    else if (item.type === 'deal') router.push(`/pipeline?highlight=${item.id}`)
    else router.push(`/tasks?highlight=${item.id}`)
  }, [query, onClose, router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(i => Math.min(i + 1, flatItems.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(i => Math.max(i - 1, -1))
    }
    if (e.key === 'Enter' && focusedIndex >= 0 && flatItems[focusedIndex]) {
      handleSelect(flatItems[focusedIndex])
    }
  }

  const hasResults = results &&
    (results.customers.length + results.deals.length + results.tasks.length > 0)

  let flatIdx = -1

  const renderSection = (key: 'customers' | 'deals' | 'tasks', items: SearchResultItem[]) => {
    if (!items.length) return null
    return (
      <div key={key}>
        <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          {SECTION_LABELS[key]}
        </div>
        {items.map(item => {
          flatIdx++
          const idx = flatIdx
          const isFocused = focusedIndex === idx
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 3 }}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setFocusedIndex(idx)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                isFocused ? 'bg-blue-500/15 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex-shrink-0 p-1.5 rounded-lg bg-white/5">{ICONS[item.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.label}</p>
                {item.sub && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{item.sub}</p>
                )}
              </div>
              {isFocused && (
                <kbd className="text-xs text-slate-500 bg-white/10 px-1.5 py-0.5 rounded font-mono">↵</kbd>
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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[300] bg-black/60"
            style={{ backdropFilter: 'blur(8px)' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed z-[400] top-[12%] left-1/2 -translate-x-1/2 w-full max-w-[600px] mx-4"
            style={{
              background: 'rgba(12, 17, 27, 0.97)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.15)',
            }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8">
              {loading
                ? <Loader2 className="w-5 h-5 text-blue-400 flex-shrink-0 animate-spin" />
                : <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              }
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setFocusedIndex(-1) }}
                onKeyDown={handleKeyDown}
                placeholder="Search customers, deals, tasks…"
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-base outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="text-xs text-slate-600 bg-white/5 px-2 py-1 rounded font-mono border border-white/10">
                Esc
              </kbd>
            </div>

            {/* Results body */}
            <div className="max-h-[420px] overflow-y-auto">
              {/* Recent searches (shown when empty) */}
              {!query && recentSearches.length > 0 && (
                <div className="p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Recent
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(s)}
                        className="text-sm px-3 py-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/8 border border-white/8 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when no query */}
              {!query && !recentSearches.length && (
                <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
                  <Search className="w-8 h-8 opacity-40" />
                  <p className="text-sm">Type to search across your CRM</p>
                  <p className="text-xs opacity-60">Customers · Deals · Tasks</p>
                </div>
              )}

              {/* Search Results */}
              {query && !loading && hasResults && results && (
                <div className="py-2">
                  {renderSection('customers', results.customers)}
                  {renderSection('deals', results.deals)}
                  {renderSection('tasks', results.tasks)}
                </div>
              )}

              {/* No results */}
              {query && !loading && !hasResults && (
                <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
                  <SearchX className="w-7 h-7" />
                  <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
                </div>
              )}

              {/* Loading */}
              {query && loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Searching…</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span><kbd className="font-mono bg-white/5 px-1 py-0.5 rounded border border-white/10">↑↓</kbd> Navigate</span>
                <span><kbd className="font-mono bg-white/5 px-1 py-0.5 rounded border border-white/10">↵</kbd> Select</span>
              </div>
              <span className="opacity-50">Ctrl+K</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
