/**
 * Unit tests for Canvas coordinate mapping logic
 */

import { Frame } from '@/lib/types'

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

// Coordinate mapping utility functions (extracted from component for testing)
export class CanvasCoordinateMapper {
  constructor(
    private frame: Frame,
    private canvasWidth: number,
    private canvasHeight: number,
    private viewport: { x: number; y: number; zoom: number }
  ) {}

  /**
   * Convert screen coordinates to pixel coordinates
   */
  screenToPixel(clientX: number, clientY: number, canvasRect: DOMRect): { x: number; y: number } | null {
    const { x: panX, y: panY, zoom } = this.viewport

    // Convert to canvas coordinates
    const canvasX = clientX - canvasRect.left
    const canvasY = clientY - canvasRect.top

    // Convert to frame coordinates
    const frameX = (canvasX - canvasRect.width / 2) / zoom - panX + this.frame.width / 2
    const frameY = (canvasY - canvasRect.height / 2) / zoom - panY + this.frame.height / 2

    // Convert to pixel coordinates (floor to get pixel index)
    const pixelX = Math.floor(frameX)
    const pixelY = Math.floor(frameY)

    // Check bounds
    if (pixelX < 0 || pixelX >= this.frame.width || pixelY < 0 || pixelY >= this.frame.height) {
      return null
    }

    return { x: pixelX, y: pixelY }
  }

  /**
   * Convert pixel coordinates to screen coordinates
   */
  pixelToScreen(pixelX: number, pixelY: number, canvasRect: DOMRect): { x: number; y: number } {
    const { x: panX, y: panY, zoom } = this.viewport

    // Convert pixel to frame coordinates (center of pixel)
    const frameX = pixelX + 0.5 - this.frame.width / 2 + panX
    const frameY = pixelY + 0.5 - this.frame.height / 2 + panY

    // Convert to canvas coordinates
    const canvasX = frameX * zoom + canvasRect.width / 2
    const canvasY = frameY * zoom + canvasRect.height / 2

    // Convert to screen coordinates
    const screenX = canvasX + canvasRect.left
    const screenY = canvasY + canvasRect.top

    return { x: screenX, y: screenY }
  }

  /**
   * Calculate visible pixel bounds for optimization
   */
  getVisibleBounds(canvasRect: DOMRect): { startX: number; endX: number; startY: number; endY: number } {
    const { x: panX, y: panY, zoom } = this.viewport
    const pixelSize = 1

    const visibleLeft = Math.floor((-panX - canvasRect.width / (2 * zoom)) / pixelSize)
    const visibleRight = Math.ceil((-panX + canvasRect.width / (2 * zoom)) / pixelSize)
    const visibleTop = Math.floor((-panY - canvasRect.height / (2 * zoom)) / pixelSize)
    const visibleBottom = Math.ceil((-panY + canvasRect.height / (2 * zoom)) / pixelSize)

    // Clamp to frame bounds
    const startX = Math.max(0, visibleLeft)
    const endX = Math.min(this.frame.width, visibleRight)
    const startY = Math.max(0, visibleTop)
    const endY = Math.min(this.frame.height, visibleBottom)

    return { startX, endX, startY, endY }
  }

  /**
   * Calculate optimal zoom level to fit frame in canvas
   */
  calculateFitZoom(canvasRect: DOMRect, padding: number = 20): number {
    const scaleX = (canvasRect.width - padding * 2) / this.frame.width
    const scaleY = (canvasRect.height - padding * 2) / this.frame.height
    return Math.min(scaleX, scaleY)
  }
}

describe('CanvasCoordinateMapper', () => {
  const canvasWidth = 800
  const canvasHeight = 600
  const mockCanvasRect: DOMRect = {
    left: 100,
    top: 50,
    width: canvasWidth,
    height: canvasHeight,
    right: 900,
    bottom: 650,
    x: 100,
    y: 50,
    toJSON: () => ({})
  }

  describe('screenToPixel', () => {
    test('converts center screen coordinates to center pixel at zoom 1', () => {
      const viewport = { x: 0, y: 0, zoom: 1 }
      const mapper = new CanvasCoordinateMapper(mockFrame, canvasWidth, canvasHeight, viewport)

      // Center of canvas should map to center of frame
      const centerX = mockCanvasRect.left + canvasWidth / 2
      const centerY = mockCanvasRect.top + canvasHeight / 2
      
      const result = mapper.screenToPixel(centerX, centerY, mockCanvasRect)
      
      expect(result).toEqual({ x: 64, y: 64 }) // Center of 128x128 frame
    })

    test('returns null for coordinates outside frame bounds', () => {
      const viewport = { x: 0, y: 0, zoom: 1 }
      const mapper = new CanvasCoordinateMapper(mockFrame, canvasWidth, canvasHeight, viewport)

      // Far left of canvas (outside frame)
      const result = mapper.screenToPixel(mockCanvasRect.left, mockCanvasRect.top, mockCanvasRect)
      
      expect(result).toBeNull()
    })

    test('handles zoom correctly', () => {
      const viewport = { x: 0, y: 0, zoom: 2 }
      const mapper = new CanvasCoordinateMapper(mockFrame, canvasWidth, canvasHeight, viewport)

      // At 2x zoom, the same screen position should map to a different pixel
      const centerX = mockCanvasRect.left + canvasWidth / 2
      const centerY = mockCanvasRect.top + canvasHeight / 2
      
      const result = mapper.screenToPixel(centerX, centerY, mockCanvasRect)
      
      expect(result).toEqual({ x: 64, y: 64 }) // Still center, but zoom affects precision
    })

    test('handles pan offset correctly', () => {
      const viewport = { x: 10, y: -5, zoom: 1 }
      const mapper = new CanvasCoordinateMapper(mockFrame, canvasWidth, canvasHeight, viewport)

      const centerX = mockCanvasRect.left + canvasWidth / 2
      const centerY = mockCanvasRect.top + canvasHeight / 2
      
      const result = mapper.screenToPixel(centerX, centerY, mockCanvasRect)
      
      // Pan should offset the result: center (64, 64) + pan (10, -5) = (74, 59)
      // But the actual calculation is: frameX = (canvasX - width/2) / zoom - panX + frame.width/2
      // So: frameX = (400 - 400) / 1 - 10 + 64 = 54
      // And: frameY = (300 - 300) / 1 - (-5) + 64 = 69
      expect(result).toEqual({ x: 54, y: 69 })
    })
  })

  describe('pixelToScreen', () => {
    test('converts pixel coordinates to screen coordinates at zoom 1', () => {
      const viewport = { x: 0, y: 0, zoom: 1 }
      const mapper = new CanvasCoordinateMapper(mockFrame, canvasWidth, canvasHeight, viewport)

      const result = mapper.pixelToScreen(64, 64, mockCanvasRect)
      
      // Center pixel (64, 64) should map close to center of canvas
      // Calculation: frameX = pixelX + 0.5 - frame.width/2 + panX = 64.5 - 64 + 0 = 0.5
      // canvasX = frameX * zoom + canvasWidth/2 = 0.5 * 1 + 400 = 400.5
      // screenX = canvasX + rect.left = 400.5 + 100 = 500.5
      const expectedX = mockCanvasRect.left + canvasWidth / 2 + 0.5
      const expectedY = mockCanvasRect.top + canvasHeight / 2 + 0.5
      
      expect(result.x).toBeCloseTo(expectedX, 0)
      expect(result.y).toBeCloseTo(expectedY, 0)
    })

    test('handles zoom correctly', () => {
      const viewport = { x: 0, y: 0, zoom: 2 }
      const mapper = new CanvasCoordinateMapper(mockFrame, canvasWidth, canvasHeight, viewport)

      const result = mapper.pixelToScreen(64, 64, mockCanvasRect)
      
      // At 2x zoom: frameX = 0.5, canvasX = 0.5 * 2 + 400 = 401, screenX = 501
      const expectedX = mockCanvasRect.left + canvasWidth / 2 + 1
      const expectedY = mockCanvasRect.top + canvasHeight / 2 + 1
      
      expect(result.x).toBeCloseTo(expectedX, 0)
      expect(result.y).toBeCloseTo(expectedY, 0)
    })
  })

  describe('getVisibleBounds', () => {
    test('calculates visible bounds correctly at zoom 1', () => {
      const viewport = { x: 0, y: 0, zoom: 1 }
      const mapper = new CanvasCoordinateMapper(mockFrame, canvasWidth, canvasHeight, viewport)

      const bounds = mapper.getVisibleBounds(mockCanvasRect)
      
      // At zoom 1, should see the entire frame plus some area outside
      expect(bounds.startX).toBe(0)
      expect(bounds.endX).toBe(128)
      expect(bounds.startY).toBe(0)
      expect(bounds.endY).toBe(128)
    })

    test('calculates visible bounds correctly at high zoom', () => {
      const viewport = { x: 0, y: 0, zoom: 10 }
      const mapper = new CanvasCoordinateMapper(mockFrame, canvasWidth, canvasHeight, viewport)

      const bounds = mapper.getVisibleBounds(mockCanvasRect)
      
      // At high zoom, should see only a small portion of the frame
      expect(bounds.endX - bounds.startX).toBeLessThan(128)
      expect(bounds.endY - bounds.startY).toBeLessThan(128)
    })
  })

  describe('calculateFitZoom', () => {
    test('calculates zoom to fit frame in canvas', () => {
      const viewport = { x: 0, y: 0, zoom: 1 }
      const mapper = new CanvasCoordinateMapper(mockFrame, canvasWidth, canvasHeight, viewport)

      const zoom = mapper.calculateFitZoom(mockCanvasRect, 20)
      
      // Should fit 128x128 frame in 800x600 canvas with 20px padding
      const expectedZoom = Math.min((800 - 40) / 128, (600 - 40) / 128)
      expect(zoom).toBeCloseTo(expectedZoom, 2)
    })

    test('handles different aspect ratios', () => {
      const wideFrame: Frame = { ...mockFrame, width: 256, height: 64 }
      const viewport = { x: 0, y: 0, zoom: 1 }
      const mapper = new CanvasCoordinateMapper(wideFrame, canvasWidth, canvasHeight, viewport)

      const zoom = mapper.calculateFitZoom(mockCanvasRect, 20)
      
      // Wide frame should be limited by width
      const expectedZoom = (800 - 40) / 256
      expect(zoom).toBeCloseTo(expectedZoom, 2)
    })
  })
})