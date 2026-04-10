'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare, Square, ChevronDown, Edit2, Trash2,
  ClipboardList, Calendar, User, Building2, Briefcase, AlertCircle,
  RotateCcw
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'

export interface Task {
  id: string
  title: string
  description: string | null
  status: 'Pending' | 'In Progress' | 'Completed'
  due_date: string | null
  assigned_to: string | null
  related_customer: string | null
  related_deal: string | null
  organization_id: string
  created_at: string
  // joined
  assigned_name?: string
  customer_name?: string
  deal_title?: string
}

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onTaskUpdated: (updatedTask: Task) => void
  onTaskDeleted: (taskId: string) => void
  onEdit: (task: Task) => void
  onOpenCustomer?: (customerId: string) => void
  onOpenDeal?: (dealId: string) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getDueDateColor(dueDate: string | null, status: string) {
  if (!dueDate || status === 'Completed') return 'text-slate-500'
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (due < today) return 'text-rose-400'
  if (due.toDateString() === today.toDateString()) return 'text-amber-400'
  return 'text-slate-500'
}

function formatDue(dueDate: string | null) {
  if (!dueDate) return null
  const d = new Date(dueDate)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Checkbox with burst animation ─────────────────────────────────────────────
function AnimatedCheckbox({
  checked,
  onToggle,
  disabled,
}: { checked: boolean; onToggle: () => void; disabled: boolean }) {
  const [burst, setBurst] = useState(false)

  const handleClick = () => {
    if (!checked) {
      setBurst(true)
      setTimeout(() => setBurst(false), 500)
    }
    onToggle()
  }

  return (
    <div className="relative flex-shrink-0">
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        whileTap={{ scale: 0.85 }}
        className="relative w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: checked ? '#10B981' : 'rgba(255,255,255,0.2)',
          background: checked ? 'rgba(16,185,129,0.15)' : 'transparent',
        }}
        aria-label={checked ? 'Mark as pending' : 'Mark as complete'}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Burst particles */}
      <AnimatePresence>
        {burst && (
          <>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((angle * Math.PI) / 180) * 18,
                  y: Math.sin((angle * Math.PI) / 180) * 18,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 pointer-events-none"
                style={{ translateX: '-50%', translateY: '-50%' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Single Task Row ───────────────────────────────────────────────────────────
function TaskRow({
  task,
  index,
  isCompleted,
  onToggle,
  onEdit,
  onDelete,
  onOpenCustomer,
  onOpenDeal,
  canEdit,
  toggling,
}: {
  task: Task
  index: number
  isCompleted: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onOpenCustomer?: (id: string) => void
  onOpenDeal?: (id: string) => void
  canEdit: boolean
  toggling: boolean
}) {
  const dueDateColor = getDueDateColor(task.due_date, task.status)
  const formattedDue = formatDue(task.due_date)
  const isOverdue =
    task.status !== 'Completed' &&
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    new Date(task.due_date).toDateString() !== new Date().toDateString()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all group ${
        isCompleted
          ? 'bg-white/2 border-white/5 opacity-60'
          : 'bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/15'
      }`}
    >
      {/* Checkbox */}
      <AnimatedCheckbox checked={isCompleted} onToggle={onToggle} disabled={toggling} />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-medium leading-snug transition-all ${
              isCompleted ? 'line-through text-slate-500' : 'text-white'
            }`}
          >
            {task.title}
          </p>
          {/* Actions — visible on hover */}
          {canEdit && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={onEdit}
                className="p-1 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-all"
                aria-label="Edit task"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status badge */}
          <Badge status={task.status} />

          {/* Due date */}
          {formattedDue && (
            <span className={`flex items-center gap-1 text-xs ${dueDateColor}`}>
              {isOverdue && <AlertCircle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              {formattedDue}
            </span>
          )}

          {/* Assignee */}
          {task.assigned_name && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <User className="w-3 h-3" />
              {task.assigned_name}
            </span>
          )}

          {/* Customer pill */}
          {task.customer_name && task.related_customer && (
            <button
              onClick={() => onOpenCustomer?.(task.related_customer!)}
              className="flex items-center gap-1 text-xs text-cyan-400/80 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded-full transition-all"
            >
              <Building2 className="w-3 h-3" />
              {task.customer_name}
            </button>
          )}

          {/* Deal pill */}
          {task.deal_title && task.related_deal && (
            <button
              onClick={() => onOpenDeal?.(task.related_deal!)}
              className="flex items-center gap-1 text-xs text-blue-400/80 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-full transition-all"
            >
              <Briefcase className="w-3 h-3" />
              {task.deal_title}
            </button>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{task.description}</p>
        )}
      </div>
    </motion.div>
  )
}

// ── Main TaskList ─────────────────────────────────────────────────────────────
export function TaskList({
  tasks,
  loading,
  error,
  onRetry,
  onTaskUpdated,
  onTaskDeleted,
  onEdit,
  onOpenCustomer,
  onOpenDeal,
}: TaskListProps) {
  const { role } = useUser()
  const { showToast } = useToast()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [completedExpanded, setCompletedExpanded] = useState(false)

  const canEdit = role === 'Admin' || role === 'Manager'

  const activeTasks = tasks.filter(t => t.status !== 'Completed')
  const completedTasks = tasks.filter(t => t.status === 'Completed')

  const handleToggle = async (task: Task) => {
    const newStatus: Task['status'] = task.status === 'Completed' ? 'Pending' : 'Completed'
    setTogglingId(task.id)
    // Optimistic
    onTaskUpdated({ ...task, status: newStatus })
    try {
      const { error } = await (supabase.from('tasks') as any)
        .update({ status: newStatus })
        .eq('id', task.id)
      if (error) throw error
    } catch (err) {
      // Revert
      onTaskUpdated(task)
      showToast('error', 'Failed to update task status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    setDeletingId(task.id)
    // Optimistic removal
    onTaskDeleted(task.id)
    try {
      const { error } = await (supabase.from('tasks') as any).delete().eq('id', task.id)
      if (error) throw error
      showToast('success', 'Task deleted')
    } catch (err) {
      showToast('error', 'Failed to delete task')
      onRetry() // re-fetch to restore
    } finally {
      setDeletingId(null)
    }
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/8">
            <div className="w-5 h-5 rounded-md bg-white/10 shimmer flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded bg-white/10 shimmer w-3/5" />
              <div className="h-3 rounded bg-white/5 shimmer w-2/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="glass-panel border border-rose-500/20 p-8 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="text-white font-semibold">Failed to load tasks</p>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" /> Retry
        </button>
      </div>
    )
  }

  // ── Empty state ──
  if (tasks.length === 0) {
    return (
      <div className="glass-panel border border-white/10 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
          <ClipboardList className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No tasks found</h3>
        <p className="text-slate-400 text-sm max-w-xs">
          Create your first task using the <span className="text-white font-medium">+ Add New</span> button above.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Active Tasks ── */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Active · {activeTasks.length}
        </h3>
        <AnimatePresence initial={false} mode="popLayout">
          {activeTasks.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-500 px-4 py-3 bg-white/3 rounded-xl border border-white/5 border-dashed text-center"
            >
              All caught up! No active tasks.
            </motion.p>
          ) : (
            activeTasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                index={i}
                isCompleted={false}
                onToggle={() => handleToggle(task)}
                onEdit={() => onEdit(task)}
                onDelete={() => handleDelete(task)}
                onOpenCustomer={onOpenCustomer}
                onOpenDeal={onOpenDeal}
                canEdit={canEdit}
                toggling={togglingId === task.id}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Completed Tasks (collapsed by default) ── */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 hover:text-white transition-colors"
          >
            <motion.div animate={{ rotate: completedExpanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
            Completed · {completedTasks.length}
          </button>

          <AnimatePresence>
            {completedExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden space-y-2"
              >
                <AnimatePresence initial={false} mode="popLayout">
                  {completedTasks.map((task, i) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      index={i}
                      isCompleted
                      onToggle={() => handleToggle(task)}
                      onEdit={() => onEdit(task)}
                      onDelete={() => handleDelete(task)}
                      onOpenCustomer={onOpenCustomer}
                      onOpenDeal={onOpenDeal}
                      canEdit={canEdit}
                      toggling={togglingId === task.id}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
