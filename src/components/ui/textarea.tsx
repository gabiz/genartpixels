'use client'

/**
 * Textarea component with consistent styling and accessibility features
 */

import React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  helperText?: string
  label?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error = false, helperText, label, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const helperTextId = helperText ? `${textareaId}-helper` : undefined

    const textareaClasses = [
      'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2',
      'text-sm ring-offset-background placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-all duration-200 ease-in-out resize-vertical',
      error ? 'border-destructive focus-visible:ring-destructive' : '',
      className
    ].join(' ')

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={textareaId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={textareaClasses}
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

Textarea.displayName = 'Textarea'