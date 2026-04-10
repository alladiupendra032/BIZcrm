'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckSquare, Users, Plus } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useUser } from '@/lib/UserContext'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'

import { TaskList, Task } from '@/components/tasks/TaskList'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TeamOverview } from '@/components/tasks/TeamOverview'

// For opening customer/deal drawers from task pills
import { CustomerDrawer } from '@/components/customers/CustomerDrawer'
import { Customer } from '@/components/customers/CustomerTable'
import { DealDrawer } from '@/components/pipeline/DealDrawer'
import { Deal } from '@/components/pipeline/DealCard'

type ActiveTab = 'tasks' | 'team'

export default function TasksPage() {
  const { user, role, loading: userLoading } = useUser()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks')

  // ── Filter state (persist in URL) ──
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>(
    (searchParams.get('status') as any) || 'All'
  )
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'today' | 'week' | 'overdue'>(
    (searchParams.get('due') as any) || 'all'
  )
  const [assigneeFilter, setAssigneeFilter] = useState(searchParams.get('assignee') || 'All')

  // ── Data ──
  const [tasks, setTasks] = useState<Task[]>([])
  const [orgUsers, setOrgUsers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // ── Modal / Drawer state ──
  const [isFormOpen, setIsFormOpen] = useState(searchParams.get('new') === 'true')
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [dealDrawerOpen, setDealDrawerOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)

  const isAdminOrManager = role === 'Admin' || role === 'Manager'

  // ── Sync filter state → URL ──
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statusFilter !== 'All') params.set('status', statusFilter)
    if (dueDateFilter !== 'all') params.set('due', dueDateFilter)
    if (assigneeFilter !== 'All') params.set('assignee', assigneeFilter)
    const newUrl = params.toString() ? `/tasks?${params.toString()}` : '/tasks'
    router.replace(newUrl, { scroll: false })
  }, [search, statusFilter, dueDateFilter, assigneeFilter, router])

  // ── Fetch tasks ──
  const fetchTasks = useCallback(async () => {
    if (!user?.organization_id) return
    setLoading(true)
    setFetchError(null)
    try {
      let query = supabase
        .from('tasks')
        .select(`
          id, title, description, status, due_date,
          assigned_to, related_customer, related_deal,
          organization_id, created_at,
          users(name),
          customers(name),
          deals(title)
        `)
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })

      // Role scope: Team Members only see their own tasks
      if (role === 'Team Member') {
        query = query.eq('assigned_to', user.id)
      }

      const { data, error } = await query
      if (error) throw error

      const mapped: Task[] = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        due_date: r.due_date,
        assigned_to: r.assigned_to,
        related_customer: r.related_customer,
        related_deal: r.related_deal,
        organization_id: r.organization_id,
        created_at: r.created_at,
        assigned_name: r.users?.name,
        customer_name: r.customers?.name,
        deal_title: r.deals?.title,
      }))
      setTasks(mapped)

      // Fetch org users for filter (Admin/Manager only)
      if (isAdminOrManager) {
        const { data: uData } = await supabase
          .from('users')
          .select('id, name')
          .eq('organization_id', user.organization_id)
        setOrgUsers((uData || []) as { id: string; name: string }[])
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [user?.organization_id, user?.id, role, isAdminOrManager])

  useEffect(() => {
    if (!userLoading && user?.organization_id) fetchTasks()
  }, [userLoading, user?.organization_id, fetchTasks])

  // ── Client-side filtering ──
  const filteredTasks = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekEnd = new Date(todayStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    return tasks.filter(task => {
      if (search) {
        const lower = search.toLowerCase()
        if (!task.title.toLowerCase().includes(lower)) return false
      }
      if (statusFilter !== 'All' && task.status !== statusFilter) return false
      if (assigneeFilter !== 'All' && task.assigned_to !== assigneeFilter) return false
      if (dueDateFilter !== 'all') {
        if (!task.due_date) return false
        const due = new Date(task.due_date)
        if (dueDateFilter === 'today') {
          return due >= todayStart && due < new Date(todayStart.getTime() + 86400000)
        }
        if (dueDateFilter === 'week') {
          return due >= todayStart && due < weekEnd
        }
        if (dueDateFilter === 'overdue') {
          return due < todayStart && task.status !== 'Completed'
        }
      }
      return true
    })
  }, [tasks, search, statusFilter, dueDateFilter, assigneeFilter])

  // ── Task optimistic handlers ──
  const handleTaskUpdated = (updated: Task) => {
    setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)))
  }
  const handleTaskDeleted = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // ── Open customer/deal drawers from pill clicks ──
  const handleOpenCustomer = async (customerId: string) => {
    const { data } = await supabase.from('customers').select('*').eq('id', customerId).single()
    if (data) { setSelectedCustomer(data as Customer); setCustomerDrawerOpen(true) }
  }
  const handleOpenDeal = async (dealId: string) => {
    const { data } = await supabase
      .from('deals')
      .select('*, customers(name), users(name)')
      .eq('id', dealId)
      .single()
    if (data) {
      const raw = data as Record<string, any>
      const deal: Deal = {
        id: raw.id,
        title: raw.title,
        value: raw.value,
        stage: raw.stage,
        expected_close_date: raw.expected_close_date,
        customer_id: raw.customer_id,
        assigned_to: raw.assigned_to,
        customer_name: raw.customers?.name,
        assigned_name: raw.users?.name,
      }
      setSelectedDeal(deal)
      setDealDrawerOpen(true)
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setDueDateFilter('all')
    setAssigneeFilter('All')
  }

  const TAB_CONFIG = [
    { id: 'tasks' as ActiveTab, label: 'My Tasks', icon: CheckSquare },
    ...(isAdminOrManager ? [{ id: 'team' as ActiveTab, label: 'Team Overview', icon: Users }] : []),
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full space-y-6">
        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0"
        >
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-amber-400" />
              Tasks
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage and track your team&apos;s work.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setEditingTask(null); setIsFormOpen(true) }}
            className="flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit shrink-0"
        >
          {TAB_CONFIG.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </motion.div>

        {/* ── Tasks Tab ── */}
        {activeTab === 'tasks' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 flex-1 min-h-0 overflow-y-auto pb-4 pr-1"
          >
            <TaskFilters
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              dueDateFilter={dueDateFilter}
              onDueDateChange={setDueDateFilter}
              assigneeFilter={assigneeFilter}
              onAssigneeChange={setAssigneeFilter}
              users={orgUsers}
              showAssignee={isAdminOrManager}
              onClearAll={handleClearFilters}
            />

            <TaskList
              tasks={filteredTasks}
              loading={loading || userLoading}
              error={fetchError}
              onRetry={fetchTasks}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              onEdit={task => { setEditingTask(task); setIsFormOpen(true) }}
              onOpenCustomer={handleOpenCustomer}
              onOpenDeal={handleOpenDeal}
            />
          </motion.div>
        )}

        {/* ── Team Overview Tab ── */}
        {activeTab === 'team' && isAdminOrManager && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-h-0 overflow-y-auto pb-4"
          >
            <TeamOverview />
          </motion.div>
        )}
      </div>

      {/* ── Task Form Modal ── */}
      <TaskFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingTask(null) }}
        onSuccess={fetchTasks}
      />

      {/* ── Customer Drawer (from task pill) ── */}
      <CustomerDrawer
        isOpen={customerDrawerOpen}
        onClose={() => setCustomerDrawerOpen(false)}
        customer={selectedCustomer}
        onCustomerUpdate={() => {}}
      />

      {/* ── Deal Drawer (from task pill) ── */}
      <DealDrawer
        isOpen={dealDrawerOpen}
        onClose={() => setDealDrawerOpen(false)}
        deal={selectedDeal}
        onDealUpdate={() => {}}
        onOpenCustomer={async (cid) => {
          setDealDrawerOpen(false)
          await handleOpenCustomer(cid)
        }}
      />
    </DashboardLayout>
  )
}
