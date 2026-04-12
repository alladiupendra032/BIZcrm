'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, UserCheck, Send, Clock, Info } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface SentInvite {
  email: string
  role: string
  sentAt: string
}

const INVITE_ROLES = ['Manager', 'Team Member'] as const
type InviteRole = typeof INVITE_ROLES[number]

const ROLE_DESCRIPTIONS: Record<InviteRole, string> = {
  Manager:       'Can manage customers, deals, and tasks across the organization.',
  'Team Member': 'Can view shared data and manage their own assigned tasks.',
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const { showToast } = useToast()

  const [email,       setEmail]       = useState('')
  const [role,        setRole]        = useState<InviteRole>('Team Member')
  const [submitting,  setSubmitting]  = useState(false)
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([])
  const [emailError,  setEmailError]  = useState('')

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, role }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to send invite')

      showToast('success', `Invite sent to ${email}`)
      setSentInvites(prev => [{ email, role, sentAt: new Date().toLocaleTimeString() }, ...prev])
      setEmail('')
      setRole('Team Member')
      onSuccess()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send invite')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="glass-panel border border-white/15 rounded-2xl shadow-2xl w-full max-w-md">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  Invite Team Member
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailError('') }}
                      placeholder="colleague@company.com"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                      autoComplete="off"
                    />
                    {emailError && <p className="text-xs text-rose-400">{emailError}</p>}
                  </div>

                  {/* Role selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      {INVITE_ROLES.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all text-left ${
                            role === r
                              ? r === 'Manager'
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                : 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    {/* Role description */}
                    <p className="text-[11px] text-slate-500 leading-relaxed px-1">
                      {ROLE_DESCRIPTIONS[role]}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={submitting}
                      className="flex-1 flex items-center gap-2 justify-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submitting ? 'Sending…' : 'Send Invite'}
                    </Button>
                  </div>
                </form>

                {/* Info note */}
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest">How it works</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The invitee will receive an email with a secure link. They will set their password and be automatically added to your organization with the selected role.
                  </p>
                </div>

                {/* Sent this session */}
                {sentInvites.length > 0 && (
                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Sent This Session
                    </p>
                    {sentInvites.map((inv, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl text-xs">
                        <div>
                          <p className="text-white font-medium">{inv.email}</p>
                          <p className="text-slate-500">{inv.role} · {inv.sentAt}</p>
                        </div>
                        <span className="text-emerald-400 font-medium">Sent ✓</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
