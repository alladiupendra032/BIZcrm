'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'

const EVENTS = [
  { label: 'Task Assigned to Me',   sub: 'When a task is assigned to your account' },
  { label: 'Deal Won',              sub: 'When a deal moves to the Closed Won stage' },
  { label: 'Deal Lost',             sub: 'When a deal moves to the Closed Lost stage' },
  { label: 'New Customer Added',    sub: 'When a new customer record is created' },
  { label: 'Task Due Soon',         sub: '24 hours before a task deadline' },
  { label: 'Weekly Summary',        sub: 'Your weekly pipeline and task summary' },
]

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 border border-white/10 space-y-5"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-white/8">
          <div className="p-2 rounded-xl bg-amber-500/15">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Notification Preferences</h2>
            <p className="text-xs text-slate-500">Control which events trigger in-app and email alerts</p>
          </div>
          <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
            Coming Soon
          </span>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr_96px_96px] gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>Event</span>
          <span className="text-center">In-App</span>
          <span className="text-center">Email</span>
        </div>

        <div className="space-y-2">
          {EVENTS.map((ev, i) => (
            <motion.div
              key={ev.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-[1fr_96px_96px] gap-2 items-center px-4 py-3 rounded-xl bg-white/3 border border-white/6"
            >
              <div>
                <p className="text-sm font-medium text-white">{ev.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ev.sub}</p>
              </div>
              <div className="flex justify-center">
                <DisabledToggle />
              </div>
              <div className="flex justify-center">
                <DisabledToggle />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20"
      >
        <Bell className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-300">Notifications are coming in Q3 2026</p>
          <p className="text-xs text-slate-500 mt-0.5">Real-time in-app alerts and email digests will be configurable here.</p>
        </div>
      </motion.div>
    </div>
  )
}

function DisabledToggle() {
  return (
    <div
      className="w-10 h-5 rounded-full bg-white/8 border border-white/10 relative flex items-center opacity-40 cursor-not-allowed"
      title="Coming soon"
    >
      <div className="w-3.5 h-3.5 rounded-full bg-slate-500 absolute left-0.5 transition-all" />
    </div>
  )
}
