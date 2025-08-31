'use client'

/**
 * Card components with consistent styling and accessibility features
 */

import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = [
      'rounded-lg border bg-background text-foreground shadow-soft',
      'transition-all duration-200 ease-in-out',
      className
    ].join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = [
      'flex flex-col space-y-1.5 p-6',
      className
    ].join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => {
    const classes = [
      'text-2xl font-semibold leading-none tracking-tight',
      className
    ].join(' ')

    return (
      <h3 ref={ref} className={classes} {...props}>
        {children}
      </h3>
    )
  }
)

CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', children, ...props }, ref) => {
    const classes = [
      'text-sm text-muted-foreground',
      className
    ].join(' ')

    return (
      <p ref={ref} className={classes} {...props}>
        {children}
      </p>
    )
  }
)

CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = [
      'p-6 pt-0',
      className
    ].join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = [
      'flex items-center p-6 pt-0',
      className
    ].join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'