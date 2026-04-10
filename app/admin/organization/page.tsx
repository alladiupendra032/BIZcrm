'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Upload, AlertTriangle, CreditCard, Save, MapPin } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useUser } from '@/lib/UserContext'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'

export default function OrganizationSettingsPage() {
  const { user, role } = useUser()
  const { showToast } = useToast()

  const [org, setOrg] = useState<{ id: string; name: string; } | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDanger, setShowDanger] = useState(false)

  useEffect(() => {
    if (user?.organization_id) {
      fetchOrg(user.organization_id)
    }
  }, [user])

  const fetchOrg = async (orgId: string) => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()
    if (data) {
      const orgData = data as any
      setOrg(orgData)
      setName(orgData.name || '')
      // Physical address would go here if we had it in schema, mocking for now as per requirements
      setAddress('123 Business Rd, Suite 100, Tech City')
    }
  }

  const handleSave = async () => {
    if (!org) return
    setSaving(true)
    try {
      const { error } = await (supabase.from('organizations') as any)
        .update({ name })
        .eq('id', org.id)
      
      if (error) throw error
      showToast('success', 'Organization settings saved')
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Organization Settings</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Manage your company profile, branding, and billing details.
          </p>
        </motion.div>

        {/* General Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel border border-white/10 rounded-2xl p-6 space-y-6"
        >
          <h2 className="text-lg font-semibold text-white">Company Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSave}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/60 focus:outline-none transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Physical Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/60 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-slate-500" />
              </div>
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload New Logo
              </Button>
              <p className="text-xs text-slate-500 text-balance max-w-[200px]">
                Recommended size: 256x256px.<br/>Max file size: 2MB.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Billing Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel border border-white/10 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-6 right-6">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Coming Soon
            </span>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-slate-300" />
            <h2 className="text-lg font-semibold text-white">Billing & Subscription</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 max-w-lg text-balance">
            Soon you'll be able to manage your subscription, view past invoices, and upgrade your plan directly from this dashboard.
          </p>
          
          <Button variant="secondary" size="sm" disabled>
            Manage Billing
          </Button>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel border border-rose-500/30 rounded-2xl p-6"
        >
          <div 
            className="flex items-start justify-between cursor-pointer"
            onClick={() => setShowDanger(!showDanger)}
          >
            <div className="flex items-center gap-3 mb-1">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-rose-500">Danger Zone</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-rose-400 hover:bg-rose-500/10">
              {showDanger ? 'Hide' : 'Show'}
            </Button>
          </div>
          <p className="text-sm text-rose-400/80 mb-0">
            Irreversible actions regarding your organization data.
          </p>

          {showDanger && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              className="mt-6 pt-6 border-t border-rose-500/20 space-y-4"
            >
              <h3 className="text-md font-medium text-white">Delete Organization</h3>
              <p className="text-sm text-slate-400">
                This will permanently delete your organization and all associated data, including customers, deals, and tasks. This action cannot be undone.
              </p>
              
              <div className="space-y-2 mt-4 max-w-sm">
                <label className="text-xs font-semibold text-slate-400">
                  Type <span className="text-white font-bold">{org?.name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full px-4 py-2 bg-rose-500/5 border border-rose-500/20 rounded-xl text-white focus:border-rose-500/60 focus:outline-none transition-colors"
                />
              </div>
              
              <Button 
                variant="primary" 
                className="bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)] mt-4"
                disabled={deleteConfirm !== org?.name}
              >
                Permanently Delete Organization
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
