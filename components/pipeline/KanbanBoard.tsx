'use client'

import React, { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { DealCard, Deal } from './DealCard'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '../ui/Toast'

export const STAGES = ['New', 'Contacted', 'Negotiation', 'Won', 'Lost']

interface KanbanBoardProps {
  deals: Deal[]
  loading: boolean
  onAddDeal: (stage: string) => void
  onDealClick: (deal: Deal) => void
  onOptimisticUpdate: (updatedDeals: Deal[]) => void
  onRevertUpdate: () => void
}

export function KanbanBoard({ deals, loading, onAddDeal, onDealClick, onOptimisticUpdate, onRevertUpdate }: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const { showToast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draggedDeal = deals.find(d => d.id === active.id)
    if (draggedDeal) setActiveDeal(draggedDeal)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDeal(null)
    const { active, over } = event
    
    if (!over) return

    const dealId = active.id as string
    const sourceStage = deals.find(d => d.id === dealId)?.stage
    
    // The over.id could be the column (stage name) or another deal's id (in which case we need its stage)
    // First, check if over.id is a known stage
    let destinationStage: string | undefined
    
    if (STAGES.includes(over.id as string)) {
      destinationStage = over.id as string
    } else {
      // Find the deal we dropped over and get its stage
      const overDeal = deals.find(d => d.id === over.id)
      destinationStage = overDeal?.stage
    }

    if (!destinationStage || sourceStage === destinationStage) return

    // Optimistically update
    const updatedDeals = deals.map(d => 
      d.id === dealId ? { ...d, stage: destinationStage as string } : d
    )
    onOptimisticUpdate(updatedDeals)

    try {
      const { error } = await (supabase.from('deals') as any)
        .update({ stage: destinationStage })
        .eq('id', dealId)
        
      if (error) throw error
    } catch (err) {
      console.error(err)
      showToast('error', 'Stage update failed. Please try again.')
      onRevertUpdate()
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {STAGES.map(stage => (
          <div key={stage} className="w-[320px] flex-shrink-0 h-[600px] glass-panel border border-white/5 opacity-50">
            <div className="p-4 border-b border-white/5 h-16 shimmer" />
            <div className="p-4 space-y-4">
              <div className="h-24 w-full rounded-xl shimmer border border-white/5" />
              <div className="h-24 w-full rounded-xl shimmer border border-white/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Group deals by stage
  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter(d => d.stage === stage)
    return acc
  }, {} as Record<string, Deal[]>)

  return (
    <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 h-[calc(100vh-220px)] min-h-[500px] custom-scrollbar">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={dealsByStage[stage] || []}
            colorType={stage === 'Won' ? 'won' : stage === 'Lost' ? 'lost' : 'default'}
            onAddDeal={onAddDeal}
            onDealClick={onDealClick}
          />
        ))}

        <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
