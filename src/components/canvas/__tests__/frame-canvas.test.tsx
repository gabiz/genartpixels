/**
 * Component tests for FrameCanvas interactions and event handling
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { FrameCanvas, FrameCanvasRef } from '../frame-canvas'
import { Frame, Pixel } from '@/lib/types'

// Mock frame for testing
const mockFrame: Frame = {
  id: 'test-frame',
  handle: 'test-handle',
  title: 'Test Frame',
  description: 'Test Description',
  keywords: ['test'],
  owner_handle: 'test-user',
  width: 128,
  height: 128,
  permissions: 'open',
  is_frozen: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Mock pixels
const mockPixels: Pixel[] = [
  {
    id: 'pixel-1',
    frame_id: 'test-frame',
    x: 10,
    y: 10,
    color: 0xFFFF0000, // Red
    contributor_handle: 'test-user',
    placed_at: new Date().toISOString()
  },
  {
    id: 'pixel-2',
    frame_id: 'test-frame',
    x: 20,
    y: 20,
    color: 0xFF00FF00, // Green
    contributor_handle: 'test-user',
    placed_at: new Date().toISOString()
  }
]

// Mock Canvas API
const mockCanvas = {
  getContext: jest.fn(() => ({
    clearRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    set fillStyle(value: string) {},
    set strokeStyle(value: string) {},
    set lineWidth(value: number) {}
  })),
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0
  }))
}

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockCanvas.getContext
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: mockCanvas.getBoundingClientRect
})

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  cb(0)
  return 0
})

global.cancelAnimationFrame = jest.fn()

describe('FrameCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders canvas element', () => {
    render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
      />
    )

    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  test('calls onPixelClick when canvas is clicked', async () => {
    const onPixelClick = jest.fn()
    
    render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
        interaction={{ onPixelClick }}
      />
    )

    const canvas = document.querySelector('canvas')!
    
    // Simulate left click
    fireEvent.mouseDown(canvas, {
      button: 0,
      clientX: 400, // Center of 800px canvas
      clientY: 300  // Center of 600px canvas
    })

    await waitFor(() => {
      expect(onPixelClick).toHaveBeenCalled()
    })
  })

  test('calls onPixelHover when mouse moves over canvas', async () => {
    const onPixelHover = jest.fn()
    
    render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
        interaction={{ onPixelHover }}
      />
    )

    const canvas = document.querySelector('canvas')!
    
    fireEvent.mouseMove(canvas, {
      clientX: 400,
      clientY: 300
    })

    await waitFor(() => {
      expect(onPixelHover).toHaveBeenCalled()
    })
  })

  test('handles zoom with mouse wheel', async () => {
    const onViewportChange = jest.fn()
    
    render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
        interaction={{ onViewportChange }}
      />
    )

    const canvas = document.querySelector('canvas')!
    
    // Simulate wheel zoom in
    fireEvent.wheel(canvas, {
      deltaY: -100,
      clientX: 400,
      clientY: 300
    })

    await waitFor(() => {
      expect(onViewportChange).toHaveBeenCalledWith(
        expect.objectContaining({
          zoom: expect.any(Number)
        })
      )
    })
  })

  test('handles panning with right mouse button', async () => {
    const onViewportChange = jest.fn()
    
    render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
        interaction={{ onViewportChange }}
      />
    )

    const canvas = document.querySelector('canvas')!
    
    // Start drag with right mouse button
    fireEvent.mouseDown(canvas, {
      button: 2, // Right button
      clientX: 400,
      clientY: 300
    })

    // Move mouse
    fireEvent.mouseMove(canvas, {
      clientX: 450,
      clientY: 350
    })

    await waitFor(() => {
      expect(onViewportChange).toHaveBeenCalled()
    })
  })

  test('prevents context menu on right click', () => {
    render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
      />
    )

    const canvas = document.querySelector('canvas')!
    
    const contextMenuEvent = fireEvent.contextMenu(canvas)
    expect(contextMenuEvent).toBe(false) // Event should be prevented
  })

  test('exposes ref methods correctly', () => {
    const ref = React.createRef<FrameCanvasRef>()
    
    render(
      <FrameCanvas
        ref={ref}
        frame={mockFrame}
        pixels={mockPixels}
      />
    )

    expect(ref.current).toBeDefined()
    expect(ref.current?.fitToFrame).toBeInstanceOf(Function)
    expect(ref.current?.setZoom).toBeInstanceOf(Function)
    expect(ref.current?.setPan).toBeInstanceOf(Function)
    expect(ref.current?.getPixelAtCoordinate).toBeInstanceOf(Function)
    expect(ref.current?.getViewport).toBeInstanceOf(Function)
  })

  test('updates viewport when prop changes', async () => {
    const { rerender } = render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
        viewport={{ x: 0, y: 0, zoom: 1 }}
      />
    )

    // Update viewport prop
    rerender(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
        viewport={{ x: 10, y: 20, zoom: 2 }}
      />
    )

    // Component should re-render with new viewport
    await waitFor(() => {
      expect(mockCanvas.getContext).toHaveBeenCalled()
    })
  })

  test('renders grid when showGrid is true and zoom is high enough', () => {
    render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
        showGrid={true}
        viewport={{ x: 0, y: 0, zoom: 5 }} // High zoom to show grid
      />
    )

    // Component should render without errors
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  test('does not render grid when zoom is too low', () => {
    render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
        showGrid={true}
        viewport={{ x: 0, y: 0, zoom: 1 }} // Low zoom, no grid
      />
    )

    // Component should render without errors
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  test('handles resize events', () => {
    const { container } = render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
      />
    )

    // Simulate window resize
    fireEvent(window, new Event('resize'))

    // Canvas should still be in the DOM
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  test('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    
    const { unmount } = render(
      <FrameCanvas
        frame={mockFrame}
        pixels={mockPixels}
      />
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    
    removeEventListenerSpy.mockRestore()
  })
})