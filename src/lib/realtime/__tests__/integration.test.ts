/**
 * Integration tests for real-time collaboration with multiple clients
 */

import { RealtimeManager } from '../manager'
import { FrameEvent, Pixel } from '@/lib/types'

// Mock Supabase for integration testing
const createMockChannel = () => {
  const listeners = new Map<string, ((payload: unknown) => void)[]>()
  
  return {
    on: jest.fn((type: string, config: Record<string, unknown>, callback: (payload: unknown) => void) => {
      const key = typeof config === 'object' ? `${type}:${config.event || 'default'}` : type
      if (!listeners.has(key)) {
        listeners.set(key, [])
      }
      listeners.get(key)!.push(callback)
      return mockChannel
    }),
    subscribe: jest.fn((callback?: (status: string) => void) => {
      setTimeout(() => callback?.('SUBSCRIBED'), 0)
    }),
    send: jest.fn().mockResolvedValue({ status: 'ok' }),
    unsubscribe: jest.fn(),
    // Helper method to simulate events
    _simulateEvent: (type: string, event: string, payload: unknown) => {
      const key = `${type}:${event}`
      const callbacks = listeners.get(key) || []
      callbacks.forEach(callback => callback(payload))
    },
    _simulatePostgresChange: (event: string, table: string, payload: unknown) => {
      const key = `postgres_changes:default`
      const callbacks = listeners.get(key) || []
      callbacks.forEach(callback => {
        // Check if this callback matches the event and table
        callback(payload)
      })
    }
  }
}

const mockChannel = createMockChannel()



jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    channel: jest.fn(() => createMockChannel()),
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

describe('Real-time Collaboration Integration', () => {
  let manager1: RealtimeManager
  let manager2: RealtimeManager
  let frameId: string

  beforeEach(() => {
    jest.clearAllMocks()
    frameId = 'test-frame-123'
    
    manager1 = new RealtimeManager({
      maxReconnectAttempts: 2,
      reconnectDelay: 50
    })
    
    manager2 = new RealtimeManager({
      maxReconnectAttempts: 2,
      reconnectDelay: 50
    })
  })

  afterEach(() => {
    manager1.destroy()
    manager2.destroy()
  })

  describe('Multi-client pixel collaboration', () => {
    it('should broadcast pixel events between multiple clients', async () => {
      const client1Events: FrameEvent[] = []
      const client2Events: FrameEvent[] = []

      // Subscribe both clients to the same frame
      manager1.subscribeToFrame(frameId, (event) => {
        client1Events.push(event)
      })

      manager2.subscribeToFrame(frameId, (event) => {
        client2Events.push(event)
      })

      // Wait for subscriptions to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      // Client 1 places a pixel
      const pixelEvent: FrameEvent = {
        type: 'pixel',
        data: {
          id: 'pixel-1',
          frame_id: frameId,
          x: 10,
          y: 20,
          color: 0xFF0000,
          contributor_handle: 'user1',
          placed_at: new Date().toISOString()
        } as Pixel
      }

      await manager1.broadcastFrameEvent(pixelEvent)

      // Simulate the event being received by both clients
      const channels = mockSupabase.channel.mock.results
      channels.forEach(result => {
        const channel = result.value
        if (channel._simulateEvent) {
          channel._simulateEvent('broadcast', 'frame_event', { payload: pixelEvent })
        }
      })

      expect(client1Events).toContainEqual(pixelEvent)
      expect(client2Events).toContainEqual(pixelEvent)
    })

    it('should handle concurrent pixel placements without conflicts', async () => {
      const client1Events: FrameEvent[] = []
      const client2Events: FrameEvent[] = []

      manager1.subscribeToFrame(frameId, (event) => {
        client1Events.push(event)
      })

      manager2.subscribeToFrame(frameId, (event) => {
        client2Events.push(event)
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      // Simulate concurrent pixel placements
      const pixel1: FrameEvent = {
        type: 'pixel',
        data: {
          id: 'pixel-1',
          frame_id: frameId,
          x: 10,
          y: 20,
          color: 0xFF0000,
          contributor_handle: 'user1',
          placed_at: new Date().toISOString()
        } as Pixel
      }

      const pixel2: FrameEvent = {
        type: 'pixel',
        data: {
          id: 'pixel-2',
          frame_id: frameId,
          x: 11,
          y: 20,
          color: 0x00FF00,
          contributor_handle: 'user2',
          placed_at: new Date().toISOString()
        } as Pixel
      }

      // Broadcast both pixels simultaneously
      await Promise.all([
        manager1.broadcastFrameEvent(pixel1),
        manager2.broadcastFrameEvent(pixel2)
      ])

      // Simulate both events being received
      const channels = mockSupabase.channel.mock.results
      channels.forEach(result => {
        const channel = result.value
        if (channel._simulateEvent) {
          channel._simulateEvent('broadcast', 'frame_event', { payload: pixel1 })
          channel._simulateEvent('broadcast', 'frame_event', { payload: pixel2 })
        }
      })

      // Both clients should receive both events
      expect(client1Events).toHaveLength(2)
      expect(client2Events).toHaveLength(2)
      expect(client1Events).toContainEqual(pixel1)
      expect(client1Events).toContainEqual(pixel2)
      expect(client2Events).toContainEqual(pixel1)
      expect(client2Events).toContainEqual(pixel2)
    })
  })

  describe('Frame state synchronization', () => {
    it('should synchronize frame freeze state across clients', async () => {
      const client1Events: FrameEvent[] = []
      const client2Events: FrameEvent[] = []

      manager1.subscribeToFrame(frameId, (event) => {
        client1Events.push(event)
      })

      manager2.subscribeToFrame(frameId, (event) => {
        client2Events.push(event)
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      // Owner freezes the frame
      const freezeEvent: FrameEvent = {
        type: 'freeze',
        frameId,
        isFrozen: true
      }

      await manager1.broadcastFrameEvent(freezeEvent)

      // Simulate the event being received
      const channels = mockSupabase.channel.mock.results
      channels.forEach(result => {
        const channel = result.value
        if (channel._simulateEvent) {
          channel._simulateEvent('broadcast', 'frame_event', { payload: freezeEvent })
        }
      })

      expect(client1Events).toContainEqual(freezeEvent)
      expect(client2Events).toContainEqual(freezeEvent)
    })

    it('should synchronize permission changes across clients', async () => {
      const client1Events: FrameEvent[] = []
      const client2Events: FrameEvent[] = []

      manager1.subscribeToFrame(frameId, (event) => {
        client1Events.push(event)
      })

      manager2.subscribeToFrame(frameId, (event) => {
        client2Events.push(event)
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      // Owner changes permissions
      const permissionEvent: FrameEvent = {
        type: 'updatePermissions',
        frameId,
        permissions: 'approval-required'
      }

      await manager1.broadcastFrameEvent(permissionEvent)

      // Simulate the event being received
      const channels = mockSupabase.channel.mock.results
      channels.forEach(result => {
        const channel = result.value
        if (channel._simulateEvent) {
          channel._simulateEvent('broadcast', 'frame_event', { payload: permissionEvent })
        }
      })

      expect(client1Events).toContainEqual(permissionEvent)
      expect(client2Events).toContainEqual(permissionEvent)
    })
  })

  describe('Connection management', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should handle connection loss and reconnection for multiple clients', () => {
      const client1StateChanges: unknown[] = []
      const client2StateChanges: unknown[] = []

      manager1.onConnectionStateChange((state) => {
        client1StateChanges.push(state)
      })

      manager2.onConnectionStateChange((state) => {
        client2StateChanges.push(state)
      })

      // Subscribe both clients
      manager1.subscribeToFrame(frameId, () => {})
      manager2.subscribeToFrame(frameId, () => {})

      // Simulate connection loss
      const onCloseCallback1 = mockSupabase.realtime.onClose.mock.calls[0]?.[0]
      const onCloseCallback2 = mockSupabase.realtime.onClose.mock.calls[1]?.[0]

      if (onCloseCallback1) onCloseCallback1()
      if (onCloseCallback2) onCloseCallback2()

      // Both clients should be in reconnecting state
      expect(manager1.getConnectionState().isReconnecting).toBe(true)
      expect(manager2.getConnectionState().isReconnecting).toBe(true)

      // Fast-forward through reconnection attempts
      jest.advanceTimersByTime(1000)

      // Simulate successful reconnection
      const onOpenCallback1 = mockSupabase.realtime.onOpen.mock.calls[0]?.[0]
      const onOpenCallback2 = mockSupabase.realtime.onOpen.mock.calls[1]?.[0]

      if (onOpenCallback1) onOpenCallback1()
      if (onOpenCallback2) onOpenCallback2()

      expect(manager1.getConnectionState().isConnected).toBe(true)
      expect(manager2.getConnectionState().isConnected).toBe(true)
    })

    it('should maintain separate connection states for different managers', () => {
      // Simulate connection success for manager1 only
      const onOpenCallback1 = mockSupabase.realtime.onOpen.mock.calls[0]?.[0]
      if (onOpenCallback1) onOpenCallback1()

      expect(manager1.getConnectionState().isConnected).toBe(true)
      expect(manager2.getConnectionState().isConnected).toBe(false)
    })
  })

  describe('Event ordering and consistency', () => {
    it('should maintain event order across multiple clients', async () => {
      const client1Events: FrameEvent[] = []
      const client2Events: FrameEvent[] = []

      manager1.subscribeToFrame(frameId, (event) => {
        client1Events.push(event)
      })

      manager2.subscribeToFrame(frameId, (event) => {
        client2Events.push(event)
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      // Create a sequence of events
      const events: FrameEvent[] = [
        {
          type: 'pixel',
          data: {
            id: 'pixel-1',
            frame_id: frameId,
            x: 1,
            y: 1,
            color: 0xFF0000,
            contributor_handle: 'user1',
            placed_at: '2023-01-01T00:00:01Z'
          } as Pixel
        },
        {
          type: 'pixel',
          data: {
            id: 'pixel-2',
            frame_id: frameId,
            x: 2,
            y: 1,
            color: 0x00FF00,
            contributor_handle: 'user2',
            placed_at: '2023-01-01T00:00:02Z'
          } as Pixel
        },
        {
          type: 'freeze',
          frameId,
          isFrozen: true
        }
      ]

      // Broadcast events in sequence
      for (const event of events) {
        await manager1.broadcastFrameEvent(event)
        
        // Simulate the event being received by all clients
        const channels = mockSupabase.channel.mock.results
        channels.forEach(result => {
          const channel = result.value
          if (channel._simulateEvent) {
            channel._simulateEvent('broadcast', 'frame_event', { payload: event })
          }
        })
      }

      // Both clients should have received events in the same order
      expect(client1Events).toEqual(events)
      expect(client2Events).toEqual(events)
    })
  })

  describe('Error handling and resilience', () => {
    it('should handle invalid events gracefully', async () => {
      const client1Events: FrameEvent[] = []
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      manager1.subscribeToFrame(frameId, (event) => {
        client1Events.push(event)
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      // Simulate receiving an invalid event
      const channels = mockSupabase.channel.mock.results
      const channel = channels[0]?.value

      if (channel && channel._simulateEvent) {
        // Invalid event - missing required fields
        channel._simulateEvent('broadcast', 'frame_event', {
          payload: { type: 'pixel' } // missing data field
        })

        // Valid event should still work
        const validEvent: FrameEvent = {
          type: 'freeze',
          frameId,
          isFrozen: true
        }

        channel._simulateEvent('broadcast', 'frame_event', {
          payload: validEvent
        })
      }

      // Should have received only the valid event
      expect(client1Events).toHaveLength(1)
      expect(client1Events[0]).toEqual({
        type: 'freeze',
        frameId,
        isFrozen: true
      })

      // Should have logged the error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid frame event received:',
        expect.any(Error),
        { type: 'pixel' }
      )

      consoleSpy.mockRestore()
    })

    it('should handle broadcast to non-existent frame gracefully', async () => {
      const pixelEvent: FrameEvent = {
        type: 'pixel',
        data: {
          frame_id: 'non-existent-frame'
        } as Pixel
      }

      await expect(manager1.broadcastFrameEvent(pixelEvent)).rejects.toThrow(
        'No active subscription for frame non-existent-frame'
      )
    })
  })
})