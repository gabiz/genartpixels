/**
 * React hooks for real-time collaboration features
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { FrameEvent, Pixel } from '@/lib/types'
import { realtimeManager, ConnectionState } from './manager'

/**
 * Hook for subscribing to real-time frame events
 */
export function useFrameRealtime(frameId: string | null) {
  const [events, setEvents] = useState<FrameEvent[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const callbackRef = useRef<((event: FrameEvent) => void) | null>(null)

  const handleEvent = useCallback((event: FrameEvent) => {
    setEvents(prev => [...prev, event])
    callbackRef.current?.(event)
  }, [])

  const subscribe = useCallback((callback?: (event: FrameEvent) => void) => {
    if (!frameId) return

    callbackRef.current = callback || null
    realtimeManager.subscribeToFrame(frameId, handleEvent)
    setIsSubscribed(true)
  }, [frameId, handleEvent])

  const unsubscribe = useCallback(() => {
    if (!frameId) return

    realtimeManager.unsubscribeFromFrame(frameId)
    setIsSubscribed(false)
    callbackRef.current = null
  }, [frameId])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return {
    events,
    isSubscribed,
    subscribe,
    unsubscribe,
    clearEvents
  }
}

/**
 * Hook for monitoring connection state
 */
export function useRealtimeConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    realtimeManager.getConnectionState()
  )

  useEffect(() => {
    const unsubscribe = realtimeManager.onConnectionStateChange(setConnectionState)
    return unsubscribe
  }, [])

  const reconnect = useCallback(() => {
    realtimeManager.reconnect()
  }, [])

  return {
    ...connectionState,
    reconnect
  }
}

/**
 * Hook for broadcasting frame events
 */
export function useFrameBroadcast() {
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [lastError, setLastError] = useState<Error | null>(null)

  const broadcast = useCallback(async (event: FrameEvent) => {
    setIsBroadcasting(true)
    setLastError(null)

    try {
      const response = await realtimeManager.broadcastFrameEvent(event)
      
      if (response.status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${response.status}`)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setLastError(err)
      console.error('Failed to broadcast frame event:', err)
      throw err
    } finally {
      setIsBroadcasting(false)
    }
  }, [])

  return {
    broadcast,
    isBroadcasting,
    lastError
  }
}

/**
 * Hook for handling pixel updates in real-time
 */
export function usePixelUpdates(frameId: string | null, onPixelUpdate?: (pixel: Pixel) => void) {
  const { subscribe, unsubscribe, isSubscribed } = useFrameRealtime(frameId)

  useEffect(() => {
    if (!frameId) return

    subscribe((event) => {
      if (event.type === 'pixel') {
        onPixelUpdate?.(event.data)
      }
    })

    return unsubscribe
  }, [frameId, subscribe, unsubscribe, onPixelUpdate])

  return { isSubscribed }
}

/**
 * Hook for handling frame state changes in real-time
 */
export function useFrameStateUpdates(
  frameId: string | null,
  callbacks?: {
    onFreeze?: (isFrozen: boolean) => void
    onTitleUpdate?: (title: string) => void
    onPermissionsUpdate?: (permissions: string) => void
    onDelete?: () => void
  }
) {
  const { subscribe, unsubscribe, isSubscribed } = useFrameRealtime(frameId)

  useEffect(() => {
    if (!frameId) return

    subscribe((event) => {
      switch (event.type) {
        case 'freeze':
          callbacks?.onFreeze?.(event.isFrozen)
          break
        case 'updateTitle':
          callbacks?.onTitleUpdate?.(event.title)
          break
        case 'updatePermissions':
          callbacks?.onPermissionsUpdate?.(event.permissions)
          break
        case 'delete':
          callbacks?.onDelete?.()
          break
      }
    })

    return unsubscribe
  }, [frameId, subscribe, unsubscribe, callbacks])

  return { isSubscribed }
}

/**
 * Hook for offline detection and handling
 */
export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const { isConnected, reconnect } = useRealtimeConnection()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      // Attempt to reconnect when coming back online
      if (!isConnected) {
        reconnect()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isConnected, reconnect])

  return {
    isOnline,
    isConnected: isOnline && isConnected
  }
}