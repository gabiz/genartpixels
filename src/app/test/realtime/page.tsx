'use client'

/**
 * Real-time collaboration test page
 * Tests live pixel updates and event broadcasting
 */

import { useState, useEffect, useCallback } from 'react'
import {
  useFrameRealtime,
  useRealtimeConnection,
  useFrameBroadcast,
  usePixelUpdates,
  useFrameStateUpdates,
  useOfflineDetection
} from '@/lib/realtime'
import { FrameEvent, Pixel, COLOR_PALETTE } from '@/lib/types'

export default function RealtimeTestPage() {
  const [frameId, setFrameId] = useState('test-frame-realtime')
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[1]) // Red
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [frameTitle, setFrameTitle] = useState('Test Frame')
  const [isFrozen, setIsFrozen] = useState(false)
  const [permissions, setPermissions] = useState('open')
  const [eventLog, setEventLog] = useState<string[]>([])

  // Real-time hooks
  const { events, isSubscribed, subscribe, unsubscribe, clearEvents } = useFrameRealtime(frameId)
  const { isConnected, isReconnecting, reconnectAttempts, reconnect } = useRealtimeConnection()
  const { broadcast, isBroadcasting, lastError } = useFrameBroadcast()
  const { isOnline } = useOfflineDetection()

  // Log events for debugging
  const logEvent = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setEventLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]) // Keep last 50 events
  }, [])

  // Handle pixel updates
  // usePixelUpdates(frameId, useCallback((pixel: Pixel) => {
  //   setPixels(prev => {
  //     const filtered = prev.filter(p => !(p.x === pixel.x && p.y === pixel.y))
  //     return [...filtered, pixel]
  //   })
  //   logEvent(`Pixel placed at (${pixel.x}, ${pixel.y}) by ${pixel.contributor_handle}`)
  // }, [logEvent]))

  // Handle frame state updates
  useFrameStateUpdates(frameId, {
    onPixelUpdate: useCallback((pixel: Pixel) => {
      setPixels(prev => {
        const filtered = prev.filter(p => !(p.x === pixel.x && p.y === pixel.y))
        return [...filtered, pixel]
      })
      logEvent(`Pixel placed at (${pixel.x}, ${pixel.y}) by ${pixel.contributor_handle}`)
    }, [logEvent]),
    onFreeze: useCallback((frozen: boolean) => {
      setIsFrozen(frozen)
      logEvent(`Frame ${frozen ? 'frozen' : 'unfrozen'}`)
    }, [logEvent]),
    onTitleUpdate: useCallback((title: string) => {
      setFrameTitle(title)
      logEvent(`Title updated to: ${title}`)
    }, [logEvent]),
    onPermissionsUpdate: useCallback((perms: string) => {
      setPermissions(perms)
      logEvent(`Permissions updated to: ${perms}`)
    }, [logEvent]),
    onDelete: useCallback(() => {
      logEvent('Frame deleted!')
    }, [logEvent])
  })

  // Subscribe to frame on mount
  // useEffect(() => {
  //   if (frameId) {
  //     subscribe()
  //     logEvent(`Subscribed to frame: ${frameId}`)
  //   }
  //   return () => {
  //     unsubscribe()
  //   }
  // }, [frameId])

  // Handle pixel placement
  const handlePixelClick = async (x: number, y: number) => {
    if (isFrozen) {
      logEvent('Cannot place pixel: frame is frozen')
      return
    }

    const pixelEvent: FrameEvent = {
      type: 'pixel',
      data: {
        id: `pixel-${Date.now()}`,
        frame_id: frameId,
        x,
        y,
        color: selectedColor,
        contributor_handle: 'test-user',
        placed_at: new Date().toISOString()
      } as Pixel
    }

    try {
      await broadcast(pixelEvent)
      logEvent(`Broadcasted pixel at (${x}, ${y})`)
    } catch (error) {
      logEvent(`Failed to broadcast pixel: ${error}`)
    }
  }

  // Handle frame state changes
  const handleFreezeToggle = async () => {
    const freezeEvent: FrameEvent = {
      type: 'freeze',
      frameId,
      isFrozen: !isFrozen
    }

    try {
      await broadcast(freezeEvent)
      logEvent(`Broadcasted freeze toggle: ${!isFrozen}`)
    } catch (error) {
      logEvent(`Failed to broadcast freeze: ${error}`)
    }
  }

  const handleTitleUpdate = async () => {
    const newTitle = prompt('Enter new title:', frameTitle)
    if (newTitle && newTitle !== frameTitle) {
      const titleEvent: FrameEvent = {
        type: 'updateTitle',
        frameId,
        title: newTitle
      }

      try {
        await broadcast(titleEvent)
        logEvent(`Broadcasted title update: ${newTitle}`)
      } catch (error) {
        logEvent(`Failed to broadcast title: ${error}`)
      }
    }
  }

  const handlePermissionsUpdate = async () => {
    const newPermissions = permissions === 'open' ? 'approval-required' : 'open'
    const permissionsEvent: FrameEvent = {
      type: 'updatePermissions',
      frameId,
      permissions: newPermissions as 'open' | 'approval-required' | 'owner-only'
    }

    try {
      await broadcast(permissionsEvent)
      logEvent(`Broadcasted permissions update: ${newPermissions}`)
    } catch (error) {
      logEvent(`Failed to broadcast permissions: ${error}`)
    }
  }

  // Render pixel grid (8x8 for testing)
  const renderPixelGrid = () => {
    const grid = []
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const pixel = pixels.find(p => p.x === x && p.y === y)
        const backgroundColor = pixel ? `#${pixel.color.toString(16).padStart(8, '0').slice(2)}` : '#f0f0f0'
        
        grid.push(
          <button
            key={`${x}-${y}`}
            className="w-8 h-8 border border-gray-300 hover:border-gray-500"
            style={{ backgroundColor }}
            onClick={() => handlePixelClick(x, y)}
            title={pixel ? `(${x}, ${y}) by ${pixel.contributor_handle}` : `(${x}, ${y}) - Click to place pixel`}
          />
        )
      }
    }
    return grid
  }

  // Render color palette
  const renderColorPalette = () => {
    return COLOR_PALETTE.slice(0, 16).map((color, index) => (
      <button
        key={index}
        className={`w-6 h-6 border-2 ${selectedColor === color ? 'border-black' : 'border-gray-300'}`}
        style={{ backgroundColor: `#${color.toString(16).padStart(8, '0').slice(2)}` }}
        onClick={() => setSelectedColor(color)}
        title={`Color: #${color.toString(16).padStart(8, '0').slice(2)}`}
      />
    ))
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Real-time Collaboration Test</h1>
      
      {/* Connection Status */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Online:</span>
            <span className={`ml-2 px-2 py-1 rounded ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isOnline ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Connected:</span>
            <span className={`ml-2 px-2 py-1 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isConnected ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Subscribed:</span>
            <span className={`ml-2 px-2 py-1 rounded ${isSubscribed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isSubscribed ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Reconnecting:</span>
            <span className={`ml-2 px-2 py-1 rounded ${isReconnecting ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
              {isReconnecting ? `Yes (${reconnectAttempts})` : 'No'}
            </span>
          </div>
        </div>
        
        {!isConnected && (
          <button
            onClick={reconnect}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reconnect
          </button>
        )}
      </div>

      {/* Frame Controls */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Frame Controls</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-1">Frame ID:</label>
            <input
              type="text"
              value={frameId}
              onChange={(e) => {
                console.log("frameId: ", frameId, " => target: ", e.target.value)
                if (e.target.value != frameId) setFrameId(e.target.value)
              }}
              className="px-3 py-1 border rounded"
            />
          </div>
          <div>
            <span className="block text-sm font-medium mb-1">Title: {frameTitle}</span>
            <button
              onClick={handleTitleUpdate}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Update Title
            </button>
          </div>
          <div>
            <span className="block text-sm font-medium mb-1">Status: {isFrozen ? 'Frozen' : 'Active'}</span>
            <button
              onClick={handleFreezeToggle}
              className={`px-3 py-1 rounded text-white ${isFrozen ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
              disabled={isBroadcasting}
            >
              {isFrozen ? 'Unfreeze' : 'Freeze'}
            </button>
          </div>
          <div>
            <span className="block text-sm font-medium mb-1">Permissions: {permissions}</span>
            <button
              onClick={handlePermissionsUpdate}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
              disabled={isBroadcasting}
            >
              Toggle Permissions
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pixel Canvas */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Pixel Canvas (8x8)</h2>
          
          {/* Color Palette */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Color Palette:</h3>
            <div className="flex flex-wrap gap-1">
              {renderColorPalette()}
            </div>
          </div>

          {/* Pixel Grid */}
          <div className="grid grid-cols-8 gap-1 w-fit mx-auto">
            {renderPixelGrid()}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>Click on pixels to place them. Selected color: 
              <span 
                className="inline-block w-4 h-4 ml-2 border border-gray-300"
                style={{ backgroundColor: `#${selectedColor.toString(16).padStart(8, '0').slice(2)}` }}
              />
            </p>
            <p>Total pixels: {pixels.length}</p>
          </div>
        </div>

        {/* Event Log */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Event Log</h2>
            <div className="flex gap-2">
              <button
                onClick={clearEvents}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                Clear Events
              </button>
              <button
                onClick={() => setEventLog([])}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Clear Log
              </button>
            </div>
          </div>

          {/* Broadcasting Status */}
          {isBroadcasting && (
            <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
              Broadcasting event...
            </div>
          )}

          {/* Last Error */}
          {lastError && (
            <div className="mb-2 p-2 bg-red-100 text-red-800 rounded text-sm">
              Error: {lastError.message}
            </div>
          )}

          {/* Event Statistics */}
          <div className="mb-4 text-sm text-gray-600">
            <p>Total events received: {events.length}</p>
            <p>Log entries: {eventLog.length}</p>
          </div>

          {/* Event Log */}
          <div className="h-96 overflow-y-auto bg-gray-50 p-2 rounded text-sm font-mono">
            {eventLog.length === 0 ? (
              <p className="text-gray-500">No events logged yet...</p>
            ) : (
              eventLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Raw Events */}
      <div className="mt-6 bg-white p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Raw Events ({events.length})</h2>
        <div className="h-64 overflow-y-auto bg-gray-50 p-2 rounded">
          <pre className="text-xs">
            {events.length === 0 ? 'No events received yet...' : JSON.stringify(events, null, 2)}
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Testing Instructions</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Open this page in multiple browser tabs/windows to simulate multiple clients</li>
          <li>Click on pixels in one tab and watch them appear in real-time in other tabs</li>
          <li>Use the frame controls to test freeze/unfreeze, title updates, and permission changes</li>
          <li>Monitor the connection status and test reconnection by going offline/online</li>
          <li>Check the event log to see all real-time events being received</li>
          <li>Test with different frame IDs to simulate multiple frames</li>
        </ul>
      </div>
    </div>
  )
}