'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar } from 'lucide-react'

export interface Deal {
  id: string
  title: string
  value: number | null
  stage: string
  expected_close_date: string | null
  customer_id: string | null
  assigned_to: string | null
  customer_name?: string
  assigned_name?: string
}

interface DealCardProps {
  deal: Deal
  onClick?: () => void
  isDragging?: boolean
}

export function DealCard({ deal, onClick, isDragging }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: deal.id,
    data: {
      type: 'Deal',
      deal,
    },
  })

  // We allow either passing isDragging explicitly (for the DragOverlay) or getting it from sortable
  const dragging = isDragging || isSortableDragging

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isSortableDragging ? 0.3 : 1, // Dim the original card being dragged
  }

  const valueFormatted = deal.value
    ? `$${deal.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '—'
    
  const isHighValue = (deal.value || 0) > 10000

  const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : '?'

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Prevent clicking when we're just dragging
        if (!dragging) onClick?.()
      }}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={`
        glass-panel p-3.5 mb-3 group cursor-grab active:cursor-grabbing border
        ${dragging ? 'scale-105 shadow-[0_10px_30px_rgba(0,0,0,0.4)] border-blue-500/30 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/20'}
        touch-none transition-colors
      `}
      role="button"
      tabIndex={0}
    >
      <h4 className="text-sm font-semibold text-white mb-1 leading-tight line-clamp-2">{deal.title}</h4>
      <p className="text-xs text-slate-400 mb-3 truncate">{deal.customer_name || 'No Customer'}</p>
      
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className={`px-2 py-0.5 rounded text-xs font-semibold ${isHighValue ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-slate-300'}`}>
          {valueFormatted}
        </div>
        
        <div className="flex items-center gap-2">
          {deal.expected_close_date && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(deal.expected_close_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
          
          {deal.assigned_to && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }} title={deal.assigned_name}>
              {getInitials(deal.assigned_name)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
