'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Square, Plus, ClipboardList, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'

interface Task {
  id: string
  title: string
  status: 'Pending' | 'In Progress' | 'Completed'
  due_date: string | null
  assigned_to: string | null
}

interface TaskWidgetProps {
  customerId?: string
  dealId?: string
  onAddTask?: () => void
}

export function TaskWidget({ customerId, dealId, onAddTask }: TaskWidgetProps) {
  const { user } = useUser()
  const { showToast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!user?.organization_id) return
    setLoading(true)
    try {
      let query = supabase
        .from('tasks')
        .select('id, title, status, due_date, assigned_to')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })

      if (customerId) query = query.eq('related_customer', customerId)
      if (dealId) query = query.eq('related_deal', dealId)

      const { data, error } = await query
      if (error) throw error
      setTasks(data as Task[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user?.organization_id, customerId, dealId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const toggleTask = async (task: Task) => {
    const newStatus: Task['status'] = task.status === 'Completed' ? 'Pending' : 'Completed'
    setTogglingId(task.id)
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    try {
      const { error } = await (supabase.from('tasks') as any)
        .update({ status: newStatus })
        .eq('id', task.id)
      if (error) throw error
    } catch (err) {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t))
      showToast('error', 'Failed to update task')
    } finally {
      setTogglingId(null)
    }
  }

  const getDueDateColor = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'Completed') return 'text-slate-500'
    const due = new Date(dueDate)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    if (dueDay < today) return 'text-rose-400'
    if (dueDay.getTime() === today.getTime()) return 'text-amber-400'
    return 'text-slate-500'
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-10 rounded-lg bg-white/5 shimmer" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 py-4 text-center"
          >
            <ClipboardList className="w-6 h-6 text-slate-600" />
            <p className="text-xs text-slate-500">No tasks yet.</p>
          </motion.div>
        ) : (
          tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors group"
            >
              <button
                onClick={() => toggleTask(task)}
                disabled={togglingId === task.id}
                className="mt-0.5 flex-shrink-0 text-slate-500 hover:text-amber-400 transition-colors"
                aria-label={task.status === 'Completed' ? 'Mark incomplete' : 'Mark complete'}
              >
                {task.status === 'Completed' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge status={task.status} className="text-[10px] px-1.5 py-0" />
                  {task.due_date && (
                    <span className={`text-[10px] ${getDueDateColor(task.due_date, task.status)}`}>
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>

      {/* Add Task Button */}
      <button
        onClick={onAddTask}
        className="flex items-center gap-1.5 w-full px-2 py-2 text-xs text-slate-500 hover:text-amber-400 hover:bg-amber-500/5 rounded-lg transition-all border border-dashed border-white/10 hover:border-amber-500/30"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Task
      </button>
    </div>
  )
}
