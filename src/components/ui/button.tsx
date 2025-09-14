'use client'

/**
 * Button component with consistent styling and accessibility features
 */

import React from 'react'
import { LoadingSpinner } from './loading-spinner'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled,
    children,
    onClick,
    onKeyDown,
    ...props 
  }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (onClick && !disabled && !loading) {
          // Trigger click programmatically
          event.currentTarget.click()
        }
      }
      onKeyDown?.(event)
    }
    const baseClasses = [
      'inline-flex items-center justify-center rounded-md font-medium',
      'transition-all duration-200 ease-in-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'active:scale-95'
    ].join(' ')

    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
      ghost: 'hover:bg-accent hover:text-accent-foreground'
    }

    const sizeClasses = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8 text-lg'
    }

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    ].join(' ')

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {loading && (
          <LoadingSpinner 
            size={size === 'sm' ? 'sm' : 'md'} 
            className="mr-2" 
          />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'