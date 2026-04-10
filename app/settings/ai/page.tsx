'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Brain, Target, TrendingUp, BarChart3, Zap } from 'lucide-react'

const FEATURES = [
  {
    icon: <Target className="w-5 h-5 text-violet-400" />,
    color: 'from-violet-500/15 to-purple-500/15',
    border: 'border-violet-500/20',
    title: 'Lead Scoring',
    desc: 'AI analyzes customer engagement, deal activity, and communication patterns to produce a 0–100 conversion likelihood score.',
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
    color: 'from-blue-500/15 to-cyan-500/15',
    border: 'border-blue-500/20',
    title: 'Deal Win Prediction',
    desc: 'Machine learning model trained on your historical deals predicts the probability of closing each open opportunity.',
  },
  {
    icon: <Brain className="w-5 h-5 text-pink-400" />,
    color: 'from-pink-500/15 to-rose-500/15',
    border: 'border-pink-500/20',
    title: 'Smart Follow-Up Suggestions',
    desc: 'Based on deal stage and last contact date, AI recommends the optimal time and message for your next follow-up.',
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
    color: 'from-emerald-500/15 to-teal-500/15',
    border: 'border-emerald-500/20',
    title: 'Pipeline Forecasting',
    desc: 'Accurate revenue forecasts using weighted probability scoring across all open deals in your pipeline.',
  },
]

export default function AiPage() {
  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 border border-violet-500/25"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.08) 50%, rgba(236,72,153,0.06) 100%)',
        }}
      >
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-12 w-32 h-32 rounded-full opacity-15 blur-2xl" style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }} />

        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex-shrink-0">
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-white">AI Features</h2>
              <span className="text-xs bg-violet-500/25 text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-full font-medium">
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed max-w-lg">
              BizCRM is building intelligent AI capabilities directly into your workflow — no external tools required.
              Below is a preview of what's coming.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`p-5 rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} space-y-3`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5">{f.icon}</div>
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Confidence Threshold Mock */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-panel p-6 border border-white/10 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Confidence Threshold</h3>
            <p className="text-xs text-slate-500 mt-0.5">Only show AI suggestions above this confidence score</p>
          </div>
          <span className="text-sm font-bold text-violet-400">70%</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={70}
            disabled
            className="w-full h-2 appearance-none rounded-full cursor-not-allowed opacity-50"
            style={{ accentColor: '#8B5CF6' }}
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 italic">Configuration will be enabled when AI features launch</p>
      </motion.section>

      {/* Mock Score Preview */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="glass-panel p-6 border border-white/10 space-y-4"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-white/8">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">What AI Scores Will Look Like</h3>
          <span className="text-xs text-slate-500 ml-1">(Preview)</span>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/8 opacity-70">
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Acme Corporation</p>
            <p className="text-xs text-slate-500">Enterprise Customer · Last contact 2d ago</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-slate-500">AI Score</p>
              <p className="text-xl font-bold text-emerald-400">87</p>
            </div>
            <div className="w-14 h-14 relative flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke="#10B981" strokeWidth="3"
                  strokeDasharray={`${87 * 0.975} ${100 - 87 * 0.975}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-400">87</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
