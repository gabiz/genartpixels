'use client'

/**
 * Offline indicator component that shows connection status
 */

import React from 'react'
import { useOfflineDetection } from '@/lib/realtime'
import { Alert, AlertDescription } from './alert'

interface OfflineIndicatorProps {
  className?: string
  showWhenOnline?: boolean
}

export function OfflineIndicator({ 
  className = '', 
  showWhenOnline = false 
}: OfflineIndicatorProps) {
  const { isOnline, isConnected } = useOfflineDetection()

  // Don't show anything if online and showWhenOnline is false
  if (isOnline && isConnected && !showWhenOnline) {
    return null
  }

  // Determine status and styling
  const getStatus = () => {
    if (!isOnline) {
      return {
        variant: 'destructive' as const,
        message: 'You are offline. Some features may not work.',
        icon: '🔴'
      }
    }
    
    if (!isConnected) {
      return {
        variant: 'warning' as const,
        message: 'Connection issues detected. Trying to reconnect...',
        icon: '🟡'
      }
    }
    
    return {
      variant: 'success' as const,
      message: 'Connected',
      icon: '🟢'
    }
  }

  const status = getStatus()

  return (
    <Alert 
      variant={status.variant} 
      className={`${className} transition-all duration-300`}
    >
      <AlertDescription className="flex items-center gap-2">
        <span className="text-sm" role="img" aria-label="Connection status">
          {status.icon}
        </span>
        <span className="text-sm font-medium">
          {status.message}
        </span>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Compact offline indicator for use in headers/toolbars
 */
export function CompactOfflineIndicator({ className = '' }: { className?: string }) {
  const { isOnline, isConnected } = useOfflineDetection()

  if (isOnline && isConnected) {
    return null
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500'
    if (!isConnected) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (!isConnected) return 'Connecting...'
    return 'Online'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${getStatusColor()}`}
        aria-label="Connection status indicator"
      />
      <span className="text-xs text-muted-foreground">
        {getStatusText()}
      </span>
    </div>
  )
}