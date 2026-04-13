'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Bell, User, ChevronDown, Settings, LogOut,
  Briefcase, CheckSquare, Command, Users, UserPlus,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { SearchResultsDropdown, SearchResults } from '@/components/search/SearchResultsDropdown'
import { CommandPalette } from '@/components/search/CommandPalette'

type OpenMenu = 'none' | 'add' | 'profile'

// ─── Main TopBar ─────────────────────────────────────────────────────────────
export function TopBar() {
  const router = useRouter()
  const { user, role } = useUser()

  const isAdmin = role === 'Admin'

  // ── Single source of truth for which dropdown is open ──
  const [openMenu, setOpenMenu] = useState<OpenMenu>('none')
  const addMenuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchFocusedIndex, setSearchFocusedIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // ── Command Palette ──
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // ── Close all menus on outside click ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const clickedAdd = addMenuRef.current?.contains(target)
      const clickedProfile = profileMenuRef.current?.contains(target)
      const clickedSearch = searchContainerRef.current?.contains(target)

      if (!clickedAdd && !clickedProfile) {
        setOpenMenu('none')
      }
      if (!clickedSearch) {
        setSearchFocused(false)
        setSearchQuery('')
        setSearchResults(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpenMenu('none')
        setCommandPaletteOpen(true)
        return
      }
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        setOpenMenu('none')
        searchInputRef.current?.focus()
        setSearchFocused(true)
      }
      if (e.key === 'Escape') {
        setOpenMenu('none')
        setSearchFocused(false)
        setSearchQuery('')
        setSearchResults(null)
        searchInputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // ── Debounced FTS search ──
  useEffect(() => {
    if (!searchQuery || !user?.organization_id) {
      setSearchResults(null)
      return
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const { data, error } = await (supabase as any).rpc('search_all', {
          query: searchQuery,
          org_id: user.organization_id,
        })
        if (error) {
          console.error('[Search] RPC error:', error.message, error)
          setSearchResults({ customers: [], deals: [], tasks: [] })
        } else if (data) {
          setSearchResults(data as SearchResults)
        }
      } catch (err) {
        console.error('[Search] Unexpected error:', err)
        setSearchResults({ customers: [], deals: [], tasks: [] })
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [searchQuery, user?.organization_id])

  const flatItems = searchResults
    ? [...searchResults.customers, ...searchResults.deals, ...searchResults.tasks]
    : []

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSearchFocusedIndex(i => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSearchFocusedIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && searchFocusedIndex >= 0 && flatItems[searchFocusedIndex]) {
      const item = flatItems[searchFocusedIndex]
      setSearchFocused(false)
      setSearchQuery('')
      setSearchResults(null)
      if (item.type === 'customer') router.push(`/customers?highlight=${item.id}`)
      else if (item.type === 'deal') router.push(`/pipeline?highlight=${item.id}`)
      else router.push(`/tasks?highlight=${item.id}`)
    } else if (e.key === 'Escape') {
      setSearchFocused(false)
      setSearchQuery('')
      setSearchResults(null)
    }
  }

  const handleLogout = async () => {
    setOpenMenu('none')
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const toggleMenu = (menu: 'add' | 'profile') => {
    setOpenMenu(prev => (prev === menu ? 'none' : menu))
  }

  const closeMenu = () => setOpenMenu('none')

  const initials =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    '?'

  const searchDropdownOpen = searchFocused && (searchQuery.length > 0 || searchLoading)

  return (
    <>
      <header
        className="flex items-center gap-3 px-6 py-3 border-b border-white/8 flex-shrink-0 relative z-[100]"
        style={{
          background: 'rgba(11, 14, 20, 0.85)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      >
        {/* ── Global Search Pill ── */}
        <div className="flex-1 max-w-md relative" ref={searchContainerRef}>
          <motion.div
            animate={{
              borderColor: searchFocused ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
              boxShadow: searchFocused ? '0 0 0 2px rgba(99,102,241,0.2)' : 'none',
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              ref={searchInputRef}
              id="global-search"
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchFocusedIndex(-1) }}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none min-w-0"
              aria-label="Global search"
            />
            {!searchQuery && (
              <kbd className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-slate-600 font-mono flex-shrink-0">
                /
              </kbd>
            )}
          </motion.div>
          <SearchResultsDropdown
            results={searchResults}
            loading={searchLoading}
            query={searchQuery}
            isOpen={searchDropdownOpen}
            focusedIndex={searchFocusedIndex}
            onClose={() => { setSearchFocused(false); setSearchQuery(''); setSearchResults(null) }}
            onFocusChange={setSearchFocusedIndex}
          />
        </div>

        {/* ── Right Side Controls ── */}
        <div className="flex items-center gap-2">

          {/* Ctrl+K hint */}
          <motion.button
            id="command-palette-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setOpenMenu('none'); setCommandPaletteOpen(true) }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all text-xs"
            title="Command Palette (Ctrl+K)"
          >
            <Command className="w-3.5 h-3.5" />
            <kbd className="font-mono bg-white/8 px-1.5 py-0.5 rounded border border-white/10 text-slate-500">K</kbd>
          </motion.button>

          {/* ── Add New Dropdown ── */}
          <div className="relative" ref={addMenuRef}>
            <motion.button
              id="quick-add-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleMenu('add')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                boxShadow: '0 0 20px rgba(99,102,241,0.4)',
              }}
              aria-label="Quick add"
              aria-expanded={openMenu === 'add'}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New</span>
              <ChevronDown
                className={`w-3 h-3 opacity-70 transition-transform duration-200 ${openMenu === 'add' ? 'rotate-180' : ''}`}
              />
            </motion.button>

            <AnimatePresence>
              {openMenu === 'add' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  className="absolute right-0 top-full mt-2 w-52 z-[200]"
                  style={{
                    background: 'rgba(14, 19, 30, 0.98)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '14px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
                    backdropFilter: 'blur(20px)',
                    overflow: 'hidden',
                  }}
                >
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Quick Add</p>
                  </div>
                  <div className="px-2 pb-2 space-y-0.5">
                    <QuickAddItem
                      icon={<Users className="w-4 h-4 text-blue-400" />}
                      label="Add Customer"
                      desc="New contact or lead"
                      onClick={() => { closeMenu(); router.push('/customers?new=true') }}
                    />
                    <QuickAddItem
                      icon={<Briefcase className="w-4 h-4 text-indigo-400" />}
                      label="Add Deal"
                      desc="Track an opportunity"
                      onClick={() => { closeMenu(); router.push('/pipeline?new=true') }}
                    />
                    <QuickAddItem
                      icon={<CheckSquare className="w-4 h-4 text-emerald-400" />}
                      label="Add Task"
                      desc="Create a to-do item"
                      onClick={() => { closeMenu(); router.push('/tasks?new=true') }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Notification Bell ── */}
          <motion.button
            id="notification-bell"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"
              style={{ boxShadow: '0 0 6px rgba(239,68,68,0.8)', animation: 'pulseDot 1.5s ease-in-out infinite' }}
            />
          </motion.button>

          {/* ── User Profile Dropdown ── */}
          <div className="relative" ref={profileMenuRef}>
            <motion.button
              id="user-avatar-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleMenu('profile')}
              className="flex items-center gap-2 px-1.5 py-1 rounded-xl hover:bg-white/8 transition-all"
              aria-label="User menu"
              aria-expanded={openMenu === 'profile'}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] flex-shrink-0">
                {initials}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${openMenu === 'profile' ? 'rotate-180' : ''}`}
              />
            </motion.button>

            <AnimatePresence>
              {openMenu === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  className="absolute right-0 top-full mt-2 w-60 z-[200]"
                  style={{
                    background: 'rgba(14, 19, 30, 0.98)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '14px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
                    backdropFilter: 'blur(20px)',
                    overflow: 'hidden',
                  }}
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-white/8">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        {role && (
                          <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            role === 'Admin' ? 'bg-purple-500/20 text-purple-300'
                            : role === 'Manager' ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="px-2 py-2 space-y-0.5">

                    <ProfileMenuItem
                      icon={<User className="w-4 h-4 text-slate-400" />}
                      label="My Profile"
                      onClick={() => { closeMenu(); router.push('/settings/profile') }}
                    />
                    <ProfileMenuItem
                      icon={<Settings className="w-4 h-4 text-slate-400" />}
                      label="Settings"
                      onClick={() => { closeMenu(); router.push('/settings') }}
                    />
                  </div>

                  <div className="px-2 pb-2 border-t border-white/8 pt-1.5">
                    <ProfileMenuItem
                      icon={<LogOut className="w-4 h-4 text-rose-400" />}
                      label="Logout"
                      onClick={handleLogout}
                      danger
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function QuickAddItem({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.06)' }}
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all"
    >
      <span className="p-1.5 rounded-lg bg-white/5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white leading-tight">{label}</p>
        <p className="text-xs text-slate-500 leading-tight mt-0.5">{desc}</p>
      </div>
    </motion.button>
  )
}

function ProfileMenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all ${
        danger
          ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
          : 'text-slate-300 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </motion.button>
  )
}



