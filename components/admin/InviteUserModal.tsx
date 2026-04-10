'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, UserCheck, Send, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface PendingInvite {
  email: string
  role: string
  sentAt: string
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'User' | 'Manager' | 'Team Member'>('Team Member')
  const [submitting, setSubmitting] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [emailError, setEmailError] = useState('')

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
      // Get current user session for auth header
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
      setPendingInvites(prev => [
        { email, role, sentAt: new Date().toLocaleTimeString() },
        ...prev,
      ])
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
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
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
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    />
                    {emailError && <p className="text-xs text-rose-400">{emailError}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                      style={{ colorScheme: 'dark' }}
                    >
                      {(['User', 'Manager', 'Team Member'] as const).map(r => (
                        <option key={r} value={r} style={{ background: '#0d1117' }}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" disabled={submitting} className="flex-1 flex items-center gap-2 justify-center">
                      <Send className="w-3.5 h-3.5" />
                      {submitting ? 'Sending...' : 'Send Invite'}
                    </Button>
                  </div>
                </form>

                {/* Resend Verification Notice (Explain why users might not get mail) */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Resend Security Note</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    <span className="text-amber-200/80">Are users not receiving emails?</span> By default, Resend only sends to your own address. To invite others, you must verify your domain or use Hostinger SMTP.
                  </p>
                </div>

                {/* Pending invites list */}
                {pendingInvites.length > 0 && (
                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Sent This Session
                    </p>
                    {pendingInvites.map((inv, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl text-xs">
                        <div>
                          <p className="text-white font-medium">{inv.email}</p>
                          <p className="text-slate-500">{inv.role} · {inv.sentAt}</p>
                        </div>
                        <span className="text-emerald-400 text-xs font-medium">Sent ✓</span>
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
