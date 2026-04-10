'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Save, ChevronDown, AlertTriangle, Trash2, ArrowRightLeft, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'

export default function OrganizationSettingsPage() {
  const { user, role } = useUser()
  const { showToast } = useToast()

  const [orgName, setOrgName] = useState('')
  const [saving, setSaving] = useState(false)
  const [dangerOpen, setDangerOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user?.organization_id) {
      supabase
        .from('organizations')
        .select('name')
        .eq('id', user.organization_id)
        .single()
        .then(({ data }) => { if (data) setOrgName(data.name) })
    }
  }, [user?.organization_id])

  if (role !== 'Admin') {
    return (
      <div className="glass-panel p-12 text-center border border-rose-500/20">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-white font-semibold text-lg">Admin Access Required</h3>
        <p className="text-slate-400 text-sm mt-1">Only Admins can manage organization settings.</p>
      </div>
    )
  }

  const handleSave = async () => {
    if (!orgName.trim()) { showToast('error', 'Organization name is required'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: orgName.trim() })
        .eq('id', user!.organization_id)
      if (error) throw error
      showToast('success', 'Organization name updated!')
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== orgName) {
      showToast('error', 'Organization name does not match')
      return
    }
    setDeleting(true)
    showToast('error', 'Organization deletion requires contacting support for data safety.')
    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 border border-white/10 space-y-5"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-white/8">
          <div className="p-2 rounded-xl bg-emerald-500/15">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Organization Details</h2>
            <p className="text-xs text-slate-500">Manage your company profile and branding</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Name</label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Your company name"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Logo</label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-2">
                <Building2 className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">Upload company logo</p>
              <p className="text-xs text-slate-600 mt-1">PNG, JPG up to 2MB · <span className="text-indigo-400">Coming Soon</span></p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </motion.section>

      {/* Billing */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Billing & Subscription</h2>
              <p className="text-xs text-slate-500">Manage your plan and payment details</p>
            </div>
          </div>
          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium">
            Coming Soon
          </span>
        </div>
        <div className="mt-4 p-4 rounded-xl bg-white/3 border border-white/8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Free Plan</p>
            <p className="text-xs text-slate-500">Unlimited users · 1,000 customers · 500 deals</p>
          </div>
          <button className="ml-auto text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg opacity-50 cursor-not-allowed transition-all">
            Upgrade
          </button>
        </div>
      </motion.section>

      {/* Danger Zone */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-rose-500/30 overflow-hidden"
        style={{ background: 'rgba(239,68,68,0.03)' }}
      >
        <button
          onClick={() => setDangerOpen(!dangerOpen)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-rose-500/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <div>
              <p className="text-sm font-semibold text-rose-400">Danger Zone</p>
              <p className="text-xs text-slate-500">Irreversible actions — proceed with caution</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${dangerOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {dangerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-rose-500/20"
            >
              <div className="px-6 py-5 space-y-5">
                {/* Transfer Ownership */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/3 border border-white/8">
                  <div className="flex items-start gap-3">
                    <ArrowRightLeft className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Transfer Ownership</p>
                      <p className="text-xs text-slate-500 mt-0.5">Assign a different Admin as the organization owner.</p>
                    </div>
                  </div>
                  <button className="text-xs text-slate-500 border border-white/10 px-3 py-1.5 rounded-lg opacity-50 cursor-not-allowed whitespace-nowrap">
                    Coming Soon
                  </button>
                </div>

                {/* Delete Organization */}
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-rose-400">Delete Organization</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Permanently deletes all data including customers, deals, tasks, and user accounts.
                        This action <strong className="text-white">cannot be undone</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">
                      Type <span className="font-mono text-rose-300">{orgName}</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder={orgName}
                      className="w-full bg-black/20 border border-rose-500/30 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-rose-500 transition-all"
                    />
                  </div>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={deleting || deleteConfirm !== orgName}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Processing…' : 'Delete Organization'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  )
}
