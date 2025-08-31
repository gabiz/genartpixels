/**
 * Real-time collaboration manager for Gen Art Pixels
 * Handles Supabase Realtime subscriptions for frame-specific channels
 */

import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { FrameEvent, Pixel, FramePermissionType } from '@/lib/types'

export interface RealtimeManagerConfig {
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number
  /** Delay between reconnection attempts in milliseconds */
  reconnectDelay?: number
  /** Timeout for connection attempts in milliseconds */
  connectionTimeout?: number
}

export interface ConnectionState {
  isConnected: boolean
  isReconnecting: boolean
  reconnectAttempts: number
  lastError?: Error
}

export class RealtimeManager {
  private channels = new Map<string, RealtimeChannel>()
  private callbacks = new Map<string, (event: FrameEvent) => void>()
  private connectionState: ConnectionState = {
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0
  }
  private config: Required<RealtimeManagerConfig>
  private reconnectTimer?: NodeJS.Timeout
  private connectionListeners = new Set<(state: ConnectionState) => void>()

  constructor(config: RealtimeManagerConfig = {}) {
    this.config = {
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 2000,
      connectionTimeout: config.connectionTimeout ?? 10000
    }

    // Initialize connection state as connected since we'll handle connection state per channel
    this.updateConnectionState({
      isConnected: true,
      isReconnecting: false,
      reconnectAttempts: 0
    })
  }

  /**
   * Subscribe to real-time events for a specific frame
   */
  subscribeToFrame(frameId: string, callback: (event: FrameEvent) => void): void {
    // Unsubscribe from existing channel if present
    this.unsubscribeFromFrame(frameId)

    const channelName = `frame:${frameId}`
    
    console.log(`Creating realtime channel: ${channelName}`)
    
    // For now, only use broadcast events to avoid postgres_changes issues
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: true }
        }
      })
      .on('broadcast', { event: 'frame_event' }, ({ payload }) => {
        try {
          console.log('Received broadcast event:', payload)
          const frameEvent = this.validateFrameEvent(payload)
          callback(frameEvent)
        } catch (error) {
          console.error('Invalid frame event received:', error, payload)
        }
      })
      .on('broadcast', { event: 'pixel_placed' }, ({ payload }) => {
        try {
          console.log('Received pixel placed event:', payload)
          if (payload && typeof payload === 'object' && 'pixel' in payload) {
            callback({ type: 'pixel', data: payload.pixel as Pixel })
          }
        } catch (error) {
          console.error('Invalid pixel event received:', error, payload)
        }
      })

    // Subscribe to the channel with simplified error handling
    channel.subscribe((status, err) => {
      console.log(`Realtime subscription status for frame ${frameId}:`, status)
      if (err) {
        console.error(`Realtime subscription error for frame ${frameId}:`, err)
      }
      
      switch (status) {
        case 'SUBSCRIBED':
          console.log(`✓ Successfully subscribed to frame ${frameId}`)
          this.updateConnectionState({
            isConnected: true,
            isReconnecting: false,
            reconnectAttempts: 0
          })
          break
          
        case 'CHANNEL_ERROR':
          // Check if this is the common "Unknown Error on Channel" that often resolves itself
          const errorMessage = err?.message || 'Unknown error'
          if (errorMessage.includes('Unknown Error on Channel')) {
            console.warn(`⚠️ Transient channel error for frame ${frameId} (often resolves automatically)`)
            // Don't update connection state as disconnected for this specific error
          } else {
            console.error(`✗ Channel error for frame ${frameId}:`, errorMessage)
            this.updateConnectionState({
              isConnected: false,
              lastError: new Error(`Channel error for frame ${frameId}: ${errorMessage}`)
            })
          }
          break
          
        case 'TIMED_OUT':
          console.error(`⏱ Subscription timed out for frame ${frameId}`)
          this.updateConnectionState({
            isConnected: false,
            lastError: new Error(`Subscription timeout for frame ${frameId}`)
          })
          break
          
        case 'CLOSED':
          console.log(`🔌 Channel closed for frame ${frameId}`)
          this.updateConnectionState({
            isConnected: false
          })
          break
          
        default:
          console.log(`Realtime status: ${status}`)
      }
    })

    this.channels.set(frameId, channel)
    this.callbacks.set(frameId, callback)
  }

  /**
   * Unsubscribe from real-time events for a specific frame
   */
  unsubscribeFromFrame(frameId: string): void {
    const channel = this.channels.get(frameId)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(frameId)
      this.callbacks.delete(frameId)
      console.log(`Unsubscribed from frame ${frameId}`)
    }
  }

  /**
   * Broadcast a frame event to all subscribers
   */
  async broadcastFrameEvent(event: FrameEvent): Promise<RealtimeChannelSendResponse> {
    const frameId = this.extractFrameId(event)
    const channel = this.channels.get(frameId)
    
    if (!channel) {
      throw new Error(`No active subscription for frame ${frameId}`)
    }

    return channel.send({
      type: 'broadcast',
      event: 'frame_event',
      payload: event
    })
  }

  /**
   * Handle connection loss and attempt reconnection
   */
  handleConnectionLoss(): void {
    if (this.connectionState.isReconnecting) {
      return // Already attempting to reconnect
    }

    this.updateConnectionState({
      isReconnecting: true,
      reconnectAttempts: 0
    })

    this.attemptReconnection()
  }

  /**
   * Manually trigger reconnection
   */
  reconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    this.updateConnectionState({
      isReconnecting: true,
      reconnectAttempts: 0
    })

    this.attemptReconnection()
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  /**
   * Add listener for connection state changes
   */
  onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
    this.connectionListeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.connectionListeners.delete(listener)
    }
  }

  /**
   * Clean up all subscriptions and timers
   */
  destroy(): void {
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    // Unsubscribe from all channels
    for (const frameId of this.channels.keys()) {
      this.unsubscribeFromFrame(frameId)
    }

    // Clear listeners
    this.connectionListeners.clear()
  }

  private attemptReconnection(): void {
    if (this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.updateConnectionState({
        isReconnecting: false,
        lastError: new Error('Max reconnection attempts reached')
      })
      return
    }

    const attempt = this.connectionState.reconnectAttempts + 1
    console.log(`Attempting reconnection ${attempt}/${this.config.maxReconnectAttempts}`)

    this.updateConnectionState({
      reconnectAttempts: attempt
    })

    // Resubscribe to all active channels
    const activeSubscriptions = Array.from(this.callbacks.entries())
    
    // Clear existing channels
    for (const [frameId] of this.channels) {
      this.unsubscribeFromFrame(frameId)
    }

    // Resubscribe with delay
    this.reconnectTimer = setTimeout(() => {
      for (const [frameId, callback] of activeSubscriptions) {
        this.subscribeToFrame(frameId, callback)
      }

      // Check if reconnection was successful after a short delay
      setTimeout(() => {
        if (!this.connectionState.isConnected) {
          this.attemptReconnection()
        } else {
          this.updateConnectionState({
            isReconnecting: false,
            reconnectAttempts: 0
          })
        }
      }, 1000)
    }, this.config.reconnectDelay * attempt) // Exponential backoff
  }

  private handleChannelError(frameId: string): void {
    console.error(`Channel error for frame ${frameId}`)
    
    // Attempt to resubscribe to this specific channel
    const callback = this.callbacks.get(frameId)
    if (callback) {
      setTimeout(() => {
        this.subscribeToFrame(frameId, callback)
      }, this.config.reconnectDelay)
    }
  }

  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates }
    
    // Notify all listeners
    for (const listener of this.connectionListeners) {
      try {
        listener(this.getConnectionState())
      } catch (error) {
        console.error('Error in connection state listener:', error)
      }
    }
  }

  private validateFrameEvent(payload: Record<string, unknown>): FrameEvent {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: must be an object')
    }

    const { type } = payload

    switch (type) {
      case 'pixel':
        if (!payload.data || typeof payload.data !== 'object') {
          throw new Error('Invalid pixel event: missing data')
        }
        return { type: 'pixel', data: payload.data as Pixel }

      case 'freeze':
        if (typeof payload.frameId !== 'string' || typeof payload.isFrozen !== 'boolean') {
          throw new Error('Invalid freeze event: missing frameId or isFrozen')
        }
        return { type: 'freeze', frameId: payload.frameId, isFrozen: payload.isFrozen }

      case 'updateTitle':
        if (typeof payload.frameId !== 'string' || typeof payload.title !== 'string') {
          throw new Error('Invalid updateTitle event: missing frameId or title')
        }
        return { type: 'updateTitle', frameId: payload.frameId, title: payload.title }

      case 'updatePermissions':
        if (typeof payload.frameId !== 'string' || typeof payload.permissions !== 'string') {
          throw new Error('Invalid updatePermissions event: missing frameId or permissions')
        }
        return { type: 'updatePermissions', frameId: payload.frameId, permissions: payload.permissions as FramePermissionType }

      case 'delete':
        if (typeof payload.frameId !== 'string') {
          throw new Error('Invalid delete event: missing frameId')
        }
        return { type: 'delete', frameId: payload.frameId }

      default:
        throw new Error(`Unknown event type: ${type}`)
    }
  }

  private extractFrameId(event: FrameEvent): string {
    switch (event.type) {
      case 'pixel':
        return event.data.frame_id
      case 'freeze':
      case 'updateTitle':
      case 'updatePermissions':
      case 'delete':
        return event.frameId
      default:
        throw new Error('Unknown event type')
    }
  }
}

// Singleton instance for global use (lazy-loaded)
let _realtimeManager: RealtimeManager | null = null

export function getRealtimeManager(): RealtimeManager {
  if (typeof window === 'undefined') {
    throw new Error('RealtimeManager can only be used on the client side')
  }
  
  if (!_realtimeManager) {
    _realtimeManager = new RealtimeManager()
  }
  
  return _realtimeManager
}

// Legacy export for backward compatibility
export const realtimeManager = {
  get instance() {
    return getRealtimeManager()
  },
  subscribeToFrame: (frameId: string, callback: (event: FrameEvent) => void) => 
    getRealtimeManager().subscribeToFrame(frameId, callback),
  unsubscribeFromFrame: (frameId: string) => 
    getRealtimeManager().unsubscribeFromFrame(frameId),
  broadcastFrameEvent: (event: FrameEvent) => 
    getRealtimeManager().broadcastFrameEvent(event),
  getConnectionState: () => 
    getRealtimeManager().getConnectionState(),
  onConnectionStateChange: (listener: (state: ConnectionState) => void) => 
    getRealtimeManager().onConnectionStateChange(listener),
  reconnect: () => 
    getRealtimeManager().reconnect(),
  destroy: () => 
    getRealtimeManager().destroy()
}