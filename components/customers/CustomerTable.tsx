'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Pencil, Trash2, Archive, Users
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { useUser } from '@/lib/UserContext'
import { Button } from '@/components/ui/Button'

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  status: 'Lead' | 'Active' | 'Closed'
  archived: boolean
  organization_id: string | null
  created_at: string
}

export type SortField = 'name' | 'company' | 'status' | 'created_at'
export type SortDir = 'asc' | 'desc'

interface CustomerTableProps {
  customers: Customer[]
  loading: boolean
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
  onRowClick: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onArchive: (customer: Customer) => void
  onAddFirst: () => void
}

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-600" />
  return active && dir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
    : <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
}

const COLUMNS: { key: SortField; label: string; sortable: boolean }[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'name', label: 'Email', sortable: false },   // Email not sortable, reuse key placeholder
  { key: 'name', label: 'Phone', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'created_at', label: 'Created', sortable: true },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function CustomerTable({
  customers,
  loading,
  sortField,
  sortDir,
  onSort,
  onRowClick,
  onEdit,
  onDelete,
  onArchive,
  onAddFirst,
}: CustomerTableProps) {
  const { role } = useUser()
  const isAdmin = role === 'Admin'
  const isManager = role === 'Manager'
  const canEdit = isAdmin || isManager

  if (loading) return <SkeletonLoader type="table" rows={6} />

  if (customers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel border border-white/10 p-16 flex flex-col items-center justify-center text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-5 border border-cyan-500/20">
          <Users className="w-9 h-9 text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No customers yet</h3>
        <p className="text-slate-400 text-sm mb-6 max-w-xs">
          Add your first customer to start tracking leads, deals, and relationships.
        </p>
        {canEdit && (
          <Button onClick={onAddFirst} variant="primary">
            Add your first customer
          </Button>
        )}
      </motion.div>
    )
  }

  return (
    <div className="glass-panel border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-white/8">
              {['Name', 'Company', 'Email', 'Phone', 'Status', 'Created'].map((label, i) => {
                const sortKey: SortField | null =
                  label === 'Name' ? 'name'
                  : label === 'Company' ? 'company'
                  : label === 'Status' ? 'status'
                  : label === 'Created' ? 'created_at'
                  : null
                const isSortable = sortKey !== null
                const isActive = sortKey === sortField

                return (
                  <th
                    key={label}
                    onClick={isSortable ? () => onSort(sortKey!) : undefined}
                    className={`
                      px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider
                      ${isSortable ? 'cursor-pointer hover:text-white select-none' : ''}
                      ${isActive ? 'text-blue-400' : ''}
                    `}
                  >
                    <div className="flex items-center gap-1.5">
                      {label}
                      {isSortable && <SortIcon field={sortKey!} active={isActive} dir={sortDir} />}
                    </div>
                  </th>
                )
              })}
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            <AnimatePresence initial={false}>
              {customers.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onRowClick(c)}
                  className="
                    border-b border-white/5 cursor-pointer group
                    hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-transparent
                    transition-colors duration-150
                  "
                >
                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium group-hover:text-blue-300 transition-colors">
                        {c.name}
                      </span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3.5 text-slate-300">{c.company || <span className="text-slate-600">—</span>}</td>

                  {/* Email */}
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    {c.email
                      ? <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="hover:text-blue-400 transition-colors">{c.email}</a>
                      : <span className="text-slate-600">—</span>
                    }
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    {c.phone || <span className="text-slate-600">—</span>}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5"><Badge status={c.status} /></td>

                  {/* Created */}
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{formatDate(c.created_at)}</td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div
                      className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => e.stopPropagation()}
                    >
                      {canEdit && (
                        <button
                          onClick={() => onEdit(c)}
                          title="Edit customer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {isManager && !isAdmin && (
                        <button
                          onClick={() => onArchive(c)}
                          title="Archive customer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onArchive(c)}
                            title="Archive customer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(c)}
                            title="Delete customer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  )
}
