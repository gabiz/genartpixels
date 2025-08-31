'use client'

/**
 * Input component with consistent styling and accessibility features
 */

import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
  label?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, helperText, label, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const helperTextId = helperText ? `${inputId}-helper` : undefined

    const inputClasses = [
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
      'text-sm ring-offset-background file:border-0 file:bg-transparent',
      'file:text-sm file:font-medium placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-all duration-200 ease-in-out',
      error ? 'border-destructive focus-visible:ring-destructive' : '',
      className
    ].join(' ')

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={inputClasses}
          ref={ref}
          aria-describedby={helperTextId}
          aria-invalid={error}
          {...props}
        />
        {helperText && (
          <p 
            id={helperTextId}
            className={`text-sm ${error ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'