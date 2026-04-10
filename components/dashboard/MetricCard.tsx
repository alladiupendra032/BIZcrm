'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from 'recharts'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'

interface MetricCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: string
  bgColor: string
  sparklineData?: { v: number }[]
  loading?: boolean
  prefix?: string
  suffix?: string
  trend?: number // positive = up, negative = down, 0 = flat
  delay?: number
}

function formatValue(value: number | string, prefix?: string, suffix?: string): string {
  if (typeof value === 'string') return value
  if (prefix === '$') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`
    return `$${value.toLocaleString()}`
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return `${value}${suffix ?? ''}`
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  sparklineData = [],
  loading = false,
  prefix,
  trend,
  delay = 0,
}: MetricCardProps) {
  if (loading) {
    return <SkeletonLoader type="metric" />
  }

  const displayed = formatValue(value, prefix)
  const hasTrend = trend !== undefined && trend !== null
  const trendUp = (trend ?? 0) > 0
  const trendFlat = trend === 0
  const TrendIcon = trendFlat ? Minus : trendUp ? TrendingUp : TrendingDown
  const trendColor = trendFlat
    ? 'text-slate-400'
    : trendUp
    ? 'text-emerald-400'
    : 'text-rose-400'

  // Generate placeholder sparkline if none provided
  const chartData =
    sparklineData.length > 0
      ? sparklineData
      : Array.from({ length: 7 }, (_, i) => ({ v: Math.floor(Math.random() * 40 + 10) }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className="glass-panel p-5 border border-white/10 hover:border-white/25 transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* Background glow when hovered */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${color.replace('text-', '').replace('-400', '')} 0%, transparent 60%)`,
          opacity: 0.04,
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-white tracking-tight mb-0.5">
        {displayed}
      </div>
      <div className="text-sm text-slate-400">{title}</div>

      {/* Trend */}
      {hasTrend && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trendFlat ? 'No change' : `${Math.abs(trend!)}% vs last month`}</span>
        </div>
      )}

      {/* Sparkline chart */}
      <div className="mt-3 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`spark-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color.includes('cyan') ? '#0EA5E9' : color.includes('blue') ? '#3B82F6' : color.includes('indigo') ? '#6366F1' : color.includes('amber') ? '#F59E0B' : '#3B82F6'} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color.includes('cyan') ? '#0EA5E9' : color.includes('blue') ? '#3B82F6' : color.includes('indigo') ? '#6366F1' : color.includes('amber') ? '#F59E0B' : '#3B82F6'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color.includes('cyan') ? '#0EA5E9' : color.includes('blue') ? '#3B82F6' : color.includes('indigo') ? '#6366F1' : color.includes('amber') ? '#F59E0B' : '#3B82F6'}
              strokeWidth={1.5}
              fill={`url(#spark-${title.replace(/\s/g, '')})`}
              isAnimationActive={true}
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
