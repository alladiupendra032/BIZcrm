'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { STAGES } from './KanbanBoard'

interface CustomerOption {
  id: string
  name: string
}

interface UserOption {
  id: string
  name: string
}

interface DealFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialStage?: string
  onSuccess: () => void
}

export function DealFormModal({ isOpen, onClose, initialStage = 'New', onSuccess }: DealFormModalProps) {
  const { user, role } = useUser()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    title: '',
    customer_id: '',
    value: '',
    expected_close_date: '',
    assigned_to: '',
    stage: 'New',
  })
  
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  const canAssign = role === 'Admin' || role === 'Manager'

  // Fetch dropdown data on open
  useEffect(() => {
    if (isOpen && user?.organization_id && !dataLoaded) {
      const fetchData = async () => {
        // Fetch customers
        const { data: cData } = await supabase
          .from('customers')
          .select('id, name')
          .eq('organization_id', user!.organization_id as string)
          .eq('archived', false)
          .order('name')
          
        if (cData) setCustomers(cData)

        // Fetch users if allowed to assign
        if (canAssign) {
          const { data: uData } = await supabase
            .from('users')
            .select('id, name')
            .eq('organization_id', user!.organization_id as string)
            .order('name')
            
          if (uData) setUsers(uData)
        }
        setDataLoaded(true)
      }
      fetchData()
    }
  }, [isOpen, user?.organization_id, dataLoaded, canAssign])

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        customer_id: '',
        value: '',
        expected_close_date: '',
        assigned_to: user?.id || '',
        stage: initialStage,
      })
      setErrors({})
    }
  }, [isOpen, initialStage, user?.id])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (formData.value && isNaN(Number(formData.value))) newErrors.value = 'Must be a valid number'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !user?.organization_id) return

    setLoading(true)
    try {
      const { error } = await (supabase.from('deals') as any)
        .insert({
          title: formData.title,
          customer_id: formData.customer_id || null,
          value: formData.value ? parseFloat(formData.value) : null,
          expected_close_date: formData.expected_close_date || null,
          assigned_to: formData.assigned_to || user.id,
          stage: formData.stage,
          organization_id: user.organization_id,
        })

      if (error) throw error
      showToast('success', 'Deal created successfully')
      
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      showToast('error', err.message || 'Failed to create deal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Deal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Deal Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          placeholder="Website Redesign Project"
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Expected Value ($)"
            type="number"
            step="0.01"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            error={errors.value}
            placeholder="5000"
          />
          <Input
            label="Expected Close Date"
            type="date"
            value={formData.expected_close_date}
            onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-300">Customer</label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className={`
                w-full py-2.5 px-4 bg-white/5 rounded-xl text-white text-sm
                border-b-2 border-transparent hover:border-white/20
                focus:border-blue-500 focus:bg-white/8 outline-none transition-all
              `}
            >
              <option value="" className="bg-slate-900">-- None --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-300">Stage</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className={`
                w-full py-2.5 px-4 bg-white/5 rounded-xl text-white text-sm
                border-b-2 border-transparent hover:border-white/20
                focus:border-blue-500 focus:bg-white/8 outline-none transition-all
              `}
            >
              {STAGES.map(s => (
                <option key={s} value={s} className="bg-slate-900">{s}</option>
              ))}
            </select>
          </div>
        </div>

        {canAssign && (
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-300">Assigned To</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className={`
                w-full py-2.5 px-4 bg-white/5 rounded-xl text-white text-sm
                border-b-2 border-transparent hover:border-white/20
                focus:border-blue-500 focus:bg-white/8 outline-none transition-all
              `}
            >
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-slate-900">{u.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Add Deal
          </Button>
        </div>
      </form>
    </Modal>
  )
}
