'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Palette, Moon, Sun, Layers, CheckCircle2 } from 'lucide-react'

type Theme = 'dark' | 'light' | 'glass'

const THEMES: {
  id: Theme
  label: string
  desc: string
  icon: React.ReactNode
  preview: { bg: string; panel: string; text: string; accent: string }
}[] = [
  {
    id: 'dark',
    label: 'Dark Mode',
    desc: 'Deep dark background with vibrant neon accents. Default.',
    icon: <Moon className="w-5 h-5" />,
    preview: { bg: '#0B0E14', panel: '#131823', text: '#fff', accent: '#3B82F6' },
  },
  {
    id: 'light',
    label: 'Light Mode',
    desc: 'Clean white background, high contrast, softer accents.',
    icon: <Sun className="w-5 h-5" />,
    preview: { bg: '#F1F5F9', panel: '#FFFFFF', text: '#0F172A', accent: '#3B82F6' },
  },
  {
    id: 'glass',
    label: 'Glassmorphic',
    desc: 'Heavy blur, animated gradient mesh, frosted glass panels.',
    icon: <Layers className="w-5 h-5" />,
    preview: { bg: '#060A14', panel: 'rgba(255,255,255,0.08)', text: '#fff', accent: '#818CF8' },
  },
]

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  localStorage.setItem('crm-theme', theme)
}

export default function AppearancePage() {
  const [active, setActive] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('crm-theme') as Theme | null
    if (saved) { setActive(saved); applyTheme(saved) }
  }, [])

  const handleSelect = (theme: Theme) => {
    setActive(theme)
    applyTheme(theme)
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 border border-white/10 space-y-5"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-white/8">
          <div className="p-2 rounded-xl bg-violet-500/15">
            <Palette className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Theme</h2>
            <p className="text-xs text-slate-500">Choose how BizCRM looks. Applied instantly, stored locally.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEMES.map((t, i) => {
            const isActive = active === t.id
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(t.id)}
                className="relative text-left rounded-2xl overflow-hidden border-2 transition-all duration-200"
                style={{
                  borderColor: isActive ? '#3B82F6' : 'rgba(255,255,255,0.08)',
                  boxShadow: isActive ? '0 0 20px rgba(59,130,246,0.3), 0 0 0 1px rgba(59,130,246,0.2)' : 'none',
                }}
              >
                {/* Preview */}
                <div
                  className="h-28 p-3 flex flex-col gap-2"
                  style={{ background: t.preview.bg }}
                >
                  <div className="flex gap-1.5">
                    {['bg-rose-400', 'bg-amber-400', 'bg-emerald-400'].map(c => (
                      <div key={c} className={`w-2 h-2 rounded-full ${c}`} />
                    ))}
                  </div>
                  <div
                    className="flex-1 rounded-lg p-2 flex flex-col gap-1.5"
                    style={{ background: t.preview.panel, border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="w-16 h-1.5 rounded-full" style={{ background: t.preview.text, opacity: 0.8 }} />
                    <div className="w-10 h-1 rounded-full" style={{ background: t.preview.text, opacity: 0.3 }} />
                    <div className="mt-auto flex justify-end">
                      <div className="px-2 py-0.5 rounded-md text-white text-[8px] font-medium" style={{ background: t.preview.accent }}>
                        Button
                      </div>
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className="p-3 bg-white/3 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-slate-400">{t.icon}</span>
                      <span className="text-sm font-semibold">{t.label}</span>
                    </div>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.desc}</p>
                </div>
              </motion.button>
            )
          })}
        </div>

        <p className="text-xs text-slate-600 pt-2">
          Note: Theme preference is saved in your browser. Light and Glassmorphic modes apply additional CSS variable overrides.
        </p>
      </motion.section>

      {/* Accent Color (Future) */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel p-6 border border-white/10 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Accent Color</h2>
            <p className="text-xs text-slate-500 mt-0.5">Customize your primary brand color</p>
          </div>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full font-medium">
            Coming Soon
          </span>
        </div>
        <div className="flex gap-3 opacity-40 pointer-events-none">
          {['#3B82F6','#6366F1','#8B5CF6','#EC4899','#10B981','#F59E0B'].map(color => (
            <div
              key={color}
              className="w-8 h-8 rounded-full border-2 border-transparent hover:scale-110 transition-transform cursor-pointer"
              style={{ background: color }}
            />
          ))}
        </div>
      </motion.section>
    </div>
  )
}
