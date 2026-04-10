'use client'

import React from 'react'

type BadgeStatus =
  | 'Lead' | 'Active' | 'Closed'
  | 'Pending' | 'In Progress' | 'Completed'
  | 'New' | 'Contacted' | 'Negotiation' | 'Won' | 'Lost'
  | 'Admin' | 'Manager' | 'Team Member'

interface BadgeProps {
  status: BadgeStatus | string
  className?: string
}

const badgeConfig: Record<string, { text: string; glow: string }> = {
  // Customer Status
  Lead:         { text: 'text-cyan-300',    glow: 'bg-cyan-500/15 border-cyan-500/30 shadow-[0_0_8px_rgba(14,165,233,0.3)]' },
  Active:       { text: 'text-emerald-300', glow: 'bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]' },
  Closed:       { text: 'text-slate-400',   glow: 'bg-slate-500/15 border-slate-500/30' },

  // Task Status
  Pending:      { text: 'text-cyan-300',    glow: 'bg-cyan-500/15 border-cyan-500/30 shadow-[0_0_8px_rgba(14,165,233,0.3)]' },
  'In Progress':{ text: 'text-amber-300',   glow: 'bg-amber-500/15 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.3)]' },
  Completed:    { text: 'text-emerald-300', glow: 'bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]' },

  // Deal Stage
  New:          { text: 'text-cyan-300',    glow: 'bg-cyan-500/15 border-cyan-500/30 shadow-[0_0_8px_rgba(14,165,233,0.3)]' },
  Contacted:    { text: 'text-blue-300',    glow: 'bg-blue-500/15 border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]' },
  Negotiation:  { text: 'text-amber-300',   glow: 'bg-amber-500/15 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.3)]' },
  Won:          { text: 'text-emerald-300', glow: 'bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]' },
  Lost:         { text: 'text-rose-300',    glow: 'bg-rose-500/15 border-rose-500/30 shadow-[0_0_8px_rgba(239,68,68,0.3)]' },

  // Roles
  Admin:        { text: 'text-indigo-300',  glow: 'bg-indigo-500/15 border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.3)]' },
  Manager:      { text: 'text-blue-300',    glow: 'bg-blue-500/15 border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]' },
  'Team Member':{ text: 'text-slate-300',   glow: 'bg-slate-500/15 border-slate-500/30' },
}

export function Badge({ status, className = '' }: BadgeProps) {
  const config = badgeConfig[status] || {
    text: 'text-slate-300',
    glow: 'bg-slate-500/15 border-slate-500/30',
  }

  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5
        rounded-full
        text-xs font-semibold
        border
        backdrop-blur-sm
        transition-all duration-200
        ${config.text}
        ${config.glow}
        ${className}
      `}
    >
      {status}
    </span>
  )
}
