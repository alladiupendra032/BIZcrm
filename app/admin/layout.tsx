'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/UserContext'

/**
 * Admin route guard — wraps all /admin/* pages.
 * 
 * NOTE: DashboardLayout is rendered by each individual admin page (e.g. admin/users/page.tsx),
 * NOT here. This layout only handles the guard logic.
 * UserProvider is at the root (app/layout.tsx), so useUser() works immediately here.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Only redirect once we know for certain the user is NOT Admin
    if (!loading && role !== 'Admin') {
      router.replace('/dashboard')
    }
  }, [role, loading, router])

  // ── Loading: show a full-screen centered spinner (no DashboardLayout to avoid double shell)
  if (loading) {
    return (
      <div
        className="flex h-screen w-full items-center justify-center"
        style={{ background: 'rgba(9,12,18,1)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-xs tracking-wide">Checking access…</p>
        </div>
      </div>
    )
  }

  // ── Role confirmed Admin — render children (which include their own DashboardLayout)
  if (role === 'Admin') {
    return <>{children}</>
  }

  // ── Loading done, not Admin → show redirecting message
  return (
    <div
      className="flex h-screen w-full items-center justify-center"
      style={{ background: 'rgba(9,12,18,1)' }}
    >
      <p className="text-slate-400 text-sm">Redirecting…</p>
    </div>
  )
}
