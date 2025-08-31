/**
 * Unit tests for compression utilities
 */

import { CompressionUtils } from '../compression-utils'
import { Pixel } from '@/lib/types'

describe('CompressionUtils', () => {
  const mockPixels: Pixel[] = [
    {
      id: '1',
      frame_id: 'frame-1',
      x: 0,
      y: 0,
      color: 0xFFFF0000, // Red
      contributor_handle: 'user1',
      placed_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      frame_id: 'frame-1',
      x: 1,
      y: 0,
      color: 0xFFFF0000, // Red (same color for RLE efficiency)
      contributor_handle: 'user1',
      placed_at: '2024-01-01T00:01:00Z'
    },
    {
      id: '3',
      frame_id: 'frame-1',
      x: 2,
      y: 0,
      color: 0xFF00FF00, // Green
      contributor_handle: 'user2',
      placed_at: '2024-01-01T00:02:00Z'
    },
    {
      id: '4',
      frame_id: 'frame-1',
      x: 0,
      y: 1,
      color: 0xFF0000FF, // Blue
      contributor_handle: 'user3',
      placed_at: '2024-01-01T00:03:00Z'
    }
  ]

  describe('compressPixelData', () => {
    test('compresses pixel data correctly', () => {
      const frameWidth = 4
      const frameHeight = 4
      
      const compressed = CompressionUtils.compressPixelData(mockPixels, frameWidth, frameHeight)
      
      expect(compressed).toBeInstanceOf(Uint8Array)
      expect(compressed.length).toBeGreaterThan(0)
    })

    test('handles empty pixel array', () => {
      const frameWidth = 2
      const frameHeight = 2
      
      const compressed = CompressionUtils.compressPixelData([], frameWidth, frameHeight)
      
      expect(compressed).toBeInstanceOf(Uint8Array)
      expect(compressed.length).toBeGreaterThan(0)
    })

    test('handles pixels outside frame bounds', () => {
      const frameWidth = 2
      const frameHeight = 2
      
      const pixelsWithOutOfBounds: Pixel[] = [
        ...mockPixels,
        {
          id: '5',
          frame_id: 'frame-1',
          x: 10, // Outside bounds
          y: 10, // Outside bounds
          color: 0xFFFFFFFF,
          contributor_handle: 'user4',
          placed_at: '2024-01-01T00:04:00Z'
        }
      ]
      
      const compressed = CompressionUtils.compressPixelData(pixelsWithOutOfBounds, frameWidth, frameHeight)
      
      expect(compressed).toBeInstanceOf(Uint8Array)
      expect(compressed.length).toBeGreaterThan(0)
    })
  })

  describe('decompressPixelData', () => {
    test('decompresses data correctly', () => {
      const frameWidth = 4
      const frameHeight = 4
      
      // Compress first
      const compressed = CompressionUtils.compressPixelData(mockPixels, frameWidth, frameHeight)
      
      // Then decompress
      const decompressed = CompressionUtils.decompressPixelData(compressed, frameWidth, frameHeight)
      
      expect(Array.isArray(decompressed)).toBe(true)
      
      // Check that non-transparent pixels are preserved
      const nonTransparentPixels = decompressed.filter(p => p.color !== 0x00000000)
      expect(nonTransparentPixels.length).toBeGreaterThan(0)
      
      // Check that colors are preserved
      const colors = nonTransparentPixels.map(p => p.color)
      expect(colors).toContain(0xFFFF0000) // Red
      expect(colors).toContain(0xFF00FF00) // Green
      expect(colors).toContain(0xFF0000FF) // Blue
    })

    test('handles empty compressed data', () => {
      const frameWidth = 2
      const frameHeight = 2
      
      // Compress empty pixel array
      const compressed = CompressionUtils.compressPixelData([], frameWidth, frameHeight)
      
      // Decompress
      const decompressed = CompressionUtils.decompressPixelData(compressed, frameWidth, frameHeight)
      
      expect(Array.isArray(decompressed)).toBe(true)
      // Should only contain transparent pixels (which are filtered out)
      expect(decompressed.length).toBe(0)
    })

    test('throws error for dimension mismatch', () => {
      const frameWidth = 4
      const frameHeight = 4
      
      // Compress with one size
      const compressed = CompressionUtils.compressPixelData(mockPixels, frameWidth, frameHeight)
      
      // Try to decompress with different size
      expect(() => {
        CompressionUtils.decompressPixelData(compressed, 2, 2)
      }).toThrow('Frame dimensions mismatch')
    })
  })

  describe('round-trip compression', () => {
    test('preserves pixel data through compression and decompression', () => {
      const frameWidth = 8
      const frameHeight = 8
      
      // Create a more complex pixel pattern
      const complexPixels: Pixel[] = []
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          complexPixels.push({
            id: `${x}-${y}`,
            frame_id: 'frame-1',
            x,
            y,
            color: x === y ? 0xFFFF0000 : 0xFF00FF00, // Diagonal pattern
            contributor_handle: 'user1',
            placed_at: '2024-01-01T00:00:00Z'
          })
        }
      }
      
      // Compress and decompress
      const compressed = CompressionUtils.compressPixelData(complexPixels, frameWidth, frameHeight)
      const decompressed = CompressionUtils.decompressPixelData(compressed, frameWidth, frameHeight)
      
      // Check that all original pixels are preserved
      for (const originalPixel of complexPixels) {
        const decompressedPixel = decompressed.find(p => p.x === originalPixel.x && p.y === originalPixel.y)
        expect(decompressedPixel).toBeDefined()
        expect(decompressedPixel?.color).toBe(originalPixel.color)
      }
    })

    test('handles large frames efficiently', () => {
      const frameWidth = 128
      const frameHeight = 128
      
      // Create sparse pixel data (only a few pixels in a large frame)
      const sparsePixels: Pixel[] = [
        {
          id: '1',
          frame_id: 'frame-1',
          x: 0,
          y: 0,
          color: 0xFFFF0000,
          contributor_handle: 'user1',
          placed_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          frame_id: 'frame-1',
          x: 127,
          y: 127,
          color: 0xFF00FF00,
          contributor_handle: 'user2',
          placed_at: '2024-01-01T00:01:00Z'
        }
      ]
      
      const compressed = CompressionUtils.compressPixelData(sparsePixels, frameWidth, frameHeight)
      const decompressed = CompressionUtils.decompressPixelData(compressed, frameWidth, frameHeight)
      
      // Should have exactly 2 non-transparent pixels
      expect(decompressed.length).toBe(2)
      
      // Check corner pixels
      const topLeft = decompressed.find(p => p.x === 0 && p.y === 0)
      const bottomRight = decompressed.find(p => p.x === 127 && p.y === 127)
      
      expect(topLeft?.color).toBe(0xFFFF0000)
      expect(bottomRight?.color).toBe(0xFF00FF00)
    })
  })

  describe('getCompressionRatio', () => {
    test('calculates compression ratio correctly', () => {
      const originalSize = 1000
      const compressedSize = 300
      
      const ratio = CompressionUtils.getCompressionRatio(originalSize, compressedSize)
      
      expect(ratio).toBe(70) // 70% compression
    })

    test('handles zero original size', () => {
      const ratio = CompressionUtils.getCompressionRatio(0, 100)
      expect(ratio).toBe(0)
    })

    test('handles no compression', () => {
      const ratio = CompressionUtils.getCompressionRatio(1000, 1000)
      expect(ratio).toBe(0)
    })

    test('handles expansion (negative compression)', () => {
      const ratio = CompressionUtils.getCompressionRatio(1000, 1200)
      expect(ratio).toBe(-20) // 20% expansion
    })
  })

  describe('estimateUncompressedSize', () => {
    test('estimates size correctly', () => {
      const frameWidth = 128
      const frameHeight = 72
      
      const estimatedSize = CompressionUtils.estimateUncompressedSize(frameWidth, frameHeight)
      
      // 128 * 72 * 4 bytes per pixel
      expect(estimatedSize).toBe(36864)
    })

    test('handles small frames', () => {
      const estimatedSize = CompressionUtils.estimateUncompressedSize(1, 1)
      expect(estimatedSize).toBe(4)
    })

    test('handles large frames', () => {
      const estimatedSize = CompressionUtils.estimateUncompressedSize(512, 288)
      expect(estimatedSize).toBe(589824) // 512 * 288 * 4
    })
  })

  describe('compression efficiency', () => {
    test('achieves good compression for sparse data', () => {
      const frameWidth = 64
      const frameHeight = 64
      
      // Create very sparse data (only 4 pixels in 64x64 frame)
      const sparsePixels: Pixel[] = [
        { id: '1', frame_id: 'f1', x: 0, y: 0, color: 0xFFFF0000, contributor_handle: 'u1', placed_at: null },
        { id: '2', frame_id: 'f1', x: 63, y: 0, color: 0xFF00FF00, contributor_handle: 'u1', placed_at: null },
        { id: '3', frame_id: 'f1', x: 0, y: 63, color: 0xFF0000FF, contributor_handle: 'u1', placed_at: null },
        { id: '4', frame_id: 'f1', x: 63, y: 63, color: 0xFFFFFF00, contributor_handle: 'u1', placed_at: null }
      ]
      
      const compressed = CompressionUtils.compressPixelData(sparsePixels, frameWidth, frameHeight)
      const originalSize = CompressionUtils.estimateUncompressedSize(frameWidth, frameHeight)
      const compressionRatio = CompressionUtils.getCompressionRatio(originalSize, compressed.length)
      
      // Should achieve significant compression for sparse data
      expect(compressionRatio).toBeGreaterThan(50) // At least 50% compression
    })

    test('handles repetitive patterns efficiently', () => {
      const frameWidth = 32
      const frameHeight = 32
      
      // Create repetitive pattern (checkerboard)
      const patternPixels: Pixel[] = []
      for (let y = 0; y < frameHeight; y++) {
        for (let x = 0; x < frameWidth; x++) {
          if ((x + y) % 2 === 0) {
            patternPixels.push({
              id: `${x}-${y}`,
              frame_id: 'f1',
              x,
              y,
              color: 0xFFFFFFFF, // White
              contributor_handle: 'u1',
              placed_at: null
            })
          }
        }
      }
      
      const compressed = CompressionUtils.compressPixelData(patternPixels, frameWidth, frameHeight)
      const decompressed = CompressionUtils.decompressPixelData(compressed, frameWidth, frameHeight)
      
      // Should preserve the pattern
      expect(decompressed.length).toBe(patternPixels.length)
      
      // Verify checkerboard pattern is preserved
      for (const pixel of decompressed) {
        expect((pixel.x + pixel.y) % 2).toBe(0)
        expect(pixel.color).toBe(0xFFFFFFFF)
      }
    })
  })
})