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

    // Listen for global connection state changes
    supabase.realtime.onOpen(() => {
      this.updateConnectionState({
        isConnected: true,
        isReconnecting: false,
        reconnectAttempts: 0
      })
    })

    supabase.realtime.onClose(() => {
      this.updateConnectionState({
        isConnected: false,
        isReconnecting: false
      })
      this.handleConnectionLoss()
    })

    supabase.realtime.onError((error) => {
      console.error('Realtime connection error:', error)
      this.updateConnectionState({
        isConnected: false,
        lastError: error instanceof Error ? error : new Error(String(error))
      })
    })
  }

  /**
   * Subscribe to real-time events for a specific frame
   */
  subscribeToFrame(frameId: string, callback: (event: FrameEvent) => void): void {
    // Unsubscribe from existing channel if present
    this.unsubscribeFromFrame(frameId)

    const channelName = `frame:${frameId}`
    
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'frame_event' }, ({ payload }) => {
        try {
          const frameEvent = this.validateFrameEvent(payload)
          callback(frameEvent)
        } catch (error) {
          console.error('Invalid frame event received:', error, payload)
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pixels',
        filter: `frame_id=eq.${frameId}`
      }, (payload) => {
        const pixel = payload.new as Pixel
        callback({ type: 'pixel', data: pixel })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'frames',
        filter: `id=eq.${frameId}`
      }, (payload) => {
        const frame = payload.new as Record<string, unknown>
        const oldFrame = payload.old as Record<string, unknown>
        
        // Check what changed and emit appropriate events
        if (frame.is_frozen !== oldFrame.is_frozen) {
          callback({
            type: 'freeze',
            frameId,
            isFrozen: frame.is_frozen
          })
        }
        
        if (frame.title !== oldFrame.title) {
          callback({
            type: 'updateTitle',
            frameId,
            title: frame.title
          })
        }
        
        if (frame.permissions !== oldFrame.permissions) {
          callback({
            type: 'updatePermissions',
            frameId,
            permissions: frame.permissions as FramePermissionType
          })
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'frames',
        filter: `id=eq.${frameId}`
      }, () => {
        callback({ type: 'delete', frameId })
      })

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to frame ${frameId}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Failed to subscribe to frame ${frameId}`)
        this.handleChannelError(frameId)
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

// Singleton instance for global use
export const realtimeManager = new RealtimeManager()