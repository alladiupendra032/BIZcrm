'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]     = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [done, setDone]                     = useState(false)

  // ── Password strength ──────────────────────────────────────────────────────
  const rules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter',  valid: /[A-Z]/.test(password) },
    { label: 'One number',            valid: /\d/.test(password) },
  ]
  const strength = rules.filter((r) => r.valid).length
  const strengthColor =
    strength === 0 ? 'bg-slate-700' :
    strength === 1 ? 'bg-rose-500'  :
    strength === 2 ? 'bg-amber-500' :
    'bg-emerald-500'

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (strength < 2) {
      setError('Password is too weak. Please follow the requirements.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to reset password. Please try again.')
        return
      }

      setDone(true)
      // Redirect to login after 2.5 seconds
      setTimeout(() => router.push('/auth/login'), 2500)
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row overflow-hidden">

      {/* ── Left Side: Branding ───────────────────────────────────────────── */}
      <div className="flex lg:w-1/2 relative overflow-hidden items-center justify-center py-12 lg:py-0">
        {/* Background blobs */}
        <div className="absolute inset-0">
          <motion.div
            className="blob-animate-1 absolute top-1/4 left-1/4 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)', filter: 'blur(40px)' }}
          />
          <motion.div
            className="blob-animate-2 absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(50px)' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)', filter: 'blur(30px)' }}
          />
        </div>

        <div className="relative z-10 max-w-sm mx-auto px-8 text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 0 40px rgba(99,102,241,0.6)' }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-3">
            BizCRM
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-slate-400 text-sm leading-relaxed">
            Reset your account password securely and get back to work.
          </motion.p>

          {/* Tips */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-10 space-y-4 text-left">
            {[
              { step: '01', text: 'Enter your account email' },
              { step: '02', text: 'Choose a strong new password' },
              { step: '03', text: 'Click Reset — done!' },
            ].map((item) => (
              <div key={item.step} className="glass-panel px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-bold gradient-text">{item.step}</span>
                <span className="text-sm text-slate-400">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right Side: Form ──────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="w-full max-w-md"
        >
          <div className="glass-panel border border-white/12 p-8 shadow-2xl shadow-black/40">
            <AnimatePresence mode="wait">

              {/* ── SUCCESS ── */}
              {done ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
                    style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.2))', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">Password Updated!</h2>
                  <p className="text-slate-400 text-sm mb-1">Your password has been changed successfully.</p>
                  <p className="text-slate-500 text-xs">Redirecting you to sign in…</p>
                </motion.div>

              ) : (
                /* ── FORM ── */
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                    <p className="text-slate-400 text-sm">
                      Enter your email and choose a new password below.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <Input
                      id="reset-email"
                      type="email"
                      label="Email Address"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      leftIcon={<Mail className="w-4 h-4" />}
                      required
                      autoComplete="email"
                    />

                    {/* New Password */}
                    <div className="space-y-2">
                      <Input
                        id="reset-new-password"
                        type={showPassword ? 'text' : 'password'}
                        label="New Password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock className="w-4 h-4" />}
                        rightIcon={
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="hover:text-white transition-colors"
                            aria-label={showPassword ? 'Hide' : 'Show'}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                        required
                        autoComplete="new-password"
                      />

                      {/* Strength meter */}
                      {password && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 pt-1">
                          <div className="flex gap-1">
                            {[1, 2, 3].map((i) => (
                              <div key={i}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-slate-700'}`}
                              />
                            ))}
                          </div>
                          <div className="space-y-1">
                            {rules.map((rule) => (
                              <p key={rule.label}
                                className={`text-xs flex items-center gap-1.5 transition-colors ${rule.valid ? 'text-emerald-400' : 'text-slate-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${rule.valid ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                {rule.label}
                              </p>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <Input
                      id="reset-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      label="Confirm New Password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="hover:text-white transition-colors"
                          aria-label={showConfirm ? 'Hide' : 'Show'}>
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      required
                      autoComplete="new-password"
                    />

                    {/* Match indicator */}
                    {confirmPassword && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`text-xs flex items-center gap-1.5 ${password === confirmPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </motion.p>
                    )}

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                          className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                      <ShieldCheck className="w-4 h-4" />
                      Reset Password
                    </Button>
                  </form>

                  <Link href="/auth/login"
                    className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                    ← Back to Sign In
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
