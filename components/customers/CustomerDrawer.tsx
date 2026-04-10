'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Phone, Building2, Calendar, ClipboardList, Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { useToast } from '@/components/ui/Toast'
import { Customer } from './CustomerTable'

// We need to extend the Customer type locally to handle assigned_to
export interface ExtendedCustomer extends Customer {
  assigned_to?: string | null
}
import { Deal } from '../pipeline/DealCard'
import { TaskWidget } from '@/components/tasks/TaskWidget'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'

interface CustomerDrawerProps {
  isOpen: boolean
  onClose: () => void
  customer: ExtendedCustomer | null
  onCustomerUpdate: () => void
}

export function CustomerDrawer({ isOpen, onClose, customer, onCustomerUpdate }: CustomerDrawerProps) {
  const { role } = useUser()
  const { showToast } = useToast()

  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [deals, setDeals] = useState<Deal[]>([])
  const [dealsLoading, setDealsLoading] = useState(false)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [orgUsers, setOrgUsers] = useState<{ id: string; name: string }[]>([])
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [savingAssignee, setSavingAssignee] = useState(false)

  const isTeamMember = role === 'Team Member'
  const canConvert = (role === 'Admin' || role === 'Manager') && customer?.status === 'Lead'
  const canAssign = role === 'Admin' || role === 'Manager'

  useEffect(() => {
    if (customer) {
      setNotes(customer.notes || '')
      setAssignedTo(customer.assigned_to || '')
      fetchDeals(customer.id)
    } else {
      setDeals([])
    }
  }, [customer])

  useEffect(() => {
    if (isOpen && canAssign) {
      fetchUsers()
    }
  }, [isOpen, canAssign])

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('users').select('id, name').order('name')
      if (data) setOrgUsers(data as any)
    } catch (e) {}
  }

  const fetchDeals = async (customerId: string) => {
    setDealsLoading(true)
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('customer_id', customerId)
      if (error) throw error
      setDeals(data as Deal[])
    } catch (err) {
      console.error(err)
    } finally {
      setDealsLoading(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isTaskFormOpen) onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, isTaskFormOpen])

  const handleNotesBlur = async () => {
    if (!customer || customer.notes === notes || isTeamMember) return
    setSavingNotes(true)
    try {
      const { error } = await (supabase.from('customers') as any)
        .update({ notes })
        .eq('id', customer.id)
      if (error) throw error
      onCustomerUpdate()
    } catch (err: any) {
      console.error(err)
      showToast('error', 'Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!customer) return
    setSavingAssignee(true)
    setAssignedTo(newAssigneeId)
    try {
      const { error } = await (supabase.from('customers') as any)
        .update({ assigned_to: newAssigneeId || null })
        .eq('id', customer.id)
      if (error) throw error
      showToast('success', 'Assignee updated')
      onCustomerUpdate()
    } catch (err: any) {
      showToast('error', 'Failed to update assignee')
      setAssignedTo(customer.assigned_to || '') // rollback
    } finally {
      setSavingAssignee(false)
    }
  }

  const handleConvert = async () => {
    if (!customer) return
    try {
      const { error } = await (supabase.from('customers') as any)
        .update({ status: 'Active' })
        .eq('id', customer.id)
      if (error) throw error
      showToast('success', 'Customer converted to Active')
      onCustomerUpdate()
      onClose()
    } catch (err: any) {
      console.error(err)
      showToast('error', 'Failed to convert customer')
    }
  }

  if (!customer) {
    // Render TaskFormModal outside AnimatePresence even when drawer is closed
    // so it won't lose state on close — but isOpen will be false anyway.
    return null
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-full max-w-md z-50 glass-panel border-l border-white/10 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                <h2 className="text-xl font-bold text-white tracking-tight">Customer Profile</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* 1. Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{customer.name}</h3>
                      <Badge status={customer.status} className="mt-1" />
                    </div>
                  </div>

                  <div className="glass-panel border-none bg-white/5 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Mail className="w-4 h-4 text-slate-500" />
                      {customer.email || <span className="text-slate-600">No email</span>}
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Phone className="w-4 h-4 text-slate-500" />
                      {customer.phone || <span className="text-slate-600">No phone</span>}
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      {customer.company || <span className="text-slate-600">No company</span>}
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      Added {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Account Owner / Assignee */}
                  {canAssign && (
                    <div className="flex items-center justify-between glass-panel border-none bg-white/5 p-4 rounded-xl">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-white truncate">Account Owner</h4>
                        <p className="text-xs text-slate-400">Assigned team member</p>
                      </div>
                      <div className="relative">
                        <select
                          value={assignedTo}
                          onChange={(e) => handleAssigneeChange(e.target.value)}
                          disabled={savingAssignee}
                          className="px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/60 transition-all disabled:opacity-50 min-w-[140px]"
                        >
                          <option value="">Unassigned</option>
                          {orgUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name || 'Unnamed'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Action — Lead Conversion */}
                {canConvert && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-4 rounded-xl border border-blue-500/20">
                    <h4 className="text-sm font-semibold text-blue-300 mb-2">Lead Conversion</h4>
                    <p className="text-sm text-slate-400 mb-4">
                      This customer is marked as a lead. Ready to move them to Active status?
                    </p>
                    <Button variant="primary" size="sm" onClick={handleConvert} className="w-full">
                      Convert to Active
                    </Button>
                  </div>
                )}

                {/* 2. Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Internal Notes</h4>
                    {savingNotes && <span className="text-xs text-slate-500 animate-pulse">Saving...</span>}
                  </div>
                  {isTeamMember ? (
                    <div className="w-full min-h-[100px] p-4 bg-black/20 rounded-xl text-sm text-slate-300 border border-white/5">
                      {notes || <span className="text-slate-600 italic">No notes provided.</span>}
                    </div>
                  ) : (
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      onBlur={handleNotesBlur}
                      placeholder="Add operational notes here... (auto-saves)"
                      className="w-full min-h-[100px] py-3 px-4 bg-black/20 rounded-xl text-white text-sm border-2 border-transparent hover:border-white/10 focus:border-blue-500 focus:bg-black/40 outline-none transition-all resize-y placeholder:text-slate-600"
                    />
                  )}
                </div>

                {/* 3. Related Deals */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-semibold">Related Deals</h4>
                  </div>
                  {dealsLoading ? (
                    <div className="glass-panel p-4 flex justify-center">
                      <span className="text-xs text-slate-500 animate-pulse">Loading deals...</span>
                    </div>
                  ) : deals.length === 0 ? (
                    <div className="glass-panel p-4 text-center opacity-70">
                      <span className="text-xs text-slate-500">No deals linked to this customer yet.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deals.map(d => (
                        <div
                          key={d.id}
                          className="glass-panel p-3 flex flex-col gap-2 rounded-xl text-sm border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-white">{d.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                d.value && d.value > 10000
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-white/5 text-slate-300'
                              }`}
                            >
                              {d.value ? `$${Number(d.value).toLocaleString()}` : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <Badge status={d.stage} />
                            {d.expected_close_date && (
                              <span className="text-slate-500">
                                Close: {new Date(d.expected_close_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Related Tasks — Phase 5 wired */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-semibold">Related Tasks</h4>
                  </div>
                  <TaskWidget
                    customerId={customer.id}
                    onAddTask={() => setIsTaskFormOpen(true)}
                  />
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Form pre-filled with customer — rendered outside AnimatePresence so it has its own z-index */}
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSuccess={() => setIsTaskFormOpen(false)}
        prefillCustomerId={customer.id}
      />
    </>
  )
}
