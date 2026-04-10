'use client'

import React from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Plus, Inbox } from 'lucide-react'
import { DealCard, Deal } from './DealCard'

interface KanbanColumnProps {
  stage: string
  deals: Deal[]
  colorType?: 'default' | 'won' | 'lost'
  onAddDeal?: (stage: string) => void
  onDealClick?: (deal: Deal) => void
}

export function KanbanColumn({ stage, deals, colorType = 'default', onAddDeal, onDealClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: {
      type: 'Column',
      stage,
    },
  })

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0)
  
  const bgColors = {
    default: isOver ? 'bg-white/[0.04]' : 'bg-white/[0.02]',
    won: isOver ? 'bg-emerald-500/10' : 'bg-emerald-500/5',
    lost: isOver ? 'bg-rose-500/10' : 'bg-rose-500/5',
  }

  const borderColors = {
    default: isOver ? 'border-blue-500/30' : 'border-white/5',
    won: isOver ? 'border-emerald-500/30' : 'border-emerald-500/10',
    lost: isOver ? 'border-rose-500/30' : 'border-rose-500/10',
  }

  const badgeColors = {
    default: 'bg-white/10 text-slate-300',
    won: 'bg-emerald-500/20 text-emerald-300',
    lost: 'bg-rose-500/20 text-rose-300',
  }

  return (
    <div className={`w-[320px] flex-shrink-0 flex flex-col rounded-2xl border transition-colors ${bgColors[colorType]} ${borderColors[colorType]}`}>
      
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex flex-col gap-2 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white tracking-tight">{stage}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColors[colorType]}`}>
              {deals.length}
            </span>
          </div>
          {onAddDeal && (
            <button
              onClick={() => onAddDeal(stage)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={`Add deal to ${stage}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-sm font-medium text-slate-400">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
      </div>

      {/* Droppable Area */}
      <div 
        ref={setNodeRef} 
        className="flex-1 p-3 overflow-y-auto overflow-x-hidden min-h-[150px] custom-scrollbar"
      >
        {deals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-8 select-none">
            <Inbox className="w-8 h-8 mb-2 text-slate-500" />
            <span className="text-xs text-slate-500">No deals in this stage</span>
          </div>
        ) : (
          <SortableContext
            items={deals.map(d => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {deals.map(deal => (
              <DealCard key={deal.id} deal={deal} onClick={() => onDealClick?.(deal)} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}
