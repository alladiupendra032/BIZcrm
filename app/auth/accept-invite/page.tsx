'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, ArrowRight, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type State = 'verifying' | 'success' | 'error'

export default function AcceptInvitePage() {
  const router = useRouter()
  const [state, setState] = useState<State>('verifying')
  const [errorMsg, setErrorMsg] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    /**
     * When the user clicks the invite link, Supabase appends:
     *   ?token=xxx&type=invite
     * The auth-helpers client automatically exchanges this token when
     * onAuthStateChange fires — we just need to listen for it.
     *
     * Alternatively, the URL may contain #access_token= (PKCE flow).
     * supabase.auth handles both cases transparently via onAuthStateChange.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Token exchange succeeded — user is now logged in
          const name = session.user.user_metadata?.full_name
                    || session.user.email?.split('@')[0]
                    || 'there'
          setUserName(name)
          setState('success')

          // Redirect to dashboard after 2.5 seconds
          setTimeout(() => {
            router.replace('/dashboard')
          }, 2500)
        }

        if (event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED') {
          // Could happen if user already logged in — just redirect
          router.replace('/dashboard')
        }
      }
    )

    // Safety timeout: if nothing fires in 8 seconds, likely an expired/invalid link
    const timeout = setTimeout(() => {
      setState(prev => {
        if (prev === 'verifying') {
          setErrorMsg('Your invite link may have expired or already been used.')
          return 'error'
        }
        return prev
      })
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, #060810 60%)' }}
    >
      {/* Background blobs */}
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
          {/* Gradient top bar */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6)' }} />

          {/* Logo header */}
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

          {/* Content */}
          <div className="px-8 py-10">
            <AnimatePresence mode="wait">

              {/* ── Verifying state ── */}
              {state === 'verifying' && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-6">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                      <div className="absolute inset-2 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Setting up your account…</h1>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We're verifying your invite link.<br />This will only take a moment.
                  </p>

                  {/* Animated dots */}
                  <div className="flex justify-center gap-1.5 mt-6">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Success state ── */}
              {state === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex justify-center mb-6"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                  </motion.div>

                  <h1 className="text-2xl font-bold text-white mb-2">
                    Welcome, {userName}! 🎉
                  </h1>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Your account has been verified successfully.<br />
                    Taking you to your dashboard…
                  </p>

                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                    Redirecting to Dashboard
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg,#3b82f6,#6366f1)' }}
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.5, ease: 'linear' }}
                    />
                  </div>
                </motion.div>
              )}

              {/* ── Error state ── */}
              {state === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex justify-center mb-6"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                    </div>
                  </motion.div>

                  <h1 className="text-2xl font-bold text-white mb-2">Invite Link Issue</h1>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {errorMsg || 'This invite link may have expired or already been used.'}
                  </p>

                  {/* Info box */}
                  <div
                    className="text-left p-4 rounded-xl mb-6 text-sm text-slate-400"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="font-semibold text-white mb-2">What to do next:</p>
                    <ul className="space-y-1.5 list-none">
                      <li>• Ask your admin to resend the invite</li>
                      <li>• Make sure you clicked the link in the latest email</li>
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
