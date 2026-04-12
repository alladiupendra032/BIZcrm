'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, Shield, Zap } from 'lucide-react'
// Using absolute relative paths to bypass potential alias issues during production build
import { DashboardLayout } from '../../../components/layout/DashboardLayout'
import { UserTable } from '../../../components/admin/UserTable'
import { InviteUserModal } from '../../../components/admin/InviteUserModal'
import { Button } from '../../../components/ui/Button'

/**
 * AdminUsersPage provides the interface for managing organization members.
 * Using a simplified const export pattern to ensure maximum compatibility with the SWC parser.
 */
const AdminUsersPage = () => {
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleUserRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 shadow-lg">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">User Management</h1>
            </div>
            <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
              Maintain your organization's hierarchy and security by managing team access, roles, and system permissions.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 px-6 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Invite Member
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users className="text-blue-400" />} label="Total Members" value="..." sub="Active globally" />
          <StatCard icon={<Shield className="text-purple-400" />} label="Total Admins" value="..." sub="Full permissions" />
          <StatCard icon={<UserPlus className="text-emerald-400" />} label="Recent Joins" value="..." sub="Last 30 days" />
          <StatCard icon={<Zap className="text-amber-400" />} label="Access Points" value="3 Roles" sub="Standardized" />
        </div>

        {/* User Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Organization Directory
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-500 border border-white/10">v2.0</span>
            </h2>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <UserTable
              key={refreshKey}
              onUsersChange={handleUserRefresh}
            />
          </motion.div>
        </div>

        {/* Roles Reference Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-3xl bg-slate-900/50 border border-white/5 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Role Reference Guide</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RoleInfo 
              title="Admin" 
              color="text-purple-400" 
              desc="Highest access level. Can manage billing, workspace settings, and invite/remove any user." 
            />
            <RoleInfo 
              title="Manager" 
              color="text-amber-400" 
              desc="Management level. Can oversee all customers, deals, and assign tasks to teammates." 
            />
            <RoleInfo 
              title="Team Member" 
              color="text-blue-400" 
              desc="Standard access. Can view shared customers and manage their own assigned tasks/deals." 
            />
          </div>
        </motion.div>
      </div>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={() => {
          handleUserRefresh()
          setIsInviteOpen(false)
        }}
      />
    </DashboardLayout>
  );
};

export default AdminUsersPage;

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="glass-panel p-5 border border-white/5 rounded-3xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 40 }) : null}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10">{icon}</div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl font-black text-white">{value}</h4>
        <span className="text-[10px] text-slate-500 font-medium">{sub}</span>
      </div>
    </div>
  )
}

function RoleInfo({ title, color, desc }: { title: string, color: string, desc: string }) {
  return (
    <div className="space-y-2">
      <h4 className={`text-sm font-bold ${color}`}>{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  )
}
