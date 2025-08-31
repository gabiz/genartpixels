/**
 * Unit tests for real-time React hooks
 */

import { renderHook, act } from '@testing-library/react'
import {
  useFrameRealtime,
  useRealtimeConnection,
  useFrameBroadcast,
  usePixelUpdates,
  useFrameStateUpdates,
  useOfflineDetection
} from '../hooks'
import { FrameEvent, Pixel } from '@/lib/types'

// Mock the getRealtimeManager function
jest.mock('../manager', () => {
  const mockManager = {
    subscribeToFrame: jest.fn(),
    unsubscribeFromFrame: jest.fn(),
    broadcastFrameEvent: jest.fn(),
    getConnectionState: jest.fn(() => ({ status: 'connected', lastConnected: new Date() })),
    onConnectionStateChange: jest.fn(),
    reconnect: jest.fn()
  }
  
  return {
    getRealtimeManager: jest.fn(() => mockManager),
    realtimeManager: mockManager
  }
})

// Mock the robust manager as well
jest.mock('../robust-manager', () => ({
  getRobustRealtimeManager: jest.fn(() => ({
    subscribeToFrame: jest.fn(),
    unsubscribeFromFrame: jest.fn(),
    broadcastEvent: jest.fn(),
    getSubscriptionStatus: jest.fn(),
    destroy: jest.fn()
  }))
}))

// Import the mocked functions
import { getRealtimeManager, realtimeManager } from '../manager'
import { getRobustRealtimeManager } from '../robust-manager'
const mockGetRealtimeManager = getRealtimeManager as jest.MockedFunction<typeof getRealtimeManager>
const mockRealtimeManager = realtimeManager as jest.Mocked<typeof realtimeManager>
const mockGetRobustManager = getRobustRealtimeManager as jest.MockedFunction<typeof getRobustRealtimeManager>

describe('useFrameRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with empty events and not subscribed', () => {
    const { result } = renderHook(() => useFrameRealtime('frame-id'))

    expect(result.current.events).toEqual([])
    expect(result.current.isSubscribed).toBe(false)
  })

  it('should subscribe to frame when subscribe is called', () => {
    const { result } = renderHook(() => useFrameRealtime('frame-id'))

    act(() => {
      result.current.subscribe()
    })

    expect(mockRealtimeManager.subscribeToFrame).toHaveBeenCalledWith(
      'frame-id',
      expect.any(Function)
    )
    expect(result.current.isSubscribed).toBe(true)
  })

  it('should unsubscribe from frame when unsubscribe is called', () => {
    const { result } = renderHook(() => useFrameRealtime('frame-id'))

    act(() => {
      result.current.subscribe()
    })

    act(() => {
      result.current.unsubscribe()
    })

    expect(mockRealtimeManager.unsubscribeFromFrame).toHaveBeenCalledWith('frame-id')
    expect(result.current.isSubscribed).toBe(false)
  })

  it('should accumulate events when they are received', () => {
    const { result } = renderHook(() => useFrameRealtime('frame-id'))

    act(() => {
      result.current.subscribe()
    })

    // Get the callback that was passed to subscribeToFrame
    const eventCallback = mockRealtimeManager.subscribeToFrame.mock.calls[0][1]

    const event1: FrameEvent = {
      type: 'pixel',
      data: { frame_id: 'frame-id', x: 1, y: 1 } as Pixel
    }

    const event2: FrameEvent = {
      type: 'freeze',
      frameId: 'frame-id',
      isFrozen: true
    }

    act(() => {
      eventCallback(event1)
    })

    act(() => {
      eventCallback(event2)
    })

    expect(result.current.events).toEqual([event1, event2])
  })

  it('should clear events when clearEvents is called', () => {
    const { result } = renderHook(() => useFrameRealtime('frame-id'))

    act(() => {
      result.current.subscribe()
    })

    const eventCallback = mockRealtimeManager.subscribeToFrame.mock.calls[0][1]

    act(() => {
      eventCallback({
        type: 'pixel',
        data: { frame_id: 'frame-id' } as Pixel
      })
    })

    expect(result.current.events).toHaveLength(1)

    act(() => {
      result.current.clearEvents()
    })

    expect(result.current.events).toEqual([])
  })

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useFrameRealtime('frame-id'))

    unmount()

    expect(mockRealtimeManager.unsubscribeFromFrame).toHaveBeenCalledWith('frame-id')
  })

  it('should handle null frameId gracefully', () => {
    const { result } = renderHook(() => useFrameRealtime(null))

    act(() => {
      result.current.subscribe()
    })

    expect(mockRealtimeManager.subscribeToFrame).not.toHaveBeenCalled()
  })
})

describe('useRealtimeConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRealtimeManager.getConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0
    })
    mockRealtimeManager.onConnectionStateChange.mockReturnValue(() => {})
  })

  it('should return initial connection state', () => {
    const { result } = renderHook(() => useRealtimeConnection())

    expect(result.current.isConnected).toBe(false)
    expect(result.current.isReconnecting).toBe(false)
    expect(result.current.reconnectAttempts).toBe(0)
  })

  it('should subscribe to connection state changes', () => {
    renderHook(() => useRealtimeConnection())

    expect(mockRealtimeManager.onConnectionStateChange).toHaveBeenCalledWith(
      expect.any(Function)
    )
  })

  it('should provide reconnect function', () => {
    const { result } = renderHook(() => useRealtimeConnection())

    act(() => {
      result.current.reconnect()
    })

    expect(mockRealtimeManager.reconnect).toHaveBeenCalled()
  })
})

describe('useFrameBroadcast', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with not broadcasting state', () => {
    const { result } = renderHook(() => useFrameBroadcast())

    expect(result.current.isBroadcasting).toBe(false)
    expect(result.current.lastError).toBe(null)
  })

  it('should broadcast event successfully', async () => {
    mockRealtimeManager.broadcastFrameEvent.mockResolvedValue({ status: 'ok' })

    const { result } = renderHook(() => useFrameBroadcast())

    const event: FrameEvent = {
      type: 'pixel',
      data: { frame_id: 'frame-id' } as Pixel
    }

    await act(async () => {
      await result.current.broadcast(event)
    })

    expect(mockRealtimeManager.broadcastFrameEvent).toHaveBeenCalledWith(event)
    expect(result.current.isBroadcasting).toBe(false)
    expect(result.current.lastError).toBe(null)
  })

  it('should handle broadcast errors', async () => {
    const error = new Error('Broadcast failed')
    mockRealtimeManager.broadcastFrameEvent.mockRejectedValue(error)

    const { result } = renderHook(() => useFrameBroadcast())

    const event: FrameEvent = {
      type: 'pixel',
      data: { frame_id: 'frame-id' } as Pixel
    }

    await act(async () => {
      try {
        await result.current.broadcast(event)
      } catch {
        // Expected to throw
      }
    })

    expect(result.current.isBroadcasting).toBe(false)
    expect(result.current.lastError).toBe(error)
  })
})

describe('usePixelUpdates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call onPixelUpdate when pixel event is received', () => {
    const onPixelUpdate = jest.fn()
    renderHook(() => usePixelUpdates('frame-id', onPixelUpdate))

    // Get the callback that was passed to subscribeToFrame
    const eventCallback = mockRealtimeManager.subscribeToFrame.mock.calls[0][1]

    const pixelEvent: FrameEvent = {
      type: 'pixel',
      data: { frame_id: 'frame-id', x: 1, y: 1 } as Pixel
    }

    act(() => {
      eventCallback(pixelEvent)
    })

    expect(onPixelUpdate).toHaveBeenCalledWith(pixelEvent.data)
  })

  it('should not call onPixelUpdate for non-pixel events', () => {
    const onPixelUpdate = jest.fn()
    renderHook(() => usePixelUpdates('frame-id', onPixelUpdate))

    const eventCallback = mockRealtimeManager.subscribeToFrame.mock.calls[0][1]

    const freezeEvent: FrameEvent = {
      type: 'freeze',
      frameId: 'frame-id',
      isFrozen: true
    }

    act(() => {
      eventCallback(freezeEvent)
    })

    expect(onPixelUpdate).not.toHaveBeenCalled()
  })
})

describe('useFrameStateUpdates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call appropriate callbacks for different event types', () => {
    const callbacks = {
      onFreeze: jest.fn(),
      onTitleUpdate: jest.fn(),
      onPermissionsUpdate: jest.fn(),
      onDelete: jest.fn()
    }

    renderHook(() => useFrameStateUpdates('frame-id', callbacks))

    const eventCallback = mockRealtimeManager.subscribeToFrame.mock.calls[0][1]

    // Test freeze event
    act(() => {
      eventCallback({
        type: 'freeze',
        frameId: 'frame-id',
        isFrozen: true
      })
    })

    expect(callbacks.onFreeze).toHaveBeenCalledWith(true)

    // Test title update event
    act(() => {
      eventCallback({
        type: 'updateTitle',
        frameId: 'frame-id',
        title: 'New Title'
      })
    })

    expect(callbacks.onTitleUpdate).toHaveBeenCalledWith('New Title')

    // Test permissions update event
    act(() => {
      eventCallback({
        type: 'updatePermissions',
        frameId: 'frame-id',
        permissions: 'approval-required'
      })
    })

    expect(callbacks.onPermissionsUpdate).toHaveBeenCalledWith('approval-required')

    // Test delete event
    act(() => {
      eventCallback({
        type: 'delete',
        frameId: 'frame-id'
      })
    })

    expect(callbacks.onDelete).toHaveBeenCalled()
  })
})

describe('useOfflineDetection', () => {
  const originalNavigator = global.navigator

  beforeEach(() => {
    jest.clearAllMocks()
    mockRealtimeManager.getConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      reconnectAttempts: 0
    })
    mockRealtimeManager.onConnectionStateChange.mockReturnValue(() => {})

    // Mock navigator.onLine
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      writable: true
    })
  })

  afterEach(() => {
    global.navigator = originalNavigator
  })

  it('should initialize with online state', () => {
    const { result } = renderHook(() => useOfflineDetection())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isConnected).toBe(true)
  })

  it('should handle offline/online events', () => {
    // Mock window events before rendering
    const addEventListener = jest.spyOn(window, 'addEventListener')
    const removeEventListener = jest.spyOn(window, 'removeEventListener')

    const { result } = renderHook(() => useOfflineDetection())

    // Find the event listeners that were added
    const offlineCall = addEventListener.mock.calls.find(call => call[0] === 'offline')
    const onlineCall = addEventListener.mock.calls.find(call => call[0] === 'online')

    expect(offlineCall).toBeDefined()
    expect(onlineCall).toBeDefined()

    const offlineListener = offlineCall?.[1] as EventListener
    const onlineListener = onlineCall?.[1] as EventListener

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    
    act(() => {
      offlineListener(new Event('offline'))
    })

    expect(result.current.isOnline).toBe(false)
    expect(result.current.isConnected).toBe(false)

    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    
    act(() => {
      onlineListener(new Event('online'))
    })

    expect(result.current.isOnline).toBe(true)

    addEventListener.mockRestore()
    removeEventListener.mockRestore()
  })
})