'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

// ── Inner component that uses useSearchParams (must be inside Suspense) ──
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [tokenError, setTokenError] = useState(false)

  // Password strength helpers
  const rules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One number', valid: /\d/.test(password) },
  ]
  const strength = rules.filter((r) => r.valid).length
  const strengthColor =
    strength === 0 ? 'bg-slate-700' :
    strength === 1 ? 'bg-rose-500' :
    strength === 2 ? 'bg-amber-500' :
    'bg-emerald-500'

  // Supabase sends the recovery token as a hash fragment (#access_token=...&type=recovery)
  // auth-helpers-nextjs automatically detects it and creates a session.
  useEffect(() => {
    // Listen for the SIGNED_IN event that fires after the recovery token is exchanged
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true)
      }
    })

    // Also check if there is already an active session (user refreshed the page)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
    })

    // Detect broken / missing token (no hash and no active session after 3s)
    const timeout = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) setTokenError(true)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [searchParams])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      setDone(true)
      // Redirect to login after 3 seconds
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // ── Token/link error state ──
  if (tokenError) {
    return (
      <div className="text-center py-4">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.2))',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <AlertCircle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Link expired or invalid</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          This reset link has expired or already been used. Request a new one.
        </p>
        <Link href="/auth/forgot-password">
          <Button variant="primary" size="md" className="w-full">
            Request a new link
          </Button>
        </Link>
        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    )
  }

  // ── Success state ──
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))',
            border: '1px solid rgba(34,197,94,0.3)',
          }}
        >
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Password updated!</h2>
        <p className="text-slate-400 text-sm mb-2">
          Your password has been changed successfully.
        </p>
        <p className="text-slate-500 text-xs">Redirecting you to sign in…</p>
      </motion.div>
    )
  }

  // ── Main form ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Set new password</h2>
        <p className="text-slate-400 text-sm">
          {sessionReady
            ? 'Choose a strong password for your account.'
            : 'Verifying your reset link…'}
        </p>
      </div>

      {!sessionReady && (
        <div className="flex items-center justify-center gap-3 py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
          />
          <span className="text-slate-400 text-sm">Verifying link…</span>
        </div>
      )}

      <AnimatePresence>
        {sessionReady && (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleReset}
            className="space-y-5"
          >
            {/* New password */}
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              label="New Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
              autoComplete="new-password"
            />

            {/* Strength meter */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength ? strengthColor : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  {rules.map((rule) => (
                    <p
                      key={rule.label}
                      className={`text-xs flex items-center gap-1.5 transition-colors ${
                        rule.valid ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${rule.valid ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      {rule.label}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Confirm password */}
            <Input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              label="Confirm New Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="hover:text-white transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
              autoComplete="new-password"
            />

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              <ShieldCheck className="w-4 h-4" />
              Update Password
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Page export wraps the form in Suspense (required for useSearchParams) ──
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row overflow-hidden">
      {/* ── Left Side: Branding Visual ── */}
      <div className="flex lg:w-1/2 relative overflow-hidden items-center justify-center py-12 lg:py-0">
        <div className="absolute inset-0">
          <motion.div
            className="blob-animate-1 absolute top-1/4 left-1/4 w-72 h-72 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <motion.div
            className="blob-animate-2 absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-sm mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
              boxShadow: '0 0 40px rgba(99,102,241,0.6)',
            }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-3"
          >
            BizCRM
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-sm leading-relaxed"
          >
            Create a strong, unique password to keep your workspace secure.
          </motion.p>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 space-y-4 text-left"
          >
            {[
              { tip: 'Use 8+ characters' },
              { tip: 'Mix letters, numbers & symbols' },
              { tip: 'Avoid easily guessable words' },
            ].map((item, i) => (
              <div key={i} className="glass-panel px-4 py-3 flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-sm text-slate-400">{item.tip}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right Side: Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="w-full max-w-md"
        >
          <div className="glass-panel border border-white/12 p-8 shadow-2xl shadow-black/40">
            <Suspense fallback={
              <div className="flex items-center justify-center gap-3 py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                />
                <span className="text-slate-400 text-sm">Loading…</span>
              </div>
            }>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
