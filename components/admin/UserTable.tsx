'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ChevronDown, X, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface OrgUser {
  id: string
  name: string | null
  email: string | null
  role: 'Admin' | 'Manager' | 'Team Member' | 'User'
  organization_id: string | null
}

// DB roles available in the role dropdown
// 'User' is the friendly label for 'Team Member' — both map to the same DB value
const ROLES = ['Admin', 'Manager', 'Team Member', 'User'] as const

// Maps display label → actual DB role value saved
const ROLE_TO_DB: Record<string, string> = {
  Admin:         'Admin',
  Manager:       'Manager',
  'Team Member': 'Team Member',
  User:          'Team Member',   // "User" is UI label; saved as "Team Member" in DB
}

// Badge color per role
const ROLE_COLOR: Record<string, string> = {
  Admin:         'bg-purple-500/20 text-purple-300 border border-purple-500/20',
  Manager:       'bg-amber-500/20  text-amber-300  border border-amber-500/20',
  'Team Member': 'bg-blue-500/20   text-blue-300   border border-blue-500/20',
  User:          'bg-blue-500/20   text-blue-300   border border-blue-500/20',
}

interface UserTableProps {
  onUsersChange?: () => void
}

export function UserTable({ onUsersChange }: UserTableProps) {
  const { user: currentUser } = useUser()
  const { showToast } = useToast()

  const [users, setUsers] = useState<OrgUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'role' | 'remove'
    userId: string
    userName: string
    newRole?: string
  } | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!currentUser?.organization_id) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, organization_id')
        .eq('organization_id', currentUser.organization_id)
        .order('name')
      if (error) throw error
      setUsers((data || []) as OrgUser[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentUser?.organization_id])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const adminCount = users.filter(u => u.role === 'Admin').length

  const handleRoleChange = async () => {
    if (!confirmDialog || confirmDialog.type !== 'role') return
    const { userId, newRole } = confirmDialog

    // Guard: cannot remove last admin
    if (newRole !== 'Admin' && userId === currentUser?.id && adminCount <= 1) {
      showToast('error', 'You cannot remove yourself as the only Admin.')
      setConfirmDialog(null)
      return
    }

    // Map UI label → DB value ('User' → 'Team Member')
    const dbRole = ROLE_TO_DB[newRole ?? ''] ?? newRole

    setSaving(userId)
    try {
      const { error } = await (supabase.from('users') as any)
        .update({ role: dbRole })
        .eq('id', userId)
      if (error) throw error
      // Store the display label the user selected in local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u))
      showToast('success', `Role updated to ${dbRole}`)
      onUsersChange?.()
    } catch (err: any) {
      showToast('error', 'Failed to update role')
    } finally {
      setSaving(null)
      setConfirmDialog(null)
    }
  }

  const handleRemoveUser = async () => {
    if (!confirmDialog || confirmDialog.type !== 'remove') return
    const { userId } = confirmDialog
    if (userId === currentUser?.id) {
      showToast('error', 'You cannot remove yourself.')
      setConfirmDialog(null)
      return
    }

    setSaving(userId)
    try {
      const { error } = await (supabase.from('users') as any)
        .update({ organization_id: null })
        .eq('id', userId)
      if (error) throw error
      setUsers(prev => prev.filter(u => u.id !== userId))
      showToast('success', 'User removed from organization')
      onUsersChange?.()
    } catch (err: any) {
      showToast('error', 'Failed to remove user')
    } finally {
      setSaving(null)
      setConfirmDialog(null)
    }
  }

  if (loading) {
    return (
      <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        {[0,1,2,3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-white/5">
            <div className="w-9 h-9 rounded-full bg-white/10 shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 rounded bg-white/10 shimmer w-1/3" />
              <div className="h-3 rounded bg-white/5 shimmer w-1/2" />
            </div>
            <div className="h-7 w-28 rounded-lg bg-white/10 shimmer" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-panel border border-rose-500/20 p-8 text-center rounded-2xl">
        <p className="text-rose-400 text-sm">{error}</p>
        <Button variant="ghost" size="sm" onClick={fetchUsers} className="mt-3">Retry</Button>
      </div>
    )
  }

  return (
    <>
      <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* Desktop Header */}
        <div className="hidden md:grid md:grid-cols-[1fr_1.2fr_160px_60px] gap-4 px-6 py-4 bg-white/5 border-b border-white/10 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          <span>Member Profile</span>
          <span>Contact Email</span>
          <span>Access Level</span>
          <span className="text-right">Actions</span>
        </div>

        {users.map((u, i) => {
          const initials = u.name?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || '?'
          const isSelf = u.id === currentUser?.id
          const isLastAdmin = u.role === 'Admin' && adminCount <= 1

          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group"
            >
              {/* Desktop Row */}
              <div className="hidden md:grid md:grid-cols-[1fr_1.2fr_160px_60px] gap-4 items-center px-6 py-4 border-b border-white/5 hover:bg-white/[0.03] transition-all relative">
                {/* Profile */}
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                      {u.name || 'Unnamed'}
                      {isSelf && <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-slate-400 uppercase font-bold tracking-widest">You</span>}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider md:hidden">
                      {u.role}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 text-slate-400 min-w-0">
                  <p className="text-sm truncate font-medium">{u.email || '—'}</p>
                </div>

                {/* Role */}
                <div className="relative">
                  <select
                    value={u.role}
                    disabled={saving === u.id || isLastAdmin}
                    onChange={e => setConfirmDialog({
                      type: 'role',
                      userId: u.id,
                      userName: u.name || 'user',
                      newRole: e.target.value,
                    })}
                    className="w-full pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500/50 appearance-none transition-all disabled:opacity-30 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r} style={{ background: '#0d1117' }}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                </div>

                {/* Remove */}
                <div className="flex justify-end">
                  {!isSelf && !isLastAdmin && (
                    <button
                      onClick={() => setConfirmDialog({ type: 'remove', userId: u.id, userName: u.name || 'user' })}
                      disabled={saving === u.id}
                      className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      {saving === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Card */}
              <div className="md:hidden flex flex-col p-5 border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{u.name || 'Unnamed'}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  {!isSelf && !isLastAdmin && (
                    <button
                      onClick={() => setConfirmDialog({ type: 'remove', userId: u.id, userName: u.name || 'user' })}
                      className="p-2 text-rose-400 bg-rose-500/10 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1.5 block">Access Level</label>
                    <div className="relative">
                      <select
                        value={u.role}
                        disabled={saving === u.id || isLastAdmin}
                        onChange={e => setConfirmDialog({
                          type: 'role',
                          userId: u.id,
                          userName: u.name || 'user',
                          newRole: e.target.value,
                        })}
                        className="w-full pl-4 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white appearance-none transition-all"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r} style={{ background: '#0d1117' }}>{r}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDialog(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[80] flex items-center justify-center p-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="glass-panel border border-white/15 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-white font-semibold">
                    {confirmDialog.type === 'role' ? 'Change Role' : 'Remove User'}
                  </h3>
                </div>
                <p className="text-sm text-slate-400 mb-5">
                  {confirmDialog.type === 'role'
                    ? `Change ${confirmDialog.userName}'s role to ${confirmDialog.newRole}?`
                    : `Remove ${confirmDialog.userName} from this organization? They will lose access immediately.`}
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDialog(null)} className="flex-1">Cancel</Button>
                  <Button
                    variant="primary" size="sm"
                    onClick={confirmDialog.type === 'role' ? handleRoleChange : handleRemoveUser}
                    className="flex-1"
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
