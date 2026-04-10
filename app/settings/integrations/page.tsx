'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Chrome, Plug } from 'lucide-react'

const INTEGRATIONS = [
  {
    icon: <Mail className="w-6 h-6 text-blue-400" />,
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/20',
    title: 'Google Workspace',
    desc: 'Connect your Google account to pull email activity, calendar events, and contact syncing directly into Customer feeds.',
    badge: 'Gmail / Google Calendar',
  },
  {
    icon: <Chrome className="w-6 h-6 text-indigo-400" />,
    color: 'from-indigo-500/20 to-violet-500/20',
    border: 'border-indigo-500/20',
    title: 'Microsoft 365',
    desc: 'Connect Outlook and Teams to auto-log communications, surface meeting summaries, and keep customer timelines in sync.',
    badge: 'Outlook / Teams',
  },
  {
    icon: <Plug className="w-6 h-6 text-emerald-400" />,
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/20',
    title: 'Zapier / Webhooks',
    desc: 'Automate workflows between BizCRM and 5,000+ apps. Trigger actions on new deals, completed tasks, and customer events.',
    badge: 'Automation',
  },
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 border border-white/10 space-y-5"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-white/8">
          <div className="p-2 rounded-xl bg-blue-500/15">
            <Plug className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">App Integrations</h2>
            <p className="text-xs text-slate-500">Connect your favourite tools to supercharge your CRM</p>
          </div>
        </div>

        <div className="space-y-4">
          {INTEGRATIONS.map((intg, i) => (
            <motion.div
              key={intg.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br ${intg.color} border ${intg.border}`}
            >
              <div className="p-2.5 rounded-xl bg-white/5 flex-shrink-0">
                {intg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-white">{intg.title}</h3>
                  <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
                    {intg.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{intg.desc}</p>
              </div>
              <button
                className="flex-shrink-0 text-xs font-medium px-4 py-2 rounded-xl border border-white/10 text-slate-500 cursor-not-allowed opacity-60 whitespace-nowrap"
                disabled
              >
                Connect
              </button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20"
      >
        <div className="text-2xl">🚀</div>
        <div>
          <p className="text-sm font-medium text-indigo-300">Integrations are coming in Q3 2026</p>
          <p className="text-xs text-slate-500 mt-0.5">Our team is actively building these connections. You'll be notified when they're ready.</p>
        </div>
        <span className="ml-auto flex-shrink-0 text-xs bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full font-medium">
          Coming Soon
        </span>
      </motion.div>
    </div>
  )
}
