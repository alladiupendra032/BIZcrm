'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, ChevronDown, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type Props = {
  endpoint: string
  filenamePrefix: string
  extraParams?: Record<string, string>
  label?: string
}

/**
 * ExportButton — Admin/Manager only export dropdown.
 * Calls the given Next.js API endpoint and triggers a file download.
 */
export function ExportButton({ endpoint, filenamePrefix, extraParams = {}, label = 'Export' }: Props) {
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const triggerExport = async (format: 'csv' | 'excel') => {
    setOpen(false)
    setLoading(true)
    try {
      const params = new URLSearchParams({ format, ...extraParams })
      const url = `${endpoint}?${params.toString()}`
      const res = await fetch(url)

      if (res.status === 403) {
        showToast('error', 'Access denied: Admin/Manager only')
        return
      }
      if (!res.ok) {
        showToast('error', 'Export failed. Try again.')
        return
      }

      const blob = await res.blob()
      const ext = format === 'csv' ? 'csv' : 'csv' // both use CSV for now
      const filename = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.${ext}`

      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      link.click()
      URL.revokeObjectURL(objectUrl)

      showToast('success', `Exported ${filenamePrefix} successfully`)
    } catch (err) {
      showToast('error', 'Export failed. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <motion.button
        id="export-button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Download className="w-4 h-4" />
        }
        {label}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute right-0 top-full mt-1 w-44 z-50 overflow-hidden"
            style={{
              background: 'rgba(15, 20, 30, 0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="py-1.5">
              <ExportOption
                icon={<FileText className="w-4 h-4 text-green-400" />}
                label="Export as CSV"
                onClick={() => triggerExport('csv')}
              />
              <ExportOption
                icon={<FileText className="w-4 h-4 text-emerald-400" />}
                label="Export as Excel"
                onClick={() => triggerExport('excel')}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ExportOption({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ x: 3 }}
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all"
    >
      {icon}
      {label}
    </motion.button>
  )
}
