/**
 * Unit tests for RobustRealtimeManager
 */

import { RobustRealtimeManager } from '../robust-manager'
import { FrameEvent, Pixel } from '@/lib/types'

// Mock Supabase client
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(),
  send: jest.fn(),
  unsubscribe: jest.fn()
}

// Mock the supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn()
  }
}))

// Import the mocked supabase after mocking
import { supabase } from '@/lib/supabase/client'
const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('RobustRealtimeManager', () => {
  let manager: RobustRealtimeManager
  let mockCallback: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new RobustRealtimeManager({
      maxRetries: 2,
      retryDelay: 100,
      enableFallback: true
    })
    mockCallback = jest.fn()
  })

  afterEach(() => {
    manager.destroy()
  })

  describe('subscribeToFrame', () => {
    it('should create a channel and attempt subscription', () => {
      const frameId = 'test-frame-id'
      
      manager.subscribeToFrame(frameId, mockCallback)

      expect(mockSupabase.channel).toHaveBeenCalledWith(
        `robust-frame:${frameId}`,
        expect.objectContaining({
          config: {
            broadcast: { self: false, ack: false }
          }
        })
      )
      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'pixel_placed' },
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })

    it('should track subscription state', () => {
      const frameId = 'test-frame-id'
      
      manager.subscribeToFrame(frameId, mockCallback)
      
      const status = manager.getSubscriptionStatus(frameId)
      expect(status).toBe('subscribing')
    })

    it('should clean up existing subscription before creating new one', () => {
      const frameId = 'test-frame-id'
      
      // Subscribe first time
      manager.subscribeToFrame(frameId, mockCallback)
      
      // Subscribe again
      manager.subscribeToFrame(frameId, mockCallback)

      // Should have been called twice (once for each subscription attempt)
      expect(mockSupabase.channel).toHaveBeenCalledTimes(2)
    })
  })

  describe('unsubscribeFromFrame', () => {
    it('should safely remove channel and clean up state', () => {
      const frameId = 'test-frame-id'
      
      manager.subscribeToFrame(frameId, mockCallback)
      manager.unsubscribeFromFrame(frameId)

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
      
      const status = manager.getSubscriptionStatus(frameId)
      expect(status).toBe('not-subscribed')
    })

    it('should handle unsubscribing from non-existent frame gracefully', () => {
      expect(() => {
        manager.unsubscribeFromFrame('non-existent-frame')
      }).not.toThrow()
    })
  })

  describe('broadcastEvent', () => {
    it('should return true for mock broadcast', async () => {
      const pixelEvent: FrameEvent = {
        type: 'pixel',
        data: {
          id: 'pixel-id',
          frame_id: 'frame-id',
          x: 10,
          y: 20,
          color: 0xFF0000,
          contributor_handle: 'test-user',
          placed_at: new Date().toISOString()
        } as Pixel
      }

      const result = await manager.broadcastEvent(pixelEvent)
      expect(result).toBe(true)
    })
  })

  describe('subscription status management', () => {
    it('should track subscription states correctly', () => {
      const frameId = 'test-frame-id'
      
      // Initially not subscribed
      expect(manager.getSubscriptionStatus(frameId)).toBe('not-subscribed')
      
      // After subscribing, should be in subscribing state
      manager.subscribeToFrame(frameId, mockCallback)
      expect(manager.getSubscriptionStatus(frameId)).toBe('subscribing')
    })
  })

  describe('event handling', () => {
    it('should handle pixel events correctly', () => {
      const frameId = 'test-frame-id'
      manager.subscribeToFrame(frameId, mockCallback)

      // Get the pixel event handler
      const pixelEventHandler = mockChannel.on.mock.calls.find(
        call => call[0] === 'broadcast' && call[1].event === 'pixel_placed'
      )?.[2]

      expect(pixelEventHandler).toBeDefined()

      const mockPixelPayload = {
        pixel: {
          id: 'pixel-id',
          frame_id: frameId,
          x: 10,
          y: 20,
          color: 0xFF0000,
          contributor_handle: 'test-user',
          placed_at: new Date().toISOString()
        }
      }

      // Simulate receiving a pixel event
      pixelEventHandler({ payload: mockPixelPayload })

      expect(mockCallback).toHaveBeenCalledWith({
        type: 'pixel',
        data: mockPixelPayload.pixel
      })
    })

    it('should not call callback when subscription is not active', () => {
      const frameId = 'test-frame-id'
      manager.subscribeToFrame(frameId, mockCallback)

      // Unsubscribe
      manager.unsubscribeFromFrame(frameId)

      // Get the pixel event handler
      const pixelEventHandler = mockChannel.on.mock.calls.find(
        call => call[0] === 'broadcast' && call[1].event === 'pixel_placed'
      )?.[2]

      const mockPixelPayload = {
        pixel: {
          id: 'pixel-id',
          frame_id: frameId,
          x: 10,
          y: 20,
          color: 0xFF0000,
          contributor_handle: 'test-user',
          placed_at: new Date().toISOString()
        }
      }

      // Simulate receiving a pixel event after unsubscribe
      pixelEventHandler({ payload: mockPixelPayload })

      // Callback should not be called
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should handle subscription errors gracefully', () => {
      const frameId = 'test-frame-id'
      
      // Subscribe to frame
      manager.subscribeToFrame(frameId, mockCallback)

      // Get the subscription callback
      const subscriptionCallback = mockChannel.subscribe.mock.calls[0][0]

      // Simulate a subscription error
      subscriptionCallback('CHANNEL_ERROR', new Error('Test error'))

      // Should not throw and should handle the error
      expect(manager.getSubscriptionStatus(frameId)).toBe('subscribing')
    })

    it('should ignore transient "Unknown Error on Channel" errors', () => {
      const frameId = 'test-frame-id'
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      manager.subscribeToFrame(frameId, mockCallback)

      const subscriptionCallback = mockChannel.subscribe.mock.calls[0][0]

      // Simulate the common transient error
      subscriptionCallback('CHANNEL_ERROR', new Error('Unknown Error on Channel'))

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Transient error')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('cleanup and destruction', () => {
    it('should clean up all subscriptions on destroy', () => {
      const frameId1 = 'frame-1'
      const frameId2 = 'frame-2'
      
      manager.subscribeToFrame(frameId1, mockCallback)
      manager.subscribeToFrame(frameId2, mockCallback)

      manager.destroy()

      // Should have called removeChannel for each subscription
      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(2)
      
      // Should not be able to subscribe after destroy
      manager.subscribeToFrame('frame-3', mockCallback)
      
      // Should not create new subscriptions after destroy
      expect(manager.getSubscriptionStatus('frame-3')).toBe('not-subscribed')
    })

    it('should prevent operations after destruction', () => {
      const frameId = 'test-frame-id'
      
      manager.destroy()
      
      // Should not create subscriptions after destroy
      manager.subscribeToFrame(frameId, mockCallback)
      expect(manager.getSubscriptionStatus(frameId)).toBe('not-subscribed')
    })
  })

  describe('retry logic', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should retry failed subscriptions', () => {
      const frameId = 'test-frame-id'
      
      manager.subscribeToFrame(frameId, mockCallback)

      // Get the subscription callback
      const subscriptionCallback = mockChannel.subscribe.mock.calls[0][0]

      // Simulate subscription failure
      subscriptionCallback('TIMED_OUT')

      // Fast-forward time to trigger retry
      jest.advanceTimersByTime(200) // retryDelay * 1

      // Should have attempted subscription again
      expect(mockSupabase.channel).toHaveBeenCalledTimes(2)
    })

    it('should stop retrying after max attempts', () => {
      const frameId = 'test-frame-id'
      
      manager.subscribeToFrame(frameId, mockCallback)

      // Simulate multiple failures
      for (let i = 0; i < 3; i++) {
        const subscriptionCallback = mockChannel.subscribe.mock.calls[i][0]
        subscriptionCallback('TIMED_OUT')
        jest.advanceTimersByTime((i + 1) * 100) // Exponential backoff
      }

      // Should have stopped retrying (maxRetries = 2)
      expect(manager.getSubscriptionStatus(frameId)).toBe('error')
    })
  })
})