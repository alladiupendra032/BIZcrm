'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User, Palette, Building2, Plug, Bell, Sparkles,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useUser } from '@/lib/UserContext'

const NAV_ITEMS = [
  { href: '/settings/profile',       icon: User,      label: 'Profile',       sub: 'Personal info & password' },
  { href: '/settings/appearance',    icon: Palette,   label: 'Appearance',    sub: 'Theme & display' },
  { href: '/settings/organization',  icon: Building2, label: 'Organization',  sub: 'Admin only', adminOnly: true },
  { href: '/settings/integrations',  icon: Plug,      label: 'Integrations',  sub: 'Connect apps' },
  { href: '/settings/notifications', icon: Bell,      label: 'Notifications', sub: 'Alert preferences' },
  { href: '/settings/ai',            icon: Sparkles,  label: 'AI Features',   sub: 'Lead scoring & insights' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { role } = useUser()

  const visibleNav = NAV_ITEMS.filter(item => !item.adminOnly || role === 'Admin')

  // If on /settings root, redirect hint is shown by the root page
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your profile, appearance, and workspace.</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Settings Sub-nav */}
          <motion.aside
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:w-60 flex-shrink-0"
          >
            <nav className="space-y-1">
              {visibleNav.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: 3 }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        active
                          ? 'bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border border-blue-500/25 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`p-1.5 rounded-lg flex-shrink-0 ${active ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                        <item.icon className={`w-4 h-4 ${active ? 'text-blue-400' : ''}`} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{item.label}</p>
                        <p className="text-xs text-slate-500 leading-tight mt-0.5">{item.sub}</p>
                      </div>
                      {active && (
                        <motion.div
                          layoutId="settings-active"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"
                        />
                      )}
                    </motion.div>
                  </Link>
                )
              })}
            </nav>
          </motion.aside>

          {/* Page Content */}
          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </DashboardLayout>
  )
}
