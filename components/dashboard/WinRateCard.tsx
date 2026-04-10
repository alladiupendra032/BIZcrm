'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Target } from 'lucide-react'

interface WinRateCardProps {
  deals: { stage: string; value: number }[]
  loading?: boolean
}

export function WinRateCard({ deals, loading = false }: WinRateCardProps) {
  if (loading) {
    return (
      <div className="glass-panel p-6 border border-white/10 space-y-4">
        <div className="h-4 w-28 rounded shimmer" />
        <div className="h-32 rounded-xl shimmer" />
      </div>
    )
  }

  const won  = deals.filter(d => d.stage === 'Won').length
  const lost = deals.filter(d => d.stage === 'Lost').length
  const closed = won + lost
  const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0

  const wonValue  = deals.filter(d => d.stage === 'Won').reduce((a, d) => a + d.value, 0)
  const lostValue = deals.filter(d => d.stage === 'Lost').reduce((a, d) => a + d.value, 0)
  const totalClosed = wonValue + lostValue

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`

  const segments = [
    { label: 'Won',  count: won,  color: '#10B981', pct: closed ? (won  / closed) * 100 : 0 },
    { label: 'Lost', count: lost, color: '#EF4444', pct: closed ? (lost / closed) * 100 : 0 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-panel p-6 border border-white/10 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Win Rate
        </h2>
        <span className="text-xs text-slate-500">{closed} closed deals</span>
      </div>

      {/* Donut */}
      <div className="flex items-center gap-5">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
            {closed > 0 && (
              <>
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke="#10B981" strokeWidth="4"
                  strokeDasharray={`${winRate * 0.879} ${100 - winRate * 0.879}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke="#EF4444" strokeWidth="4"
                  strokeDasharray={`${(100 - winRate) * 0.879} ${100 - (100 - winRate) * 0.879}`}
                  strokeDashoffset={`-${winRate * 0.879}`}
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white leading-none">{winRate}%</span>
            <span className="text-[9px] text-slate-500 mt-0.5">win rate</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {segments.map(s => (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{s.label}</span>
                <span className="font-medium text-white">{s.count}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: s.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue stats */}
      <div className="pt-3 border-t border-white/8 grid grid-cols-2 gap-3">
        <div className="text-center p-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
          <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Won Value</span>
          </div>
          <p className="text-base font-bold text-white">{fmt(wonValue)}</p>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-rose-500/8 border border-rose-500/15">
          <div className="flex items-center justify-center gap-1 text-rose-400 mb-1">
            <Target className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Lost Value</span>
          </div>
          <p className="text-base font-bold text-white">{fmt(lostValue)}</p>
        </div>
      </div>
    </motion.div>
  )
}
