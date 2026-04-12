'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, ArrowRight, Lock, Eye, EyeOff, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Stage =
  | 'verifying'     // Exchanging tokens from URL
  | 'set-password'  // Token OK — user must set a password
  | 'saving'        // Writing org/role to DB
  | 'success'       // Done — redirecting
  | 'error'         // Something went wrong

export default function AcceptInvitePage() {
  const router = useRouter()

  const [stage,      setStage]      = useState<Stage>('verifying')
  const [errorMsg,   setErrorMsg]   = useState('')
  const [userName,   setUserName]   = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [passError,  setPassError]  = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Helper: handle a valid session after token exchange ──────────────────
  const handleSession = useCallback((session: any) => {
    const meta = session.user?.user_metadata as Record<string, any> ?? {}
    const name  = meta?.full_name || session.user?.email?.split('@')[0] || 'there'
    setUserName(name)
    setStage('set-password')
  }, [])

  // ── Step 1: Exchange the invite token from the URL ────────────────────────
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        // --- PATH A: Check if Supabase already has a session (auto-detected hash) ---
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession && !cancelled) {
          handleSession(existingSession)
          return
        }

        // --- PATH B: URL hash contains #access_token=... (Supabase redirect) ---
        if (typeof window !== 'undefined') {
          const hash = window.location.hash
          if (hash && hash.includes('access_token')) {
            const hashParams = new URLSearchParams(hash.substring(1))
            const accessToken  = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')
            if (accessToken && refreshToken) {
              const { data, error } = await supabase.auth.setSession({
                access_token:  accessToken,
                refresh_token: refreshToken,
              })
              if (!error && data.session && !cancelled) {
                handleSession(data.session)
                return
              }
            }
          }

          // --- PATH C: URL query contains ?token_hash=...&type=... (OTP flow) ---
          const sp         = new URLSearchParams(window.location.search)
          const tokenHash  = sp.get('token_hash') || sp.get('token')
          const type       = sp.get('type')

          if (tokenHash) {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: (type as any) || 'email',
            })
            if (!error && data.session && !cancelled) {
              handleSession(data.session)
              return
            }
          }

          // --- PATH D: PKCE code exchange (?code=...) ---
          const code = sp.get('code')
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error && data.session && !cancelled) {
              handleSession(data.session)
              return
            }
          }
        }

        // --- PATH E: Fall back to onAuthStateChange (Supabase fires this asynchronously) ---
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session && !cancelled) {
            subscription.unsubscribe()
            handleSession(session)
          }
        })

        // Safety net — if nothing fires within 12 s, show error
        const timeout = setTimeout(() => {
          if (!cancelled) {
            setErrorMsg('Your invite link may have expired or already been used. Please ask an Admin to resend the invitation.')
            setStage('error')
          }
        }, 12000)

        return () => {
          cancelled = true
          subscription.unsubscribe()
          clearTimeout(timeout)
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err.message || 'An unexpected error occurred.')
          setStage('error')
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [handleSession])

  // ── Step 2: User sets their password ─────────────────────────────────────
  const handleSetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError('')

    if (password.length < 8) {
      setPassError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    setStage('saving')

    try {
      // 2a. Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      // 2b. Fetch session metadata
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session lost after password update.')

      const meta   = session.user.user_metadata as Record<string, any>
      const orgId  = meta?.organization_id as string | undefined
      const dbRole = meta?.invited_role    as string | undefined

      // 2c. Write profile to public.users
      if (orgId && dbRole) {
        await supabase.from('users').upsert({
          id:              session.user.id,
          email:           session.user.email,
          name:            meta?.full_name || session.user.email?.split('@')[0],
          role:            dbRole,
          organization_id: orgId,
        }, { onConflict: 'id' })
      }

      setStage('success')
      setTimeout(() => router.replace('/dashboard'), 2500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to set up your account. Please try again.')
      setStage('error')
    } finally {
      setSubmitting(false)
    }
  }, [password, router])

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, #060810 60%)' }}
    >
      {/* Ambient blobs */}
      <motion.div
        className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
      <motion.div
        className="fixed bottom-1/3 right-1/4 w-72 h-72 rounded-full pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', filter: 'blur(50px)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(13,17,23,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
          }}
        >
          {/* Top gradient bar */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6)' }} />

          {/* Logo */}
          <div className="px-8 pt-8 pb-6 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}
              >
                B
              </div>
              <span className="text-white font-bold text-xl tracking-tight">BizCRM</span>
            </div>
          </div>

          <div className="px-8 py-10">
            <AnimatePresence mode="wait">

              {/* ── VERIFYING ─────────────────────────────── */}
              {stage === 'verifying' && (
                <motion.div key="verifying" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                      <div className="absolute inset-2 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Verifying your invite…</h1>
                  <p className="text-slate-400 text-sm leading-relaxed">Hang tight, we are setting up your access.</p>
                  <div className="flex justify-center gap-1.5 mt-6">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── SET PASSWORD ───────────────────────────── */}
              {stage === 'set-password' && (
                <motion.div key="set-password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-1">Welcome, {userName}! 👋</h1>
                    <p className="text-slate-400 text-sm leading-relaxed">Create a secure password to activate your BizCRM account.</p>
                  </div>

                  <form onSubmit={handleSetPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={e => { setPassword(e.target.value); setPassError('') }}
                          placeholder="Min. 8 characters"
                          autoComplete="new-password"
                          className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                          required
                          minLength={8}
                          autoFocus
                        />
                        <button type="button" onClick={() => setShowPass(s => !s)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                          aria-label={showPass ? 'Hide password' : 'Show password'}
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passError && <p className="text-xs text-rose-400 mt-1.5">{passError}</p>}
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                      <p className="text-[11px] text-blue-300 leading-relaxed">Use at least 8 characters with a mix of letters and numbers.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || password.length < 8}
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Activate My Account
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── SAVING ────────────────────────────────── */}
              {stage === 'saving' && (
                <motion.div key="saving" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                  </div>
                  <h1 className="text-xl font-bold text-white mb-2">Setting up your workspace…</h1>
                  <p className="text-slate-400 text-sm">Almost there!</p>
                </motion.div>
              )}

              {/* ── SUCCESS ───────────────────────────────── */}
              {stage === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex justify-center mb-6"
                  >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white mb-2">You&apos;re in, {userName}! 🎉</h1>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">Your account is active. Redirecting to your dashboard…</p>
                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
                    <ArrowRight className="w-4 h-4 animate-pulse" /> Redirecting to Dashboard
                  </div>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg,#3b82f6,#6366f1)' }}
                      initial={{ width: '0%' }} animate={{ width: '100%' }}
                      transition={{ duration: 2.5, ease: 'linear' }}
                    />
                  </div>
                </motion.div>
              )}

              {/* ── ERROR ─────────────────────────────────── */}
              {stage === 'error' && (
                <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex justify-center mb-6"
                  >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                    </div>
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white mb-2">Invite Link Issue</h1>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {errorMsg || 'This invite link may have expired or already been used.'}
                  </p>
                  <div className="text-left p-4 rounded-xl mb-6 text-sm text-slate-400"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="font-semibold text-white mb-2">What to do next:</p>
                    <ul className="space-y-1.5">
                      <li>• Ask your Admin to resend the invite</li>
                      <li>• Make sure you clicked the link in the <strong className="text-slate-300">latest</strong> email</li>
                      <li>• Invite links expire after <strong className="text-slate-300">24 hours</strong></li>
                    </ul>
                  </div>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
                  >
                    Go to Login
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
