'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Building, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    organizationName: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)

    try {
      // Step 1: Create Supabase Auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.fullName },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (!authData.user) {
        setError('Something went wrong during signup. Please try again.')
        return
      }

      // Handle email confirmation required (Supabase default)
      // identities array is empty when email already exists
      if (authData.user.identities && authData.user.identities.length === 0) {
        setError('An account with this email already exists. Please sign in instead.')
        return
      }

      // Step 2: Create organization record
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.organizationName,
          owner_id: authData.user.id,
        })
        .select('id')
        .single()

      if (orgError) {
        setError('Organization setup failed: ' + orgError.message)
        return
      }

      // Step 3: Create user profile record
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          name: formData.fullName,
          email: formData.email,
          role: 'Admin',
          organization_id: org.id,
        })

      if (profileError) {
        setError('Profile setup failed: ' + profileError.message)
        return
      }

      // Force logout to ensure they must sign in properly
      await supabase.auth.signOut()
      
      setError('✅ Workspace & Admin account created! Please sign in to access your dashboard.')
      
      // Delay redirect to login so they can read the success message
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── Left Side: Animated Visual ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0">
          <motion.div
            className="blob-animate-1 absolute top-1/3 left-1/3 w-80 h-80 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <motion.div
            className="blob-animate-2 absolute bottom-1/4 right-1/5 w-72 h-72 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <motion.div
            className="absolute top-1/5 right-1/3 w-48 h-48 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-sm mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #3B82F6)',
                boxShadow: '0 0 40px rgba(59,130,246,0.6)',
              }}
            >
              <Building className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-3"
          >
            Start your workspace
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-sm leading-relaxed"
          >
            Set up your CRM in seconds. Invite your team, add customers, and start closing deals.
          </motion.p>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 mt-10 text-left"
          >
            {[
              'Customer & Lead Management',
              'Interactive Sales Pipeline',
              'Team Task Management',
              'Real-time Analytics Dashboard',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                {feature}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right Side: Signup Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="w-full max-w-md"
        >
          <div className="glass-panel border border-white/12 p-8 shadow-2xl shadow-black/40">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white mb-2">Create your workspace</h2>
              <p className="text-slate-400 text-sm">You&apos;ll be the Admin of your organization</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                id="signup-full-name"
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange('fullName')}
                leftIcon={<User className="w-4 h-4" />}
                error={errors.fullName}
                required
                autoComplete="name"
              />

              <Input
                id="signup-org-name"
                type="text"
                label="Organization Name"
                placeholder="Acme Corp"
                value={formData.organizationName}
                onChange={handleChange('organizationName')}
                leftIcon={<Building className="w-4 h-4" />}
                error={errors.organizationName}
                required
              />

              <Input
                id="signup-email"
                type="email"
                label="Email Address"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange('email')}
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email}
                required
                autoComplete="email"
              />

              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={handleChange('password')}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password}
                required
                autoComplete="new-password"
              />

              {/* Global Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                Create Workspace
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
