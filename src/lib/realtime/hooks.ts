/**
 * React hooks for real-time collaboration features
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { FrameEvent, Pixel } from '@/lib/types'
import { getRealtimeManager, ConnectionState } from './manager'

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
    if (!frameId || typeof window === 'undefined') return

    try {
      callbackRef.current = callback || null
      const manager = getRealtimeManager()
      manager.subscribeToFrame(frameId, handleEvent)
      setIsSubscribed(true)
    } catch (error) {
      console.error('Failed to subscribe to realtime:', error)
    }
  }, [frameId, handleEvent])

  const unsubscribe = useCallback(() => {
    if (!frameId || typeof window === 'undefined') return

    try {
      const manager = getRealtimeManager()
      manager.unsubscribeFromFrame(frameId)
      setIsSubscribed(false)
      callbackRef.current = null
    } catch (error) {
      console.error('Failed to unsubscribe from realtime:', error)
    }
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
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const manager = getRealtimeManager()
      setConnectionState(manager.getConnectionState())
      const unsubscribe = manager.onConnectionStateChange(setConnectionState)
      return unsubscribe
    } catch (error) {
      console.error('Failed to initialize realtime connection:', error)
    }
  }, [])

  const reconnect = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const manager = getRealtimeManager()
      manager.reconnect()
    } catch (error) {
      console.error('Failed to reconnect:', error)
    }
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
    if (typeof window === 'undefined') return

    setIsBroadcasting(true)
    setLastError(null)

    try {
      const manager = getRealtimeManager()
      const response = await manager.broadcastFrameEvent(event)
      
      if (response === 'error') {
        throw new Error('Broadcast failed with error')
      }
      
      if (typeof response === 'object' && response !== null && 'status' in response) {
        const statusResponse = response as { status: string }
        if (statusResponse.status !== 'ok') {
          throw new Error(`Broadcast failed with status: ${statusResponse.status}`)
        }
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