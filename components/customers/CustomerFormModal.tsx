'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/UserContext'
import { Customer } from './CustomerTable'

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  customer?: Customer // if provided, we are in Edit mode
  onSuccess: () => void
}

export function CustomerFormModal({ isOpen, onClose, customer, onSuccess }: CustomerFormModalProps) {
  const { user } = useUser()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
    status: 'Lead',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Pre-fill on edit
  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        notes: customer.notes || '',
        status: customer.status,
      })
      setErrors({})
    } else if (isOpen) {
      // Reset on add
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        notes: '',
        status: 'Lead',
      })
      setErrors({})
    }
  }, [customer, isOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email address'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !user?.organization_id) return

    setLoading(true)
    try {
      // Check email uniqueness within org
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('email', formData.email)
        .neq('id', customer?.id || '00000000-0000-0000-0000-000000000000')
        .maybeSingle()
        
      if (existing) {
        setErrors({ ...errors, email: 'A customer with this email already exists' })
        setLoading(false)
        return
      }

      if (customer) {
        // Edit mode
        const { error } = await (supabase.from('customers') as any)
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
            notes: formData.notes,
            status: formData.status,
          })
          .eq('id', customer.id)

        if (error) throw error
        showToast('success', 'Customer updated successfully')
      } else {
        // Add mode
        const { error } = await (supabase.from('customers') as any)
          .insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
            notes: formData.notes,
            status: formData.status,
            organization_id: user.organization_id,
          })

        if (error) throw error
        showToast('success', 'Customer created successfully')
      }
      
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      showToast('error', err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customer ? 'Edit Customer' : 'Add Customer'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="Jane Doe"
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            placeholder="jane@example.com"
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Acme Inc."
          />
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-slate-300">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={`
                w-full py-2.5 px-4 bg-white/5 rounded-xl text-white text-sm
                border-b-2 border-transparent hover:border-white/20
                focus:border-blue-500 focus:bg-white/8 outline-none transition-all
              `}
            >
              <option value="Lead" className="bg-slate-900">Lead</option>
              <option value="Active" className="bg-slate-900">Active</option>
              <option value="Closed" className="bg-slate-900">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-slate-300">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Important context or requirements..."
            rows={3}
            className={`
              w-full py-2.5 px-4 bg-white/5 rounded-xl text-white text-sm
              border-b-2 border-transparent hover:border-white/20
              focus:border-blue-500 focus:bg-white/8 outline-none transition-all resize-none
              placeholder:text-slate-500
            `}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {customer ? 'Save Changes' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
