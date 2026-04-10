'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, AlignLeft, User, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  prefillCustomerId?: string | null
  prefillDealId?: string | null
}

interface CustomerOption { id: string; name: string }
interface DealOption { id: string; title: string }
interface UserOption { id: string; name: string }

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'] as const

export function TaskFormModal({
  isOpen,
  onClose,
  onSuccess,
  prefillCustomerId,
  prefillDealId,
}: TaskFormModalProps) {
  const { user, role } = useUser()
  const { showToast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [customerId, setCustomerId] = useState(prefillCustomerId || '')
  const [dealId, setDealId] = useState(prefillDealId || '')
  const [submitting, setSubmitting] = useState(false)

  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [deals, setDeals] = useState<DealOption[]>([])
  const [users, setUsers] = useState<UserOption[]>([])

  const isAdminOrManager = role === 'Admin' || role === 'Manager'
  const canAssign = isAdminOrManager

  // Min date = today ISO string (date part only)
  const todayStr = new Date().toISOString().slice(0, 16)

  useEffect(() => {
    if (!isOpen) return
    setCustomerId(prefillCustomerId || '')
    setDealId(prefillDealId || '')
    loadDropdowns()
  }, [isOpen, prefillCustomerId, prefillDealId])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const loadDropdowns = async () => {
    if (!user?.organization_id) return
    const orgId = user.organization_id
    const [cRes, dRes, uRes] = await Promise.all([
      supabase.from('customers').select('id, name').eq('organization_id', orgId).eq('archived', false).order('name'),
      supabase.from('deals').select('id, title').eq('organization_id', orgId).order('title'),
      supabase.from('users').select('id, name').eq('organization_id', orgId).order('name'),
    ])
    setCustomers((cRes.data || []) as CustomerOption[])
    setDeals((dRes.data || []) as DealOption[])
    setUsers((uRes.data || []) as UserOption[])
    if (!canAssign && user?.id) setAssignedTo(user.id)
    else setAssignedTo(user?.id || '')
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDueDate('')
    setStatus('Pending')
    setAssignedTo(user?.id || '')
    setCustomerId(prefillCustomerId || '')
    setDealId(prefillDealId || '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (!user?.organization_id) return

    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        status,
        assigned_to: assignedTo || user.id,
        related_customer: customerId || null,
        related_deal: dealId || null,
        organization_id: user.organization_id,
      }
      const { error } = await (supabase.from('tasks') as any).insert(payload)
      if (error) throw error
      showToast('success', 'Task created successfully')
      resetForm()
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      showToast('error', err.message || 'Failed to create task')
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            <div className="glass-panel border border-white/15 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">New Task</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    placeholder="Task title..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5" /> Description
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Additional details..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors resize-none"
                  />
                </div>

                {/* Due Date + Status Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      min={todayStr}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/60 transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Assigned To (Admin/Manager) */}
                {canAssign && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Assigned To
                    </label>
                    <select
                      value={assignedTo}
                      onChange={e => setAssignedTo(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Link Customer + Deal Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Link Customer</label>
                    <select
                      value={customerId}
                      onChange={e => setCustomerId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                    >
                      <option value="">No customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Link Deal</label>
                    <select
                      value={dealId}
                      onChange={e => setDealId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                    >
                      <option value="">No deal</option>
                      {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                  <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
