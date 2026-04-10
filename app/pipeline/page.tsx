'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { KanbanSquare, LayoutList, LayoutGrid } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useUser } from '@/lib/UserContext'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/Toast'
import { ExportButton } from '@/components/ui/ExportButton'

import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { PipelineFilters } from '@/components/pipeline/PipelineFilters'
import { PipelineListView } from '@/components/pipeline/PipelineListView'
import { DealFormModal } from '@/components/pipeline/DealFormModal'
import { DealDrawer } from '@/components/pipeline/DealDrawer'
import { Deal } from '@/components/pipeline/DealCard'

import { CustomerDrawer } from '@/components/customers/CustomerDrawer'
import { Customer } from '@/components/customers/CustomerTable'

type ViewMode = 'kanban' | 'list'

function PipelinePageContent() {
  const { user, role, loading: userLoading } = useUser()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Redirect Team Members ──
  useEffect(() => {
    if (!userLoading && role === 'Team Member') {
      router.push('/tasks')
    }
  }, [role, userLoading, router])

  // ── State ──
  const [deals, setDeals] = useState<Deal[]>([])
  const [users, setUsers] = useState<{ id: string, name: string }[]>([])
  const [loading, setLoading] = useState(true)

  // View toggle
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'kanban'
  )

  // Filters State (all URL-persisted)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [minValue, setMinValue] = useState(searchParams.get('min') || '')
  const [maxValue, setMaxValue] = useState(searchParams.get('max') || '')
  const [ownerId, setOwnerId] = useState(searchParams.get('owner') || 'All')
  const [closeDateFrom, setCloseDateFrom] = useState(searchParams.get('cdfrom') || '')
  const [closeDateTo, setCloseDateTo] = useState(searchParams.get('cdto') || '')

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(searchParams.get('new') === 'true')
  const [initialStage, setInitialStage] = useState('New')

  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [isDealDrawerOpen, setIsDealDrawerOpen] = useState(false)

  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null)
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false)

  const canEdit = role === 'Admin' || role === 'Manager'

  // ── Sync URL Filters ──
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (minValue) params.set('min', minValue)
    if (maxValue) params.set('max', maxValue)
    if (ownerId !== 'All') params.set('owner', ownerId)
    if (closeDateFrom) params.set('cdfrom', closeDateFrom)
    if (closeDateTo) params.set('cdto', closeDateTo)
    if (viewMode !== 'kanban') params.set('view', viewMode)

    const newUrl = params.toString() ? `/pipeline?${params.toString()}` : '/pipeline'
    router.replace(newUrl, { scroll: false })
  }, [searchTerm, minValue, maxValue, ownerId, closeDateFrom, closeDateTo, viewMode, router])

  // ── Data Fetching ──
  const fetchPipelineData = useCallback(async () => {
    if (!user?.organization_id) return
    setLoading(true)
    try {
      const { data: dealsData, error } = await supabase
        .from('deals')
        .select(`
          *,
          customers(name),
          users(name)
        `)
        .eq('organization_id', user.organization_id)

      if (error) throw error

      const formattedDeals: Deal[] = (dealsData || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        value: row.value,
        stage: row.stage,
        expected_close_date: row.expected_close_date,
        customer_id: row.customer_id,
        assigned_to: row.assigned_to,
        customer_name: row.customers?.name,
        assigned_name: row.users?.name,
      }))
      setDeals(formattedDeals)

      if (role === 'Admin' || role === 'Manager') {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name')
          .eq('organization_id', user.organization_id)
        if (userData) setUsers(userData)
      }
    } catch (err) {
      console.error('Fetch error', err)
      showToast('error', 'Failed to load pipeline data')
    } finally {
      setLoading(false)
    }
  }, [user?.organization_id, role, showToast])

  useEffect(() => {
    if (!userLoading && user?.organization_id && role !== 'Team Member') {
      fetchPipelineData()
    }
  }, [userLoading, user?.organization_id, role, fetchPipelineData])

  useEffect(() => {
    if (selectedDeal) {
      const refreshed = deals.find(d => d.id === selectedDeal.id)
      if (refreshed) setSelectedDeal(refreshed)
    }
  }, [deals])

  // ── Handlers ──
  const handleOpenCustomer = async (customerId: string) => {
    setIsDealDrawerOpen(false)
    try {
      const { data, error } = await supabase
        .from('customers').select('*').eq('id', customerId).single()
      if (error) throw error
      setLinkedCustomer(data as Customer)
      setIsCustomerDrawerOpen(true)
    } catch {
      showToast('error', 'Could not load customer profile')
    }
  }

  const handleClearAll = () => {
    setSearchTerm('')
    setMinValue('')
    setMaxValue('')
    setOwnerId('All')
    setCloseDateFrom('')
    setCloseDateTo('')
  }

  // ── Client-side Filters ──
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      // Text search
      if (searchTerm) {
        const lower = searchTerm.toLowerCase()
        if (
          !deal.title.toLowerCase().includes(lower) &&
          !deal.customer_name?.toLowerCase().includes(lower)
        ) return false
      }
      // Value range
      if (minValue) {
        const min = parseFloat(minValue)
        if (!isNaN(min) && (deal.value === null || deal.value < min)) return false
      }
      if (maxValue) {
        const max = parseFloat(maxValue)
        if (!isNaN(max) && (deal.value !== null && deal.value > max)) return false
      }
      // Owner
      if (ownerId !== 'All' && deal.assigned_to !== ownerId) return false
      // Close date range
      if (closeDateFrom && deal.expected_close_date) {
        if (deal.expected_close_date < closeDateFrom) return false
      }
      if (closeDateTo && deal.expected_close_date) {
        if (deal.expected_close_date > closeDateTo) return false
      }
      return true
    })
  }, [deals, searchTerm, minValue, maxValue, ownerId, closeDateFrom, closeDateTo])

  // Build export params
  const exportParams: Record<string, string> = {}
  if (searchTerm) exportParams.q = searchTerm
  if (minValue) exportParams.min = minValue
  if (maxValue) exportParams.max = maxValue
  if (ownerId !== 'All') exportParams.owner = ownerId
  if (closeDateFrom) exportParams.closeDateFrom = closeDateFrom
  if (closeDateTo) exportParams.closeDateTo = closeDateTo

  if (role === 'Team Member') return null

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0"
        >
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <KanbanSquare className="w-6 h-6 text-indigo-400" />
              Pipeline
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage and track your active deals.
              <span className="ml-2 text-slate-500">
                {!loading && `${filteredDeals.length} deal${filteredDeals.length !== 1 ? 's' : ''}`}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <ViewToggleBtn
                active={viewMode === 'kanban'}
                icon={<LayoutGrid className="w-4 h-4" />}
                label="Board"
                onClick={() => setViewMode('kanban')}
              />
              <ViewToggleBtn
                active={viewMode === 'list'}
                icon={<LayoutList className="w-4 h-4" />}
                label="List"
                onClick={() => setViewMode('list')}
              />
            </div>

            {/* Export — visible only in list view for deals */}
            {canEdit && (
              <ExportButton
                endpoint="/api/export/deals"
                filenamePrefix="deals"
                extraParams={exportParams}
                label="Export"
              />
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="shrink-0"
        >
          <PipelineFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            minValue={minValue}
            onMinChange={setMinValue}
            maxValue={maxValue}
            onMaxChange={setMaxValue}
            ownerId={ownerId}
            onOwnerChange={setOwnerId}
            users={users}
            closeDateFrom={closeDateFrom}
            onCloseDateFromChange={setCloseDateFrom}
            closeDateTo={closeDateTo}
            onCloseDateToChange={setCloseDateTo}
            onClearAll={handleClearAll}
          />
        </motion.div>

        {/* Board or List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 min-h-0"
        >
          {viewMode === 'kanban' ? (
            <KanbanBoard
              deals={filteredDeals}
              loading={loading || userLoading}
              onAddDeal={(stage) => { setInitialStage(stage); setIsFormOpen(true) }}
              onDealClick={(d) => { setSelectedDeal(d); setIsDealDrawerOpen(true) }}
              onOptimisticUpdate={setDeals}
              onRevertUpdate={fetchPipelineData}
            />
          ) : (
            <PipelineListView
              deals={filteredDeals}
              loading={loading || userLoading}
              onDealClick={(d) => { setSelectedDeal(d); setIsDealDrawerOpen(true) }}
            />
          )}
        </motion.div>
      </div>

      {/* Modals & Drawers */}
      <DealFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialStage={initialStage}
        onSuccess={fetchPipelineData}
      />

      <DealDrawer
        isOpen={isDealDrawerOpen}
        onClose={() => setIsDealDrawerOpen(false)}
        deal={selectedDeal}
        onDealUpdate={() => fetchPipelineData()}
        onOpenCustomer={handleOpenCustomer}
      />

      <CustomerDrawer
        isOpen={isCustomerDrawerOpen}
        onClose={() => setIsCustomerDrawerOpen(false)}
        customer={linkedCustomer}
        onCustomerUpdate={() => {}}
      />
    </DashboardLayout>
  )
}

export default function PipelinePage() {
  return (
    <React.Suspense fallback={null}>
      <PipelinePageContent />
    </React.Suspense>
  )
}

function ViewToggleBtn({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {active && (
        <motion.div
          layoutId="viewToggleActive"
          className="absolute inset-0 bg-white/10 rounded-lg"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  )
}
