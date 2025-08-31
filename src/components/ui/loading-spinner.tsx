'use client'

/**
 * Loading spinner component with consistent design system styling
 */

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
  }

  const classes = [
    sizeClasses[size],
    'border-muted-foreground/30 border-t-primary rounded-full animate-spin',
    className
  ].join(' ')

  return (
    <div 
      className={classes}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}