/**
 * Unit tests for snapshot manager
 */

import { Pixel, Frame, FrameSnapshot } from '@/lib/types'

// Mock the Supabase client module
jest.mock('@/lib/supabase/client', () => ({
  createServerClient: () => ({
    from: jest.fn()
  })
}))

// Import after mocking
import { SnapshotManager } from '../snapshot-manager'
import { CompressionUtils } from '../compression-utils'

describe('SnapshotManager', () => {
  let snapshotManager: SnapshotManager
  let mockSupabaseClient: any
  
  const mockFrame: Frame = {
    id: 'frame-1',
    handle: 'test-frame',
    title: 'Test Frame',
    description: 'A test frame',
    keywords: ['test'],
    owner_handle: 'testuser',
    width: 4,
    height: 4,
    permissions: 'open',
    is_frozen: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  const mockPixels: Pixel[] = [
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
      x: 1,
      y: 0,
      color: 0xFF00FF00,
      contributor_handle: 'user2',
      placed_at: '2024-01-01T00:01:00Z'
    }
  ]

  beforeEach(() => {
    snapshotManager = new SnapshotManager()
    // Get the mocked client
    mockSupabaseClient = (snapshotManager as any).supabase
    jest.clearAllMocks()
  })

  describe('createSnapshot', () => {
    test('creates snapshot successfully', async () => {
      const mockSnapshot: FrameSnapshot = {
        id: 'snapshot-1',
        frame_id: 'frame-1',
        snapshot_data: 'compressed-data',
        pixel_count: 2,
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock database calls
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'frames') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockFrame, error: null })
              })
            })
          }
        }
        if (table === 'pixels') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: mockPixels, error: null })
              })
            })
          }
        }
        if (table === 'frame_snapshots') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockSnapshot, error: null })
              })
            })
          }
        }
        return {}
      })

      const result = await snapshotManager.createSnapshot('frame-1')

      expect(result).toEqual(mockSnapshot)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('frames')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pixels')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('frame_snapshots')
    })

    test('throws error when frame not found', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'frames') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: { message: 'Frame not found' } })
              })
            })
          }
        }
        return {}
      })

      await expect(snapshotManager.createSnapshot('nonexistent-frame')).rejects.toThrow('Frame not found')
    })

    test('throws error when pixel fetch fails', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'frames') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockFrame, error: null })
              })
            })
          }
        }
        if (table === 'pixels') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: null, error: { message: 'Database error' } })
              })
            })
          }
        }
        return {}
      })

      await expect(snapshotManager.createSnapshot('frame-1')).rejects.toThrow('Failed to fetch pixels')
    })
  })

  describe('getLatestSnapshot', () => {
    test('returns latest snapshot', async () => {
      const mockSnapshot: FrameSnapshot = {
        id: 'snapshot-1',
        frame_id: 'frame-1',
        snapshot_data: 'compressed-data',
        pixel_count: 2,
        created_at: '2024-01-01T00:00:00Z'
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: mockSnapshot, error: null })
              })
            })
          })
        })
      }))

      const result = await snapshotManager.getLatestSnapshot('frame-1')

      expect(result).toEqual(mockSnapshot)
    })

    test('returns null when no snapshot exists', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null })
              })
            })
          })
        })
      }))

      const result = await snapshotManager.getLatestSnapshot('frame-1')

      expect(result).toBeNull()
    })

    test('throws error on database error', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: { message: 'Database error' } })
              })
            })
          })
        })
      }))

      await expect(snapshotManager.getLatestSnapshot('frame-1')).rejects.toThrow('Failed to fetch snapshot')
    })
  })

  describe('getPixelsSince', () => {
    test('returns pixels since timestamp', async () => {
      const recentPixels = [mockPixels[1]] // Only the second pixel

      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            gt: () => ({
              order: () => Promise.resolve({ data: recentPixels, error: null })
            })
          })
        })
      }))

      const result = await snapshotManager.getPixelsSince('frame-1', '2024-01-01T00:00:30Z')

      expect(result).toEqual(recentPixels)
    })

    test('returns empty array when no recent pixels', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            gt: () => ({
              order: () => Promise.resolve({ data: [], error: null })
            })
          })
        })
      }))

      const result = await snapshotManager.getPixelsSince('frame-1', '2024-01-01T01:00:00Z')

      expect(result).toEqual([])
    })
  })

  describe('loadFrameState', () => {
    test('loads frame state with snapshot and recent pixels', async () => {
      const mockSnapshot: FrameSnapshot = {
        id: 'snapshot-1',
        frame_id: 'frame-1',
        snapshot_data: Buffer.from(CompressionUtils.compressPixelData([mockPixels[0]], 4, 4)).toString('base64'),
        pixel_count: 1,
        created_at: '2024-01-01T00:00:30Z'
      }

      const recentPixels = [mockPixels[1]]

      // Mock frame fetch
      const mockFrameQuery = {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockFrame, error: null })
          })
        })
      }

      // Mock snapshot fetch
      const mockSnapshotQuery = {
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

      // Mock recent pixels fetch
      const mockPixelsQuery = {
        select: () => ({
          eq: () => ({
            gt: () => ({
              order: () => Promise.resolve({ data: recentPixels, error: null })
            })
          })
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'frames') return mockFrameQuery
        if (table === 'frame_snapshots') return mockSnapshotQuery
        if (table === 'pixels') return mockPixelsQuery
        return {}
      })

      const result = await snapshotManager.loadFrameState('frame-1')

      expect(result.frame).toEqual(mockFrame)
      expect(result.snapshot).toEqual(mockSnapshot)
      expect(result.recentPixels).toEqual(recentPixels)
      expect(result.basePixels.length).toBeGreaterThan(0)
      expect(result.basePixels[0].frame_id).toBe('frame-1')
    })

    test('loads frame state without snapshot', async () => {
      // Mock frame fetch
      const mockFrameQuery = {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockFrame, error: null })
          })
        })
      }

      // Mock no snapshot
      const mockSnapshotQuery = {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null })
              })
            })
          })
        })
      }

      // Mock all pixels fetch
      const mockPixelsQuery = {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockPixels, error: null })
          })
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'frames') return mockFrameQuery
        if (table === 'frame_snapshots') return mockSnapshotQuery
        if (table === 'pixels') return mockPixelsQuery
        return {}
      })

      const result = await snapshotManager.loadFrameState('frame-1')

      expect(result.frame).toEqual(mockFrame)
      expect(result.snapshot).toBeNull()
      expect(result.basePixels).toEqual([])
      expect(result.recentPixels).toEqual(mockPixels)
    })
  })

  describe('compressPixelData', () => {
    test('compresses pixel data', () => {
      const compressed = snapshotManager.compressPixelData(mockPixels, 4, 4)

      expect(compressed).toBeInstanceOf(Uint8Array)
      expect(compressed.length).toBeGreaterThan(0)
    })
  })

  describe('decompressPixelData', () => {
    test('decompresses pixel data from base64', () => {
      const compressed = CompressionUtils.compressPixelData(mockPixels, 4, 4)
      const base64Data = Buffer.from(compressed).toString('base64')

      const decompressed = snapshotManager.decompressPixelData(base64Data, 4, 4)

      expect(Array.isArray(decompressed)).toBe(true)
      expect(decompressed.length).toBeGreaterThan(0)
    })
  })

  describe('shouldCreateSnapshot', () => {
    test('returns true when no snapshot exists and enough pixels', async () => {
      // Mock no snapshot
      const mockSnapshotQuery = {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null })
              })
            })
          })
        })
      }

      // Mock pixel count
      const mockPixelCountQuery = {
        select: () => ({
          eq: () => Promise.resolve({ count: 150, error: null })
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'frame_snapshots') return mockSnapshotQuery
        if (table === 'pixels') return mockPixelCountQuery
        return {}
      })

      const result = await snapshotManager.shouldCreateSnapshot('frame-1')

      expect(result).toBe(true)
    })

    test('returns false when no snapshot exists and not enough pixels', async () => {
      // Mock no snapshot
      const mockSnapshotQuery = {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null })
              })
            })
          })
        })
      }

      // Mock low pixel count
      const mockPixelCountQuery = {
        select: () => ({
          eq: () => Promise.resolve({ count: 50, error: null })
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'frame_snapshots') return mockSnapshotQuery
        if (table === 'pixels') return mockPixelCountQuery
        return {}
      })

      const result = await snapshotManager.shouldCreateSnapshot('frame-1')

      expect(result).toBe(false)
    })

    test('returns true when snapshot exists and pixel threshold exceeded', async () => {
      const oldSnapshot: FrameSnapshot = {
        id: 'snapshot-1',
        frame_id: 'frame-1',
        snapshot_data: 'data',
        pixel_count: 100,
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock existing snapshot
      const mockSnapshotQuery = {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: oldSnapshot, error: null })
              })
            })
          })
        })
      }

      // Mock many recent pixels
      const manyRecentPixels = Array.from({ length: 1500 }, (_, i) => ({
        ...mockPixels[0],
        id: `pixel-${i}`,
        x: i % 4,
        y: Math.floor(i / 4) % 4
      }))

      const mockPixelsQuery = {
        select: () => ({
          eq: () => ({
            gt: () => ({
              order: () => Promise.resolve({ data: manyRecentPixels, error: null })
            })
          })
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'frame_snapshots') return mockSnapshotQuery
        if (table === 'pixels') return mockPixelsQuery
        return {}
      })

      const result = await snapshotManager.shouldCreateSnapshot('frame-1')

      expect(result).toBe(true)
    })
  })

  describe('cleanupOldSnapshots', () => {
    test('deletes old snapshots beyond keep count', async () => {
      const snapshots = [
        { id: 'snap-1', created_at: '2024-01-03T00:00:00Z' },
        { id: 'snap-2', created_at: '2024-01-02T00:00:00Z' },
        { id: 'snap-3', created_at: '2024-01-01T00:00:00Z' },
        { id: 'snap-4', created_at: '2023-12-31T00:00:00Z' },
        { id: 'snap-5', created_at: '2023-12-30T00:00:00Z' }
      ]

      const mockSelectQuery = {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: snapshots, error: null })
          })
        })
      }

      const mockDeleteQuery = {
        delete: () => ({
          in: () => Promise.resolve({ error: null })
        })
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        ...mockSelectQuery,
        ...mockDeleteQuery
      }))

      const deletedCount = await snapshotManager.cleanupOldSnapshots('frame-1', 3)

      expect(deletedCount).toBe(2) // Should delete 2 oldest snapshots
    })

    test('returns 0 when no cleanup needed', async () => {
      const snapshots = [
        { id: 'snap-1', created_at: '2024-01-01T00:00:00Z' }
      ]

      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: snapshots, error: null })
          })
        })
      }))

      const deletedCount = await snapshotManager.cleanupOldSnapshots('frame-1', 3)

      expect(deletedCount).toBe(0)
    })
  })

  describe('getSnapshotStats', () => {
    test('calculates snapshot statistics correctly', async () => {
      const snapshots: FrameSnapshot[] = [
        {
          id: 'snap-1',
          frame_id: 'frame-1',
          snapshot_data: Buffer.from('test-data-1').toString('base64'),
          pixel_count: 100,
          created_at: '2024-01-02T00:00:00Z'
        },
        {
          id: 'snap-2',
          frame_id: 'frame-1',
          snapshot_data: Buffer.from('test-data-2').toString('base64'),
          pixel_count: 200,
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: snapshots, error: null })
          })
        })
      }))

      const stats = await snapshotManager.getSnapshotStats('frame-1')

      expect(stats.totalSnapshots).toBe(2)
      expect(stats.latestSnapshot).toEqual(snapshots[0])
      expect(stats.totalCompressedSize).toBeGreaterThan(0)
      expect(stats.averageCompressionRatio).toBeGreaterThanOrEqual(0)
    })

    test('handles no snapshots', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        })
      }))

      const stats = await snapshotManager.getSnapshotStats('frame-1')

      expect(stats.totalSnapshots).toBe(0)
      expect(stats.latestSnapshot).toBeNull()
      expect(stats.totalCompressedSize).toBe(0)
      expect(stats.averageCompressionRatio).toBe(0)
    })
  })
})