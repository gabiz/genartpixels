'use client'

/**
 * Test page for pixel editing interface
 * Demonstrates color palette, quota display, and pixel placement functionality
 */

import React, { useState } from 'react'
import { Frame, Pixel } from '@/lib/types'
import { PixelEditor } from '@/components/canvas'
import { AuthProvider } from '@/lib/auth/context'

// Mock frame data for testing
const mockFrame: Frame = {
  id: 'test-frame-1',
  handle: 'pixel-editor-test',
  title: 'Pixel Editor Test Frame',
  description: 'A test frame for demonstrating the pixel editing interface',
  keywords: ['test', 'pixel', 'editor'],
  owner_handle: 'testuser',
  width: 64,
  height: 64,
  permissions: 'open',
  is_frozen: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Mock initial pixels
const initialPixels: Pixel[] = [
  {
    id: 'pixel-1',
    frame_id: 'test-frame-1',
    x: 10,
    y: 10,
    color: 0xFFFF0000, // Red
    contributor_handle: 'user1',
    placed_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'pixel-2',
    frame_id: 'test-frame-1',
    x: 15,
    y: 10,
    color: 0xFF00FF00, // Green
    contributor_handle: 'user2',
    placed_at: '2024-01-01T00:01:00Z'
  },
  {
    id: 'pixel-3',
    frame_id: 'test-frame-1',
    x: 20,
    y: 10,
    color: 0xFF0000FF, // Blue
    contributor_handle: 'user3',
    placed_at: '2024-01-01T00:02:00Z'
  },
  {
    id: 'pixel-4',
    frame_id: 'test-frame-1',
    x: 10,
    y: 15,
    color: 0xFFFFFF00, // Yellow
    contributor_handle: 'user1',
    placed_at: '2024-01-01T00:03:00Z'
  },
  {
    id: 'pixel-5',
    frame_id: 'test-frame-1',
    x: 15,
    y: 15,
    color: 0xFFFF00FF, // Magenta
    contributor_handle: 'user2',
    placed_at: '2024-01-01T00:04:00Z'
  }
]

export default function PixelEditorTestPage() {
  const [pixels, setPixels] = useState<Pixel[]>(initialPixels)
  const [placedCount, setPlacedCount] = useState(0)
  const [undoneCount, setUndoneCount] = useState(0)

  const handlePixelPlaced = (pixel: Pixel) => {
    setPixels(prev => {
      // Remove existing pixel at same position if any
      const filtered = prev.filter(p => !(p.x === pixel.x && p.y === pixel.y))
      return [...filtered, pixel]
    })
    setPlacedCount(prev => prev + 1)
  }

  const handlePixelUndone = (x: number, y: number) => {
    setPixels(prev => prev.filter(p => !(p.x === x && p.y === y)))
    setUndoneCount(prev => prev + 1)
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pixel Editor Test Page
            </h1>
            <p className="text-gray-600">
              Test the pixel editing interface with color palette, quota display, and canvas interaction.
            </p>
          </div>

          {/* Test Statistics */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-700">Current Pixels</h3>
              <p className="text-2xl font-bold text-blue-600">{pixels.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-700">Pixels Placed</h3>
              <p className="text-2xl font-bold text-green-600">{placedCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-700">Pixels Undone</h3>
              <p className="text-2xl font-bold text-yellow-600">{undoneCount}</p>
            </div>
          </div>

          {/* Pixel Editor */}
          <div className="bg-white rounded-lg border p-6">
            <PixelEditor
              frame={mockFrame}
              pixels={pixels}
              onPixelPlaced={handlePixelPlaced}
              onPixelUndone={handlePixelUndone}
              showColorPalette={true}
            />
          </div>

          {/* Test Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              Test Instructions
            </h2>
            <div className="space-y-2 text-blue-800">
              <p><strong>Color Palette:</strong> Click colors to select them. Selected color is highlighted.</p>
              <p><strong>Canvas Interaction:</strong> Click on the canvas to place pixels (requires login).</p>
              <p><strong>Grid Toggle:</strong> Use the &quot;Show/Hide Grid&quot; button to toggle pixel grid visibility.</p>
              <p><strong>Zoom Controls:</strong> Use mouse wheel to zoom, drag to pan, &quot;Fit to Frame&quot; to reset view.</p>
              <p><strong>Quota System:</strong> Monitor your pixel quota in the right panel.</p>
              <p><strong>Undo:</strong> Use &quot;Undo Last Pixel&quot; button to remove your most recent pixel.</p>
              <p><strong>Feedback:</strong> Watch for visual feedback messages when placing pixels.</p>
            </div>
          </div>

          {/* Feature Checklist */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-3">
              Feature Checklist
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-800">
              <div>
                <h3 className="font-medium mb-2">Color Palette</h3>
                <ul className="space-y-1 text-sm">
                  <li>✓ 32-color grid layout (8×4)</li>
                  <li>✓ Color selection with visual feedback</li>
                  <li>✓ Hover effects and color names</li>
                  <li>✓ Transparent color with checkerboard</li>
                  <li>✓ Selected color information display</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Quota Display</h3>
                <ul className="space-y-1 text-sm">
                  <li>✓ Current quota with progress bar</li>
                  <li>✓ Countdown timer to next refill</li>
                  <li>✓ Color-coded quota status</li>
                  <li>✓ Quota explanation and help text</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Pixel Placement</h3>
                <ul className="space-y-1 text-sm">
                  <li>✓ Click-to-place workflow</li>
                  <li>✓ Visual feedback for actions</li>
                  <li>✓ Quota validation</li>
                  <li>✓ Permission checking</li>
                  <li>✓ Identical pixel detection</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Canvas Integration</h3>
                <ul className="space-y-1 text-sm">
                  <li>✓ Zoom and pan controls</li>
                  <li>✓ Grid toggle functionality</li>
                  <li>✓ Coordinate mapping</li>
                  <li>✓ Real-time pixel rendering</li>
                  <li>✓ Undo functionality</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Current Pixels Debug Info */}
          <div className="mt-6 bg-gray-50 border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Debug: Current Pixels
            </h2>
            <div className="text-sm font-mono text-gray-600 max-h-40 overflow-y-auto">
              <pre>{JSON.stringify(pixels, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}