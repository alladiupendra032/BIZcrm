'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, Save, Camera, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special char', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.pass).length
  const colors = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500']
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-white/10'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {checks.map(c => (
            <span key={c.label} className={`text-xs ${c.pass ? 'text-emerald-400' : 'text-slate-600'}`}>
              {c.pass ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-xs font-medium ${colors[score].replace('bg-', 'text-')}`}>
            {labels[score]}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ProfileSettingsPage() {
  const { user, refresh } = useUser()
  const { showToast } = useToast()

  // Sync form state when user loads
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user?.id])

  // Profile form state
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [savingPw, setSavingPw]     = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSaveProfile = async () => {
    if (!user) return
    if (!name.trim()) { showToast('error', 'Name cannot be empty'); return }
    setSavingProfile(true)
    try {
      const { error: dbError } = await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('id', user.id)
      if (dbError) throw dbError

      if (email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({ email })
        if (authError) throw authError
        showToast('success', 'Profile updated! Check your email to confirm the new address.')
      } else {
        showToast('success', 'Profile updated successfully!')
      }
      refresh()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPw) { showToast('error', 'New password is required'); return }
    if (newPw.length < 8) { showToast('error', 'Password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { showToast('error', 'Passwords do not match'); return }
    setSavingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      showToast('success', 'Password updated successfully!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update password')
    } finally {
      setSavingPw(false)
    }
  }

  const initials = name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="space-y-6">
      {/* ── Personal Information ───────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 border border-white/10 space-y-5"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-white/8">
          <div className="p-2 rounded-xl bg-blue-500/15">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Personal Information</h2>
            <p className="text-xs text-slate-500">Update your name and email address</p>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              {initials}
            </div>
            <button
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Upload avatar (coming soon)"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center gap-1 text-xs text-slate-600 mt-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
              <ShieldCheck className="w-3 h-3" />
              {user?.role || 'Member'}
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Full Name"
            icon={<User className="w-4 h-4" />}
            value={name}
            onChange={setName}
            placeholder="Your full name"
          />
          <FormField
            label="Email Address"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="your@email.com"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={handleSaveProfile} disabled={savingProfile}>
            <Save className="w-4 h-4" />
            {savingProfile ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </motion.section>

      {/* ── Password ───────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 border border-white/10 space-y-5"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-white/8">
          <div className="p-2 rounded-xl bg-indigo-500/15">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Change Password</h2>
            <p className="text-xs text-slate-500">Ensure your account uses a strong password</p>
          </div>
        </div>

        <div className="space-y-4">
          <PasswordField
            label="Current Password"
            value={currentPw}
            onChange={setCurrentPw}
            show={showCurrent}
            onToggleShow={() => setShowCurrent(!showCurrent)}
          />
          <div>
            <PasswordField
              label="New Password"
              value={newPw}
              onChange={setNewPw}
              show={showNew}
              onToggleShow={() => setShowNew(!showNew)}
            />
            <PasswordStrength password={newPw} />
          </div>
          <PasswordField
            label="Confirm New Password"
            value={confirmPw}
            onChange={setConfirmPw}
            show={showConfirm}
            onToggleShow={() => setShowConfirm(!showConfirm)}
          />
        </div>

        {confirmPw && newPw !== confirmPw && (
          <p className="text-xs text-rose-400">Passwords do not match</p>
        )}

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            onClick={handleUpdatePassword}
            disabled={savingPw || !newPw || newPw !== confirmPw}
          >
            <Lock className="w-4 h-4" />
            {savingPw ? 'Updating…' : 'Update Password'}
          </Button>
        </div>
      </motion.section>
    </div>
  )
}

function FormField({
  label, icon, value, onChange, type = 'text', placeholder,
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-white/8 transition-all"
        />
      </div>
    </div>
  )
}

function PasswordField({
  label, value, onChange, show, onToggleShow,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
          <Lock className="w-4 h-4" />
        </div>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-white/8 transition-all"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
