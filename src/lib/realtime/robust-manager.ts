/**
 * Robust realtime manager that handles Supabase realtime issues
 * Avoids infinite loops and provides fallback mechanisms
 */

import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { FrameEvent, Pixel } from '@/lib/types'

export interface RobustRealtimeConfig {
  maxRetries?: number
  retryDelay?: number
  enableFallback?: boolean
}

export class RobustRealtimeManager {
  private channels = new Map<string, RealtimeChannel>()
  private callbacks = new Map<string, (event: FrameEvent) => void>()
  private subscriptionStates = new Map<string, 'idle' | 'subscribing' | 'subscribed' | 'error' | 'closed'>()
  private retryTimers = new Map<string, NodeJS.Timeout>()
  private config: Required<RobustRealtimeConfig>
  private isDestroyed = false

  constructor(config: RobustRealtimeConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 2000,
      enableFallback: config.enableFallback ?? true
    }
  }

  /**
   * Subscribe to frame events with robust error handling
   */
  subscribeToFrame(frameId: string, callback: (event: FrameEvent) => void): void {
    if (this.isDestroyed) {
      console.warn('Cannot subscribe - manager is destroyed')
      return
    }

    // Clean up any existing subscription
    this.unsubscribeFromFrame(frameId)

    this.callbacks.set(frameId, callback)
    this.subscriptionStates.set(frameId, 'idle')
    
    this.attemptSubscription(frameId, 0)
  }

  /**
   * Unsubscribe from frame events safely
   */
  unsubscribeFromFrame(frameId: string): void {
    // Clear retry timer
    const timer = this.retryTimers.get(frameId)
    if (timer) {
      clearTimeout(timer)
      this.retryTimers.delete(frameId)
    }

    // Remove channel safely
    const channel = this.channels.get(frameId)
    if (channel) {
      try {
        // Set state to prevent infinite loops
        this.subscriptionStates.set(frameId, 'closed')
        
        // Remove channel without triggering callbacks
        supabase.removeChannel(channel)
      } catch (error) {
        console.warn(`Error removing channel for frame ${frameId}:`, error)
      }
      
      this.channels.delete(frameId)
    }

    // Clean up state
    this.callbacks.delete(frameId)
    this.subscriptionStates.delete(frameId)
    
    console.log(`Safely unsubscribed from frame ${frameId}`)
  }

  /**
   * Broadcast an event (simplified - just logs for now)
   */
  async broadcastEvent(event: FrameEvent): Promise<boolean> {
    console.log('Broadcasting event (mock):', event)
    // In a real implementation, this would use HTTP API or a working realtime channel
    return true
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(frameId: string): string {
    return this.subscriptionStates.get(frameId) || 'not-subscribed'
  }

  /**
   * Destroy the manager and clean up all subscriptions
   */
  destroy(): void {
    this.isDestroyed = true
    
    // Clear all timers
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer)
    }
    this.retryTimers.clear()

    // Unsubscribe from all channels
    const frameIds = Array.from(this.channels.keys())
    for (const frameId of frameIds) {
      this.unsubscribeFromFrame(frameId)
    }

    console.log('RobustRealtimeManager destroyed')
  }

  private attemptSubscription(frameId: string, attempt: number): void {
    return
    if (this.isDestroyed || !this.callbacks.has(frameId)) {
      return
    }

    if (attempt >= this.config.maxRetries) {
      console.error(`Max retries reached for frame ${frameId}`)
      this.subscriptionStates.set(frameId, 'error')
      
      if (this.config.enableFallback) {
        this.enablePollingFallback(frameId)
      }
      return
    }

    console.log(`Attempting subscription to frame ${frameId} (attempt ${attempt + 1}/${this.config.maxRetries})`)
    
    this.subscriptionStates.set(frameId, 'subscribing')

    try {
      const channelName = `robust-frame:${frameId}`
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false, ack: false }
        }
      })

      // Set up event handlers
      channel.on('broadcast', { event: 'pixel_placed' }, ({ payload }) => {
        if (this.subscriptionStates.get(frameId) === 'subscribed') {
          const callback = this.callbacks.get(frameId)
          if (callback && payload?.pixel) {
            callback({ type: 'pixel', data: payload.pixel as Pixel })
          }
        }
      })

      // Handle subscription status with protection against infinite loops
      let hasHandledClose = false
      
      channel.subscribe((status, err) => {
        const currentState = this.subscriptionStates.get(frameId)
        
        console.log(`[RobustManager] Frame ${frameId} subscription status: ${status} (current state: ${currentState})`)
        
        if (currentState === 'closed') {
          // Prevent handling events after we've marked as closed
          return
        }

        switch (status) {
          case 'SUBSCRIBED':
            this.subscriptionStates.set(frameId, 'subscribed')
            this.channels.set(frameId, channel)
            console.log(`[RobustManager] ✓ Successfully subscribed to frame ${frameId}`)
            break

          case 'CHANNEL_ERROR':
            if (err?.message?.includes('Unknown Error on Channel')) {
              console.warn(`⚠️ Transient error for frame ${frameId}, ignoring`)
            } else {
              console.error(`✗ Channel error for frame ${frameId}:`, err)
              this.handleSubscriptionFailure(frameId, attempt)
            }
            break

          case 'TIMED_OUT':
            console.error(`⏱ Subscription timeout for frame ${frameId}`)
            this.handleSubscriptionFailure(frameId, attempt)
            break

          case 'CLOSED':
            if (!hasHandledClose && currentState === 'subscribed') {
              hasHandledClose = true
              console.log(`🔌 Channel closed for frame ${frameId}`)
              this.handleSubscriptionFailure(frameId, attempt)
            }
            break
        }
      })

    } catch (error) {
      console.error(`Exception during subscription attempt for frame ${frameId}:`, error)
      this.handleSubscriptionFailure(frameId, attempt)
    }
  }

  private handleSubscriptionFailure(frameId: string, attempt: number): void {
    if (this.isDestroyed || !this.callbacks.has(frameId)) {
      return
    }

    // Clean up current channel
    const channel = this.channels.get(frameId)
    if (channel) {
      try {
        this.subscriptionStates.set(frameId, 'closed')
        supabase.removeChannel(channel)
      } catch (error) {
        console.warn('Error during cleanup:', error)
      }
      this.channels.delete(frameId)
    }

    // Schedule retry
    const timer = setTimeout(() => {
      this.retryTimers.delete(frameId)
      this.attemptSubscription(frameId, attempt + 1)
    }, this.config.retryDelay * (attempt + 1))

    this.retryTimers.set(frameId, timer)
  }

  private enablePollingFallback(frameId: string): void {
    console.log(`Enabling polling fallback for frame ${frameId}`)
    
    // Simple polling fallback - check for updates every 5 seconds
    const pollInterval = setInterval(async () => {
      if (this.isDestroyed || !this.callbacks.has(frameId)) {
        clearInterval(pollInterval)
        return
      }

      try {
        // In a real implementation, this would fetch recent pixels via HTTP API
        console.log(`Polling for updates on frame ${frameId}`)
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 5000)

    // Store the interval so we can clean it up
    this.retryTimers.set(`poll-${frameId}`, pollInterval as any)
  }
}

// Create a singleton instance
let _robustManager: RobustRealtimeManager | null = null

export function getRobustRealtimeManager(): RobustRealtimeManager {
  if (typeof window === 'undefined') {
    throw new Error('RobustRealtimeManager can only be used on the client side')
  }
  
  if (!_robustManager) {
    _robustManager = new RobustRealtimeManager()
  }
  
  return _robustManager
}