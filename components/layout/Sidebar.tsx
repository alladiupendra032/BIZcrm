'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Kanban, CheckSquare, Settings,
  ChevronLeft, ChevronRight, UserCog, Activity, LogOut, Zap, X, Menu,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'

const mainNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/customers',  icon: Users,          label: 'Customers' },
  { href: '/pipeline',   icon: Kanban,         label: 'Pipeline' },
  { href: '/tasks',      icon: CheckSquare,    label: 'Tasks' },
  { href: '/settings',   icon: Settings,       label: 'Settings' },
]

const adminNavItems = [
  { href: '/admin/users',    icon: UserCog, label: 'User Management' },
  { href: '/admin/activity', icon: Activity, label: 'Activity Log' },
]

// ─── Mobile Hamburger (fixed top-left) ───────────────────────────────────────
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-[300] p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white hover:bg-white/15 transition-all"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, role } = useUser()

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const sidebarContent = (mobile = false) => (
    <motion.aside
      initial={false}
      animate={{ width: mobile ? 260 : collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex flex-col h-screen relative flex-shrink-0 ${mobile ? 'w-64' : ''}`}
      style={{
        background: 'rgba(11, 14, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {(!collapsed || mobile) && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="text-white font-bold text-sm whitespace-nowrap overflow-hidden"
            >
              BizCRM
            </motion.span>
          )}
        </AnimatePresence>

        {mobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <motion.button
            onClick={() => setCollapsed(!collapsed)}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className={`ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all ${collapsed ? 'mx-auto' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </motion.button>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {mainNavItems.map(item => (
          <NavItem
            key={item.href}
            {...item}
            active={isActive(item.href)}
            collapsed={collapsed && !mobile}
          />
        ))}
      </nav>

      {/* Admin Section */}
      {role === 'Admin' && (
        <div className={`px-2 pb-2 ${(!collapsed || mobile) ? 'border-t border-white/8 pt-3' : 'pt-2'}`}>
          {(!collapsed || mobile) && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
              Admin
            </p>
          )}
          {adminNavItems.map(item => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              collapsed={collapsed && !mobile}
            />
          ))}
        </div>
      )}

      {/* User + Logout */}
      <div className="border-t border-white/8 p-3">
        {(!collapsed || mobile) && user && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{role}</p>
            </div>
          </div>
        )}
        <motion.button
          onClick={handleLogout}
          whileHover={{ x: 4 }} whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group ${(collapsed && !mobile) ? 'justify-center' : ''}`}
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {(!collapsed || mobile) && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="text-sm"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        {sidebarContent(false)}
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[300] p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/12 text-white hover:bg-white/10 transition-all"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 z-[250] h-full"
            >
              {sidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function NavItem({
  href, icon: Icon, label, active, collapsed,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  collapsed: boolean
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: collapsed ? 0 : 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl
          transition-all duration-200 cursor-pointer
          ${collapsed ? 'justify-center' : ''}
          ${active
            ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }
        `}
        title={collapsed ? label : undefined}
      >
        <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-blue-400' : ''}`} />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {active && !collapsed && (
          <motion.div
            layoutId="active-indicator"
            className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
          />
        )}
      </motion.div>
    </Link>
  )
}
