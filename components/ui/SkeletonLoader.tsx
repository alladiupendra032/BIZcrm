'use client'

import React from 'react'

interface SkeletonRowProps {
  columns?: number
  className?: string
}

interface SkeletonLoaderProps {
  rows?: number
  type?: 'table' | 'card' | 'metric' | 'list'
  className?: string
}

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg shimmer ${className}`}
      style={{
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s linear infinite',
      }}
    />
  )
}

function SkeletonTableRow({ columns = 5 }: SkeletonRowProps) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/5">
      {/* Avatar placeholder */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s linear infinite',
        }}
      />
      {Array.from({ length: columns - 1 }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={`h-4 rounded ${i === 0 ? 'w-1/4' : i === columns - 2 ? 'w-16' : 'flex-1'}`}
        />
      ))}
    </div>
  )
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-8 w-8 rounded-lg" />
          </div>
          <SkeletonBox className="h-8 w-20" />
          <SkeletonBox className="h-3 w-full" />
        </div>
      ))}
    </div>
  )
}

function SkeletonMetric() {
  return (
    <div className="glass-panel p-5 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-10 w-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-6 w-16" />
        </div>
      </div>
      <SkeletonBox className="h-12 w-full rounded-lg" />
    </div>
  )
}

function SkeletonList({ rows = 5 }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass-panel">
          <SkeletonBox className="h-4 w-4 rounded" />
          <SkeletonBox className="h-4 flex-1" />
          <SkeletonBox className="h-5 w-16 rounded-full" />
          <SkeletonBox className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonLoader({
  rows = 5,
  type = 'table',
  className = '',
}: SkeletonLoaderProps) {
  if (type === 'card') return <SkeletonCards />
  if (type === 'metric') return <SkeletonMetric />
  if (type === 'list') return <SkeletonList rows={rows} />

  return (
    <div className={`glass-panel overflow-hidden ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  )
}
