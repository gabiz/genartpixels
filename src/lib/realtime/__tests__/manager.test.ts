/**
 * Unit tests for RealtimeManager
 */

import { RealtimeManager } from '../manager'
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
    removeChannel: jest.fn(),
    realtime: {
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onError: jest.fn()
    }
  }
}))

// Import the mocked supabase after mocking
import { supabase } from '@/lib/supabase/client'
const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('RealtimeManager', () => {
  let manager: RealtimeManager
  let mockCallback: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new RealtimeManager({
      maxReconnectAttempts: 3,
      reconnectDelay: 100,
      connectionTimeout: 1000
    })
    mockCallback = jest.fn()
  })

  afterEach(() => {
    manager.destroy()
  })

  describe('subscribeToFrame', () => {
    it('should create a channel and subscribe to frame events', () => {
      const frameId = 'test-frame-id'
      
      manager.subscribeToFrame(frameId, mockCallback)

      expect(mockSupabase.channel).toHaveBeenCalledWith(`frame:${frameId}`)
      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'frame_event' },
        expect.any(Function)
      )
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pixels',
          filter: `frame_id=eq.${frameId}`
        },
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })

    it('should unsubscribe from existing channel before subscribing to new one', () => {
      const frameId = 'test-frame-id'
      
      // Subscribe first time
      manager.subscribeToFrame(frameId, mockCallback)
      
      // Subscribe again
      manager.subscribeToFrame(frameId, mockCallback)

      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(1)
      expect(mockSupabase.channel).toHaveBeenCalledTimes(2)
    })
  })

  describe('unsubscribeFromFrame', () => {
    it('should remove channel and clean up subscriptions', () => {
      const frameId = 'test-frame-id'
      
      manager.subscribeToFrame(frameId, mockCallback)
      manager.unsubscribeFromFrame(frameId)

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })

    it('should handle unsubscribing from non-existent frame gracefully', () => {
      expect(() => {
        manager.unsubscribeFromFrame('non-existent-frame')
      }).not.toThrow()
    })
  })

  describe('broadcastFrameEvent', () => {
    it('should broadcast pixel event to subscribed channel', async () => {
      const frameId = 'test-frame-id'
      const pixelEvent: FrameEvent = {
        type: 'pixel',
        data: {
          id: 'pixel-id',
          frame_id: frameId,
          x: 10,
          y: 20,
          color: 0xFF0000,
          contributor_handle: 'test-user',
          placed_at: new Date().toISOString()
        } as Pixel
      }

      mockChannel.send.mockResolvedValue({ status: 'ok' })
      
      manager.subscribeToFrame(frameId, mockCallback)
      const result = await manager.broadcastFrameEvent(pixelEvent)

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'frame_event',
        payload: pixelEvent
      })
      expect(result.status).toBe('ok')
    })

    it('should throw error when broadcasting to non-subscribed frame', async () => {
      const pixelEvent: FrameEvent = {
        type: 'pixel',
        data: {
          frame_id: 'non-existent-frame'
        } as Pixel
      }

      await expect(manager.broadcastFrameEvent(pixelEvent)).rejects.toThrow(
        'No active subscription for frame non-existent-frame'
      )
    })
  })

  describe('connection state management', () => {
    it('should initialize with disconnected state', () => {
      const state = manager.getConnectionState()
      expect(state.isConnected).toBe(false)
      expect(state.isReconnecting).toBe(false)
      expect(state.reconnectAttempts).toBe(0)
    })

    it('should notify listeners of connection state changes', () => {
      const listener = jest.fn()
      const unsubscribe = manager.onConnectionStateChange(listener)

      // Simulate connection open
      const onOpenCallback = mockSupabase.realtime.onOpen.mock.calls[0][0]
      onOpenCallback()

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isConnected: true,
          isReconnecting: false,
          reconnectAttempts: 0
        })
      )

      unsubscribe()
    })

    it('should handle connection errors', () => {
      const listener = jest.fn()
      manager.onConnectionStateChange(listener)

      const error = new Error('Connection failed')
      const onErrorCallback = mockSupabase.realtime.onError.mock.calls[0][0]
      onErrorCallback(error)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isConnected: false,
          lastError: error
        })
      )
    })
  })

  describe('event validation', () => {
    it('should validate pixel events correctly', () => {
      const frameId = 'test-frame-id'
      manager.subscribeToFrame(frameId, mockCallback)

      const broadcastCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'broadcast'
      )?.[2]

      const validPixelPayload = {
        type: 'pixel',
        data: {
          id: 'pixel-id',
          frame_id: frameId,
          x: 10,
          y: 20,
          color: 0xFF0000,
          contributor_handle: 'test-user',
          placed_at: new Date().toISOString()
        }
      }

      broadcastCallback({ payload: validPixelPayload })
      expect(mockCallback).toHaveBeenCalledWith(validPixelPayload)
    })

    it('should validate freeze events correctly', () => {
      const frameId = 'test-frame-id'
      manager.subscribeToFrame(frameId, mockCallback)

      const broadcastCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'broadcast'
      )?.[2]

      const validFreezePayload = {
        type: 'freeze',
        frameId,
        isFrozen: true
      }

      broadcastCallback({ payload: validFreezePayload })
      expect(mockCallback).toHaveBeenCalledWith(validFreezePayload)
    })

    it('should reject invalid events', () => {
      const frameId = 'test-frame-id'
      manager.subscribeToFrame(frameId, mockCallback)

      const broadcastCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'broadcast'
      )?.[2]

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Invalid event - missing required fields
      const invalidPayload = {
        type: 'pixel'
        // missing data field
      }

      broadcastCallback({ payload: invalidPayload })
      
      expect(mockCallback).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid frame event received:',
        expect.any(Error),
        invalidPayload
      )

      consoleSpy.mockRestore()
    })
  })

  describe('reconnection logic', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should attempt reconnection on connection loss', () => {
      const frameId = 'test-frame-id'
      manager.subscribeToFrame(frameId, mockCallback)

      // Simulate connection loss
      const onCloseCallback = mockSupabase.realtime.onClose.mock.calls[0][0]
      onCloseCallback()

      expect(manager.getConnectionState().isReconnecting).toBe(true)
    })

    it('should stop reconnecting after max attempts', () => {
      const listener = jest.fn()
      manager.onConnectionStateChange(listener)

      // Trigger reconnection
      manager.handleConnectionLoss()

      // Fast-forward through all reconnection attempts
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(1000 * (i + 1)) // Exponential backoff
      }

      const finalState = manager.getConnectionState()
      expect(finalState.isReconnecting).toBe(false)
      expect(finalState.reconnectAttempts).toBe(3)
      expect(finalState.lastError?.message).toBe('Max reconnection attempts reached')
    })
  })

  describe('cleanup', () => {
    it('should clean up all subscriptions and timers on destroy', () => {
      const frameId1 = 'frame-1'
      const frameId2 = 'frame-2'
      
      manager.subscribeToFrame(frameId1, mockCallback)
      manager.subscribeToFrame(frameId2, mockCallback)

      manager.destroy()

      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(2)
    })
  })
})