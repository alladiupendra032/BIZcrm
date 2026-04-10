'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown, ExternalLink, Loader2 } from 'lucide-react'
import { Deal } from './DealCard'

const STAGE_COLORS: Record<string, string> = {
  'New':       'bg-slate-500/20 text-slate-300      border-slate-500/30',
  'Contacted': 'bg-blue-500/20  text-blue-300       border-blue-500/30',
  'Qualified': 'bg-indigo-500/20 text-indigo-300    border-indigo-500/30',
  'Proposal':  'bg-violet-500/20 text-violet-300    border-violet-500/30',
  'Negotiation':'bg-amber-500/20 text-amber-300     border-amber-500/30',
  'Won':       'bg-emerald-500/20 text-emerald-300  border-emerald-500/30',
  'Lost':      'bg-rose-500/20  text-rose-300       border-rose-500/30',
}

type Props = {
  deals: Deal[]
  loading: boolean
  onDealClick: (deal: Deal) => void
}

export function PipelineListView({ deals, loading, onDealClick }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">Loading deals…</span>
      </div>
    )
  }

  if (!deals.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-500">
        <p className="text-base">No deals match your filters.</p>
        <p className="text-sm opacity-60">Try adjusting or clearing the filters above.</p>
      </div>
    )
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {['Title', 'Customer', 'Value', 'Stage', 'Close Date', 'Owner'].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, i) => (
              <motion.tr
                key={deal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onDealClick(deal)}
                className="border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 transition-colors group"
              >
                <td className="px-5 py-3.5">
                  <span className="font-medium text-white group-hover:text-blue-300 transition-colors truncate max-w-[200px] block">
                    {deal.title}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400 truncate max-w-[160px]">
                  {deal.customer_name || '—'}
                </td>
                <td className="px-5 py-3.5 font-semibold text-emerald-400 whitespace-nowrap">
                  {deal.value !== null && deal.value !== undefined
                    ? `$${deal.value.toLocaleString()}`
                    : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      STAGE_COLORS[deal.stage] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}
                  >
                    {deal.stage}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                  {deal.expected_close_date
                    ? new Date(deal.expected_close_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-5 py-3.5 text-slate-400 truncate max-w-[140px]">
                  {deal.assigned_name || '—'}
                </td>
                <td className="px-5 py-3.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2 border-t border-white/5 text-xs text-slate-600">
        {deals.length} deal{deals.length !== 1 ? 's' : ''} shown
      </div>
    </div>
  )
}
