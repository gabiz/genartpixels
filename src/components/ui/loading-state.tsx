'use client'

/**
 * Comprehensive loading state components with consistent design
 */

import React from 'react'
import { LoadingSpinner } from './loading-spinner'
import { Card } from './card'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showSpinner?: boolean
}

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  className = '',
  showSpinner = true
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {showSpinner && <LoadingSpinner size={size} className="mb-4" />}
      <p className="text-muted-foreground text-center">{message}</p>
    </div>
  )
}

/**
 * Loading skeleton for frame cards
 */
export function FrameCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="animate-pulse">
        {/* Frame preview skeleton */}
        <div className="aspect-square bg-muted rounded-lg mb-3" />
        
        {/* Title skeleton */}
        <div className="h-4 bg-muted rounded mb-2" />
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        
        {/* Stats skeleton */}
        <div className="flex justify-between">
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-12" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Loading skeleton for frame grid
 */
export function FrameGridSkeleton({ count = 6, className = '' }: { count?: number, className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <FrameCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Loading skeleton for canvas
 */
export function CanvasSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="aspect-square bg-muted rounded-lg" />
    </div>
  )
}

/**
 * Loading skeleton for user profile
 */
export function UserProfileSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-muted rounded-full" />
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-32" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <div className="h-8 bg-muted rounded w-16 mx-auto" />
            <div className="h-4 bg-muted rounded w-20 mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Frames grid skeleton */}
      <FrameGridSkeleton count={4} />
    </div>
  )
}

/**
 * Inline loading component for buttons and small areas
 */
export function InlineLoading({ 
  message = 'Loading...', 
  className = '' 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LoadingSpinner size="sm" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  )
}

/**
 * Full page loading component
 */
export function PageLoading({ 
  message = 'Loading page...', 
  className = '' 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <LoadingState message={message} size="lg" />
    </div>
  )
}

/**
 * Loading overlay for existing content
 */
export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  children,
  className = ''
}: { 
  isLoading: boolean
  message?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <LoadingState message={message} />
        </div>
      )}
    </div>
  )
}

/**
 * Hook for managing loading states
 */
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState)
  const [loadingMessage, setLoadingMessage] = React.useState<string>()
  
  const startLoading = React.useCallback((message?: string) => {
    setIsLoading(true)
    setLoadingMessage(message)
  }, [])
  
  const stopLoading = React.useCallback(() => {
    setIsLoading(false)
    setLoadingMessage(undefined)
  }, [])
  
  const withLoading = React.useCallback(async <T>(
    fn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(message)
    try {
      return await fn()
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])
  
  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  }
}