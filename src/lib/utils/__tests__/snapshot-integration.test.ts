/**
 * Integration tests for snapshot creation and loading performance
 */

// Integration tests for snapshot system
import { SnapshotManager } from '../snapshot-manager'
import { CompressionUtils } from '../compression-utils'
import { BackgroundJobManager } from '../background-jobs'
import { Pixel, Frame, FrameSnapshot } from '@/lib/types'

// Mock Supabase for integration tests
jest.mock('@/lib/supabase/client', () => ({
  createServerClient: () => ({
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  })
}))

describe('Snapshot Integration Tests', () => {
  let snapshotManager: SnapshotManager
  let jobManager: BackgroundJobManager
  let mockSupabase: any

  const testFrame: Frame = {
    id: 'test-frame-1',
    handle: 'integration-test',
    title: 'Integration Test Frame',
    description: 'Frame for integration testing',
    keywords: ['test', 'integration'],
    owner_handle: 'testuser',
    width: 64,
    height: 64,
    permissions: 'open',
    is_frozen: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    snapshotManager = new SnapshotManager()
    jobManager = new BackgroundJobManager()
    mockSupabase = (snapshotManager as any).supabase
    jest.clearAllMocks()
  })

  afterEach(() => {
    jobManager.stopProcessing()
  })

  describe('Snapshot Creation Performance', () => {
    test('creates snapshot for large frame efficiently', async () => {
      // Generate a large number of pixels for performance testing
      const pixelCount = 1000
      const pixels: Pixel[] = []

      for (let i = 0; i < pixelCount; i++) {
        pixels.push({
          id: `pixel-${i}`,
          frame_id: testFrame.id,
          x: i % testFrame.width,
          y: Math.floor(i / testFrame.width) % testFrame.height,
          color: i % 2 === 0 ? 0xFFFF0000 : 0xFF00FF00, // Alternating red/green
          contributor_handle: `user${i % 10}`,
          placed_at: new Date(Date.now() - (pixelCount - i) * 1000).toISOString()
        })
      }

      // Mock database responses
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'frames') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: testFrame, error: null })
              })
            })
          }
        }
        if (table === 'pixels') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: pixels, error: null })
              })
            })
          }
        }
        if (table === 'frame_snapshots') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'snapshot-1',
                    frame_id: testFrame.id,
                    snapshot_data: 'compressed-data',
                    pixel_count: pixelCount,
                    created_at: new Date().toISOString()
                  },
                  error: null
                })
              })
            })
          }
        }
        return {}
      })

      const startTime = performance.now()
      const snapshot = await snapshotManager.createSnapshot(testFrame.id)
      const endTime = performance.now()

      const executionTime = endTime - startTime

      expect(snapshot).toBeDefined()
      expect(snapshot.pixel_count).toBe(pixelCount)
      expect(executionTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    test('compression achieves good ratio for sparse data', () => {
      // Create sparse pixel data (only corners of a large frame)
      const frameWidth = 128
      const frameHeight = 128
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
          x: frameWidth - 1,
          y: 0,
          color: 0xFF00FF00,
          contributor_handle: 'user2',
          placed_at: '2024-01-01T00:01:00Z'
        },
        {
          id: '3',
          frame_id: 'frame-1',
          x: 0,
          y: frameHeight - 1,
          color: 0xFF0000FF,
          contributor_handle: 'user3',
          placed_at: '2024-01-01T00:02:00Z'
        },
        {
          id: '4',
          frame_id: 'frame-1',
          x: frameWidth - 1,
          y: frameHeight - 1,
          color: 0xFFFFFF00,
          contributor_handle: 'user4',
          placed_at: '2024-01-01T00:03:00Z'
        }
      ]

      const compressed = CompressionUtils.compressPixelData(sparsePixels, frameWidth, frameHeight)
      const originalSize = CompressionUtils.estimateUncompressedSize(frameWidth, frameHeight)
      const compressionRatio = CompressionUtils.getCompressionRatio(originalSize, compressed.length)

      expect(compressionRatio).toBeGreaterThan(80) // Should achieve >80% compression for sparse data
    })

    test('compression handles dense data efficiently', () => {
      // Create dense pixel data (checkerboard pattern)
      const frameWidth = 32
      const frameHeight = 32
      const densePixels: Pixel[] = []

      for (let y = 0; y < frameHeight; y++) {
        for (let x = 0; x < frameWidth; x++) {
          if ((x + y) % 2 === 0) {
            densePixels.push({
              id: `${x}-${y}`,
              frame_id: 'frame-1',
              x,
              y,
              color: 0xFFFFFFFF, // White
              contributor_handle: 'user1',
              placed_at: '2024-01-01T00:00:00Z'
            })
          }
        }
      }

      const startTime = performance.now()
      const compressed = CompressionUtils.compressPixelData(densePixels, frameWidth, frameHeight)
      const compressionTime = performance.now() - startTime

      const decompressStartTime = performance.now()
      const decompressed = CompressionUtils.decompressPixelData(compressed, frameWidth, frameHeight)
      const decompressionTime = performance.now() - decompressStartTime

      expect(compressionTime).toBeLessThan(100) // Should compress within 100ms
      expect(decompressionTime).toBeLessThan(100) // Should decompress within 100ms
      expect(decompressed.length).toBe(densePixels.length)
    })
  })

  describe('Snapshot Loading Performance', () => {
    test('loads frame state efficiently with snapshot', async () => {
      const basePixelCount = 500
      const recentPixelCount = 50

      // Create base pixels for snapshot
      const basePixels: Pixel[] = []
      for (let i = 0; i < basePixelCount; i++) {
        basePixels.push({
          id: `base-${i}`,
          frame_id: testFrame.id,
          x: i % testFrame.width,
          y: Math.floor(i / testFrame.width) % testFrame.height,
          color: 0xFFFF0000,
          contributor_handle: 'user1',
          placed_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        })
      }

      // Create recent pixels
      const recentPixels: Pixel[] = []
      for (let i = 0; i < recentPixelCount; i++) {
        recentPixels.push({
          id: `recent-${i}`,
          frame_id: testFrame.id,
          x: (i + basePixelCount) % testFrame.width,
          y: Math.floor((i + basePixelCount) / testFrame.width) % testFrame.height,
          color: 0xFF00FF00,
          contributor_handle: 'user2',
          placed_at: new Date(Date.now() - i * 1000).toISOString()
        })
      }

      // Create compressed snapshot data
      const compressedData = CompressionUtils.compressPixelData(basePixels, testFrame.width, testFrame.height)
      const snapshotDataString = Buffer.from(compressedData).toString('base64')

      const mockSnapshot: FrameSnapshot = {
        id: 'snapshot-1',
        frame_id: testFrame.id,
        snapshot_data: snapshotDataString,
        pixel_count: basePixelCount,
        created_at: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
      }

      // Mock database responses
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'frames') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: testFrame, error: null })
              })
            })
          }
        }
        if (table === 'frame_snapshots') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({ data: mockSnapshot, error: null })
                  })
                })
              })
            })
          }
        }
        if (table === 'pixels') {
          return {
            select: () => ({
              eq: () => ({
                gt: () => ({
                  order: () => Promise.resolve({ data: recentPixels, error: null })
                })
              })
            })
          }
        }
        return {}
      })

      const startTime = performance.now()
      const frameState = await snapshotManager.loadFrameState(testFrame.id)
      const loadTime = performance.now() - startTime

      expect(frameState.frame).toEqual(testFrame)
      expect(frameState.snapshot).toEqual(mockSnapshot)
      expect(frameState.basePixels.length).toBeGreaterThan(0)
      expect(frameState.recentPixels).toEqual(recentPixels)
      expect(loadTime).toBeLessThan(1000) // Should load within 1 second
    })

    test('handles large recent pixel sets efficiently', async () => {
      const largeRecentPixelCount = 2000

      // Create a large set of recent pixels
      const recentPixels: Pixel[] = []
      for (let i = 0; i < largeRecentPixelCount; i++) {
        recentPixels.push({
          id: `recent-${i}`,
          frame_id: testFrame.id,
          x: i % testFrame.width,
          y: Math.floor(i / testFrame.width) % testFrame.height,
          color: i % 3 === 0 ? 0xFFFF0000 : i % 3 === 1 ? 0xFF00FF00 : 0xFF0000FF,
          contributor_handle: `user${i % 5}`,
          placed_at: new Date(Date.now() - i * 100).toISOString()
        })
      }

      const mockSnapshot: FrameSnapshot = {
        id: 'snapshot-1',
        frame_id: testFrame.id,
        snapshot_data: Buffer.from(CompressionUtils.compressPixelData([], testFrame.width, testFrame.height)).toString('base64'),
        pixel_count: 0,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'frames') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: testFrame, error: null })
              })
            })
          }
        }
        if (table === 'frame_snapshots') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({ data: mockSnapshot, error: null })
                  })
                })
              })
            })
          }
        }
        if (table === 'pixels') {
          return {
            select: () => ({
              eq: () => ({
                gt: () => ({
                  order: () => Promise.resolve({ data: recentPixels, error: null })
                })
              })
            })
          }
        }
        return {}
      })

      const startTime = performance.now()
      const frameState = await snapshotManager.loadFrameState(testFrame.id)
      const loadTime = performance.now() - startTime

      expect(frameState.recentPixels.length).toBe(largeRecentPixelCount)
      expect(loadTime).toBeLessThan(2000) // Should handle large sets within 2 seconds
    })
  })

  describe('Background Job Performance', () => {
    test('processes multiple snapshot jobs efficiently', async () => {
      const jobCount = 10
      const frameIds = Array.from({ length: jobCount }, (_, i) => `frame-${i}`)

      // Mock successful snapshot creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'frames') {
          return {
            select: () => ({
              eq: (field: string, value: string) => ({
                single: () => Promise.resolve({
                  data: { ...testFrame, id: value },
                  error: null
                })
              })
            })
          }
        }
        if (table === 'pixels') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null })
              })
            })
          }
        }
        if (table === 'frame_snapshots') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: 'snapshot-1',
                    frame_id: 'frame-1',
                    snapshot_data: 'data',
                    pixel_count: 0,
                    created_at: new Date().toISOString()
                  },
                  error: null
                })
              })
            })
          }
        }
        return {}
      })

      // Add all jobs
      const startTime = performance.now()
      const jobIds = frameIds.map(frameId => jobManager.addSnapshotJob(frameId))
      const queueTime = performance.now() - startTime

      expect(queueTime).toBeLessThan(100) // Should queue jobs quickly
      expect(jobManager.getQueueStatus().totalJobs).toBe(jobCount)

      // Process jobs (in test environment, we'll simulate this)
      const processingStartTime = performance.now()
      
      // Simulate job processing by manually executing them
      for (const jobId of jobIds) {
        const job = jobManager.getJob(jobId)
        if (job) {
          await snapshotManager.createSnapshot(job.frameId)
          jobManager.removeJob(jobId)
        }
      }
      
      const processingTime = performance.now() - processingStartTime

      expect(processingTime).toBeLessThan(5000) // Should process all jobs within 5 seconds
      expect(jobManager.getQueueStatus().totalJobs).toBe(0)
    })
  })

  describe('Memory Usage', () => {
    test('compression reduces memory footprint significantly', () => {
      const frameWidth = 256
      const frameHeight = 256
      const pixelCount = 10000 // Partial fill

      // Create random pixel data
      const pixels: Pixel[] = []
      for (let i = 0; i < pixelCount; i++) {
        pixels.push({
          id: `pixel-${i}`,
          frame_id: 'frame-1',
          x: Math.floor(Math.random() * frameWidth),
          y: Math.floor(Math.random() * frameHeight),
          color: Math.floor(Math.random() * 0xFFFFFF) | 0xFF000000, // Random color with full alpha
          contributor_handle: 'user1',
          placed_at: '2024-01-01T00:00:00Z'
        })
      }

      const originalSize = CompressionUtils.estimateUncompressedSize(frameWidth, frameHeight)
      const compressed = CompressionUtils.compressPixelData(pixels, frameWidth, frameHeight)
      const compressionRatio = CompressionUtils.getCompressionRatio(originalSize, compressed.length)

      // For a partially filled large frame, we should achieve significant compression
      expect(compressionRatio).toBeGreaterThan(60) // At least 60% compression
      expect(compressed.length).toBeLessThan(originalSize / 2) // Less than half the original size
    })

    test('decompression handles large datasets without memory issues', () => {
      const frameWidth = 128
      const frameHeight = 128
      const pixelCount = frameWidth * frameHeight // Full frame

      // Create full frame data
      const pixels: Pixel[] = []
      for (let y = 0; y < frameHeight; y++) {
        for (let x = 0; x < frameWidth; x++) {
          pixels.push({
            id: `${x}-${y}`,
            frame_id: 'frame-1',
            x,
            y,
            color: ((x + y) % 2 === 0) ? 0xFFFFFFFF : 0xFF000000, // Checkerboard
            contributor_handle: 'user1',
            placed_at: '2024-01-01T00:00:00Z'
          })
        }
      }

      const compressed = CompressionUtils.compressPixelData(pixels, frameWidth, frameHeight)
      
      // Measure memory usage during decompression (approximate)
      const memoryBefore = process.memoryUsage().heapUsed
      const decompressed = CompressionUtils.decompressPixelData(compressed, frameWidth, frameHeight)
      const memoryAfter = process.memoryUsage().heapUsed
      
      const memoryIncrease = memoryAfter - memoryBefore

      expect(decompressed.length).toBe(pixelCount)
      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })
})