'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/lib/UserContext'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { ExportButton } from '@/components/ui/ExportButton'

import { CustomerTable, Customer, SortField, SortDir } from '@/components/customers/CustomerTable'
import { CustomerFilters } from '@/components/customers/CustomerFilters'
import { CustomerFormModal } from '@/components/customers/CustomerFormModal'
import { CustomerDrawer } from '@/components/customers/CustomerDrawer'

const STATUS_OPTIONS = ['All', 'Lead', 'Active', 'Closed']

export default function CustomersPage() {
  const { user, role, loading: userLoading } = useUser()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── State ──
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  // Filters State (all URL-persisted)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All')
  const [showArchived, setShowArchived] = useState(searchParams.get('archived') === 'true')
  const [sortField, setSortField] = useState<SortField>((searchParams.get('sort') as SortField) || 'created_at')
  const [sortDir, setSortDir] = useState<SortDir>((searchParams.get('dir') as SortDir) || 'desc')
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '')
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '')

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(searchParams.get('new') === 'true')
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined)

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)

  const canEdit = role === 'Admin' || role === 'Manager'

  // ── Sync URL Filters ──
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (statusFilter !== 'All') params.set('status', statusFilter)
    if (showArchived) params.set('archived', 'true')
    if (sortField !== 'created_at') params.set('sort', sortField)
    if (sortDir !== 'desc') params.set('dir', sortDir)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)

    const newUrl = params.toString() ? `?${params.toString()}` : '/customers'
    router.replace(newUrl, { scroll: false })
  }, [searchTerm, statusFilter, showArchived, sortField, sortDir, dateFrom, dateTo, router])

  // ── Data Fetching ──
  const fetchCustomers = useCallback(async () => {
    if (!user?.organization_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('archived', showArchived)
      if (error) throw error
      setCustomers(data || [])
    } catch (err) {
      console.error('Fetch error', err)
      showToast('error', 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [user?.organization_id, showArchived, showToast])

  useEffect(() => {
    if (!userLoading && user?.organization_id) fetchCustomers()
  }, [userLoading, user?.organization_id, fetchCustomers])

  useEffect(() => {
    if (selectedCustomer) {
      const refreshed = customers.find(c => c.id === selectedCustomer.id)
      if (refreshed) setSelectedCustomer(refreshed)
    }
  }, [customers])

  // ── Handlers ──
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleClearAll = () => {
    setSearchTerm('')
    setStatusFilter('All')
    setShowArchived(false)
    setDateFrom('')
    setDateTo('')
    setSortField('created_at')
    setSortDir('desc')
  }

  const handleArchive = async (c: Customer) => {
    try {
      const { error } = await (supabase.from('customers') as any).update({ archived: true }).eq('id', c.id)
      if (error) throw error
      showToast('success', `${c.name} archived successfully`)
      fetchCustomers()
    } catch (err) {
      showToast('error', 'Failed to archive customer')
    }
  }

  const confirmDelete = async () => {
    if (!deletingCustomer) return
    try {
      const { error } = await supabase.from('customers').delete().eq('id', deletingCustomer.id)
      if (error) throw error
      showToast('success', `${deletingCustomer.name} permanently deleted`)
      if (selectedCustomer?.id === deletingCustomer.id) setIsDrawerOpen(false)
      fetchCustomers()
    } catch (err) {
      showToast('error', 'Failed to delete customer')
    } finally {
      setDeletingCustomer(null)
    }
  }

  // ── Client-side Filter & Sort ──
  const filteredCustomers = useMemo(() => {
    let result = [...customers]

    if (statusFilter !== 'All') {
      result = result.filter(c => c.status === statusFilter)
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(lower) ||
        c.company?.toLowerCase().includes(lower)
      )
    }

    // Date range filter (client-side)
    if (dateFrom) {
      const from = new Date(dateFrom)
      result = result.filter(c => new Date(c.created_at) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter(c => new Date(c.created_at) <= to)
    }

    result.sort((a, b) => {
      let aVal = (a as any)[sortField] || ''
      let bVal = (b as any)[sortField] || ''
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [customers, searchTerm, statusFilter, sortField, sortDir, dateFrom, dateTo])

  // Build export params from current filters
  const exportParams: Record<string, string> = {}
  if (searchTerm) exportParams.q = searchTerm
  if (statusFilter !== 'All') exportParams.status = statusFilter
  if (dateFrom) exportParams.dateFrom = dateFrom
  if (dateTo) exportParams.dateTo = dateTo

  // ── Render ──
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              Customers
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your pipeline relationships.
              <span className="ml-2 text-slate-500">
                {!loading && `${filteredCustomers.length} shown`}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Export — Admin/Manager only */}
            {canEdit && (
              <ExportButton
                endpoint="/api/export/customers"
                filenamePrefix="customers"
                extraParams={exportParams}
              />
            )}
            {canEdit && (
              <Button
                variant="primary"
                onClick={() => { setEditingCustomer(undefined); setIsFormOpen(true) }}
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </Button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <CustomerFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            showArchived={showArchived}
            onArchivedChange={setShowArchived}
            statusOptions={STATUS_OPTIONS}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onClearAll={handleClearAll}
          />
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <CustomerTable
            customers={filteredCustomers}
            loading={loading || userLoading}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            onRowClick={(c) => { setSelectedCustomer(c); setIsDrawerOpen(true) }}
            onEdit={(c) => { setEditingCustomer(c); setIsFormOpen(true) }}
            onDelete={(c) => setDeletingCustomer(c)}
            onArchive={handleArchive}
            onAddFirst={() => { setEditingCustomer(undefined); setIsFormOpen(true) }}
          />
        </motion.div>
      </div>

      {/* Modals & Drawers */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customer={editingCustomer}
        onSuccess={fetchCustomers}
      />

      <CustomerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        customer={selectedCustomer}
        onCustomerUpdate={fetchCustomers}
      />

      <Modal isOpen={!!deletingCustomer} onClose={() => setDeletingCustomer(null)} title="Delete Customer">
        <div className="space-y-4">
          <p className="text-slate-300">
            Are you sure you want to permanently delete <strong>{deletingCustomer?.name}</strong>?
            This will also delete all linked deals and tasks due to database cascade.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setDeletingCustomer(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  )
}
