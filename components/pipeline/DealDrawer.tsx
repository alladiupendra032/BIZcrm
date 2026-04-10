'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, ClipboardList, Briefcase, User } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/Toast'
import { Deal } from './DealCard'
import { STAGES } from './KanbanBoard'
import { TaskWidget } from '@/components/tasks/TaskWidget'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'

interface DealDrawerProps {
  isOpen: boolean
  onClose: () => void
  deal: Deal | null
  onDealUpdate: (updatedDeal: Deal) => void
  onOpenCustomer: (customerId: string) => void
}

export function DealDrawer({ isOpen, onClose, deal, onDealUpdate, onOpenCustomer }: DealDrawerProps) {
  const { showToast } = useToast()
  const [editValue, setEditValue] = useState('')
  const [savingValue, setSavingValue] = useState(false)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)

  useEffect(() => {
    if (deal) setEditValue(deal.value?.toString() || '')
  }, [deal])

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

  const handleStageChange = async (newStage: string) => {
    if (!deal || deal.stage === newStage) return
    try {
      const { error } = await (supabase.from('deals') as any)
        .update({ stage: newStage })
        .eq('id', deal.id)
      if (error) throw error
      onDealUpdate({ ...deal, stage: newStage })
      showToast('success', `Stage updated to ${newStage}`)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to update stage')
    }
  }

  const handleValueBlur = async () => {
    if (!deal) return
    const numValue = parseFloat(editValue)
    const normalizedValue = isNaN(numValue) ? null : numValue
    if (deal.value === normalizedValue) return

    setSavingValue(true)
    try {
      const { error } = await (supabase.from('deals') as any)
        .update({ value: normalizedValue })
        .eq('id', deal.id)
      if (error) throw error
      onDealUpdate({ ...deal, value: normalizedValue })
      showToast('success', 'Value updated')
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to update value')
    } finally {
      setSavingValue(false)
    }
  }

  if (!deal) return null

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
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-full max-w-md z-[60] glass-panel border-l border-white/10 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                <h2 className="text-xl font-bold text-white tracking-tight">Deal Details</h2>
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

                {/* 1. Deal info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{deal.title}</h3>
                    <Badge status={deal.stage} />
                  </div>

                  <div className="glass-panel border-none bg-white/5 p-4 rounded-xl space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Expected Value</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={handleValueBlur}
                          className="bg-transparent border-b border-transparent focus:border-blue-500 hover:border-white/20 text-white text-lg font-semibold outline-none py-0.5 transition-all w-32"
                          placeholder="0.00"
                        />
                        {savingValue && <span className="text-xs text-slate-500 animate-pulse">Saving...</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      {deal.expected_close_date ? (
                        <span>Close expected on {new Date(deal.expected_close_date).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-slate-500 italic">No close date set</span>
                      )}
                    </div>

                    {deal.assigned_name && (
                      <div className="flex items-center gap-3 text-slate-300 text-sm">
                        <User className="w-4 h-4 text-slate-500" />
                        Assigned to {deal.assigned_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Customer Link */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    Related Customer
                  </h4>
                  {deal.customer_id ? (
                    <button
                      onClick={() => onOpenCustomer(deal.customer_id!)}
                      className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group flex items-center justify-between"
                    >
                      <span className="text-white font-medium group-hover:text-blue-300 transition-colors">
                        {deal.customer_name}
                      </span>
                      <span className="text-xs text-slate-500 group-hover:text-blue-400">View Profile &rarr;</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-sm">
                      No customer linked to this deal.
                    </div>
                  )}
                </div>

                {/* 3. Stage quick-change */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">Update Stage</h4>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStageChange(s)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                          ${deal.stage === s
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:text-white hover:bg-white/10'
                          }
                        `}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Linked Tasks — Phase 5 wired */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-semibold">Linked Tasks</h4>
                  </div>
                  <TaskWidget
                    dealId={deal.id}
                    onAddTask={() => setIsTaskFormOpen(true)}
                  />
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Form pre-filled with deal */}
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSuccess={() => setIsTaskFormOpen(false)}
        prefillDealId={deal.id}
      />
    </>
  )
}
