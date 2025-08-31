/**
 * Integration test for Canvas components
 */

import React from 'react'
import { render } from '@testing-library/react'
import { CanvasContainer } from '../canvas-container'
import { Frame, Pixel } from '@/lib/types'

// Mock frame for testing
const mockFrame: Frame = {
  id: 'test-frame',
  handle: 'test-handle',
  title: 'Test Frame',
  description: 'Test Description',
  keywords: ['test'],
  owner_handle: 'test-user',
  width: 64,
  height: 64,
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
  }
]

// Mock Canvas API
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
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
  }))
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0
  }))
})

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  cb(0)
  return 0
})

global.cancelAnimationFrame = jest.fn()

describe('Canvas Integration', () => {
  test('CanvasContainer renders with all components', () => {
    const { container } = render(
      <CanvasContainer
        frame={mockFrame}
        pixels={mockPixels}
        showControls={true}
      />
    )

    // Should render the container
    expect(container.firstChild).toBeInTheDocument()
    
    // Should render canvas
    expect(container.querySelector('canvas')).toBeInTheDocument()
    
    // Should render controls
    expect(container.querySelector('button[title="Zoom In"]')).toBeInTheDocument()
    expect(container.querySelector('button[title="Zoom Out"]')).toBeInTheDocument()
    expect(container.querySelector('button[title="Fit to Frame"]')).toBeInTheDocument()
    expect(container.querySelector('button[title="Toggle Grid"]')).toBeInTheDocument()
  })

  test('CanvasContainer works without controls', () => {
    const { container } = render(
      <CanvasContainer
        frame={mockFrame}
        pixels={mockPixels}
        showControls={false}
      />
    )

    // Should render canvas
    expect(container.querySelector('canvas')).toBeInTheDocument()
    
    // Should not render controls
    expect(container.querySelector('button[title="Zoom In"]')).not.toBeInTheDocument()
  })

  test('Canvas components handle empty pixel array', () => {
    const { container } = render(
      <CanvasContainer
        frame={mockFrame}
        pixels={[]}
        showControls={true}
      />
    )

    // Should still render without errors
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  test('Canvas components handle large pixel arrays', () => {
    // Generate many pixels
    const manyPixels: Pixel[] = []
    for (let i = 0; i < 1000; i++) {
      manyPixels.push({
        id: `pixel-${i}`,
        frame_id: 'test-frame',
        x: i % 64,
        y: Math.floor(i / 64),
        color: 0xFFFF0000,
        contributor_handle: 'test-user',
        placed_at: new Date().toISOString()
      })
    }

    const { container } = render(
      <CanvasContainer
        frame={mockFrame}
        pixels={manyPixels}
        showControls={true}
      />
    )

    // Should handle large arrays without errors
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })
})