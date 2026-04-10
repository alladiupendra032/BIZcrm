'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts'

interface DealStageData {
  stage: string
  count: number
  value: number
}

interface PipelineChartProps {
  data: DealStageData[]
  loading?: boolean
}

type TimePeriod = 'This Month' | 'Last 3 Months' | 'All Time'

const STAGE_COLORS: Record<string, string> = {
  New:        '#0EA5E9',
  Contacted:  '#3B82F6',
  Negotiation:'#F59E0B',
  Won:        '#10B981',
  Lost:       '#EF4444',
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as DealStageData
  return (
    <div className="glass-panel border border-white/15 p-3 text-xs shadow-xl min-w-[120px]">
      <p className="font-semibold text-white mb-1">{d.stage}</p>
      <p className="text-slate-300">
        <span className="text-slate-500">Deals: </span>{d.count}
      </p>
      <p className="text-slate-300">
        <span className="text-slate-500">Value: </span>
        ${d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value.toLocaleString()}
      </p>
    </div>
  )
}

const STAGES: string[] = ['New', 'Contacted', 'Negotiation', 'Won', 'Lost']

function buildChartData(raw: DealStageData[]): DealStageData[] {
  return STAGES.map((stage) => {
    const found = raw.find((r) => r.stage === stage)
    return found ?? { stage, count: 0, value: 0 }
  })
}

export function PipelineChart({ data, loading = false }: PipelineChartProps) {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('All Time')
  const chartData = buildChartData(data)

  if (loading) {
    return (
      <div className="glass-panel p-6 border border-white/10 lg:col-span-2 h-[300px]">
        <div className="h-4 w-36 rounded shimmer mb-6" />
        <div className="h-full shimmer rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-panel p-6 border border-white/10 lg:col-span-2"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-base font-semibold text-white">Pipeline Overview</h2>

        {/* Filter pills */}
        <div className="flex gap-2">
          {(['This Month', 'Last 3 Months', 'All Time'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                activePeriod === period
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/8 border border-transparent'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              {STAGES.map((stage) => (
                <linearGradient key={stage} id={`bar-${stage}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={STAGE_COLORS[stage]} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={STAGE_COLORS[stage]} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="stage"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 4 }}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.stage}
                  fill={`url(#bar-${entry.stage})`}
                  stroke={STAGE_COLORS[entry.stage]}
                  strokeWidth={0.5}
                  strokeOpacity={0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {chartData.map((d) => (
          <div key={d.stage} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: STAGE_COLORS[d.stage] }}
            />
            {d.stage}
            <span className="text-slate-500">({d.count})</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
