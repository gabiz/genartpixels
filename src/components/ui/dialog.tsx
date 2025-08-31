'use client'

/**
 * Dialog component with accessibility features and smooth animations
 */

import React, { useEffect, useRef } from 'react'
import { Button } from './button'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const titleId = `dialog-title-${Math.random().toString(36).substr(2, 9)}`
  const descriptionId = `dialog-description-${Math.random().toString(36).substr(2, 9)}`

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      // Focus trap
      contentRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onOpenChange(false)
    }
  }

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div
        ref={contentRef}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-large animate-scale-in"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = [
      'relative bg-background rounded-lg shadow-large',
      className
    ].join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

DialogContent.displayName = 'DialogContent'

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = [
      'flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-4',
      className
    ].join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

DialogHeader.displayName = 'DialogHeader'

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  titleId?: string
}

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className = '', children, titleId, id, ...props }, ref) => {
    const finalId = id || titleId || `dialog-title-${Math.random().toString(36).substr(2, 9)}`
    
    const classes = [
      'text-lg font-semibold leading-none tracking-tight',
      className
    ].join(' ')

    return (
      <h2 ref={ref} id={finalId} className={classes} {...props}>
        {children}
      </h2>
    )
  }
)

DialogTitle.displayName = 'DialogTitle'

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
  descriptionId?: string
}

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className = '', children, descriptionId, id, ...props }, ref) => {
    const finalId = id || descriptionId || `dialog-description-${Math.random().toString(36).substr(2, 9)}`
    
    const classes = [
      'text-sm text-muted-foreground',
      className
    ].join(' ')

    return (
      <p ref={ref} id={finalId} className={classes} {...props}>
        {children}
      </p>
    )
  }
)

DialogDescription.displayName = 'DialogDescription'

export interface DialogBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const DialogBody = React.forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = [
      'px-6 py-4',
      className
    ].join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

DialogBody.displayName = 'DialogBody'

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = [
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4',
      className
    ].join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

DialogFooter.displayName = 'DialogFooter'

export interface DialogCloseProps {
  onClose: () => void
  className?: string
}

export const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ onClose, className = '' }, ref) => {
    const classes = [
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background',
      'transition-opacity hover:opacity-100 focus:outline-none focus:ring-2',
      'focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
      className
    ].join(' ')

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        className={classes}
        onClick={onClose}
        aria-label="Close dialog"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </Button>
    )
  }
)

DialogClose.displayName = 'DialogClose'