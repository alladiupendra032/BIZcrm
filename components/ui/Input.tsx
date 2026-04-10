'use client'

import React, { forwardRef, useState } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`
              w-full
              ${leftIcon ? 'pl-10' : 'pl-4'}
              ${rightIcon ? 'pr-10' : 'pr-4'}
              py-2.5
              bg-white/5
              rounded-xl
              text-white text-sm
              placeholder:text-slate-500
              outline-none
              border-b-2
              transition-all duration-300
              ${focused
                ? 'border-blue-500 shadow-[0_4px_12px_-4px_rgba(59,130,246,0.4)] bg-white/8'
                : error
                  ? 'border-rose-500'
                  : 'border-transparent hover:border-white/20'
              }
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
          {/* Animated border glow */}
          <div
            className={`
              absolute bottom-0 left-0 right-0 h-0.5 rounded-full
              bg-gradient-to-r from-blue-500 to-indigo-500
              transition-all duration-300
              ${focused ? 'opacity-100 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'opacity-0'}
            `}
          />
        </div>
        {error && (
          <p className="text-xs text-rose-400 mt-0.5">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
