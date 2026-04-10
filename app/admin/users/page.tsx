'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, Shield } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { UserTable } from '@/components/admin/UserTable'
import { InviteUserModal } from '@/components/admin/InviteUserModal'
import { Button } from '@/components/ui/Button'

export default function AdminUsersPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Manage team members, roles, and access within your organization.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        </motion.div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/8 border border-blue-500/20"
        >
          <Users className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-400">
            <span className="text-white font-medium">Role levels: </span>
            <span className="text-blue-300 font-medium">Admin</span> — full access including user management ·{' '}
            <span className="text-amber-300 font-medium">Manager</span> — manage deals, tasks, all customers ·{' '}
            <span className="text-slate-300 font-medium">Team Member</span> — view customers, own tasks only.
            <br />
            <span className="text-rose-400 text-xs mt-1 block">
              ⚠ You cannot remove yourself or the last Admin from the organization.
            </span>
          </div>
        </motion.div>

        {/* User table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <UserTable
            key={refreshKey}
            onUsersChange={() => setRefreshKey(k => k + 1)}
          />
        </motion.div>
      </div>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={() => {
          setRefreshKey(k => k + 1)
          setIsInviteOpen(false)
        }}
      />
    </DashboardLayout>
  )
}
