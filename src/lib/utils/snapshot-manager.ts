/**
 * Frame snapshot management system
 * Handles creation, retrieval, and cleanup of frame snapshots
 */

import { createServerClient } from '@/lib/supabase/client'
import { Pixel, FrameSnapshot, FrameSnapshotInsert, Frame } from '@/lib/types'
import { CompressionUtils } from './compression-utils'

/**
 * Snapshot manager for frame data compression and storage
 */
export class SnapshotManager {
  private supabase = createServerClient()

  /**
   * Create a new snapshot for a frame
   * @param frameId - Frame ID to create snapshot for
   * @returns Created snapshot record
   */
  async createSnapshot(frameId: string): Promise<FrameSnapshot> {
    // Get frame metadata
    const { data: frame, error: frameError } = await this.supabase
      .from('frames')
      .select('*')
      .eq('id', frameId)
      .single()

    if (frameError || !frame) {
      throw new Error(`Frame not found: ${frameId}`)
    }

    // Get all pixels for the frame
    const { data: pixels, error: pixelsError } = await this.supabase
      .from('pixels')
      .select('*')
      .eq('frame_id', frameId)
      .order('placed_at', { ascending: true })

    if (pixelsError) {
      throw new Error(`Failed to fetch pixels: ${pixelsError.message}`)
    }

    // Compress pixel data
    const compressedData = this.compressPixelData(pixels || [], frame.width, frame.height)
    
    // Convert Uint8Array to base64 string for database storage
    const snapshotDataString = Buffer.from(compressedData).toString('base64')

    // Create snapshot record
    const snapshotInsert: FrameSnapshotInsert = {
      frame_id: frameId,
      snapshot_data: snapshotDataString,
      pixel_count: pixels?.length || 0
    }

    const { data: snapshot, error: snapshotError } = await this.supabase
      .from('frame_snapshots')
      .insert(snapshotInsert)
      .select()
      .single()

    if (snapshotError || !snapshot) {
      throw new Error(`Failed to create snapshot: ${snapshotError?.message}`)
    }

    return snapshot
  }

  /**
   * Get the latest snapshot for a frame
   * @param frameId - Frame ID to get snapshot for
   * @returns Latest snapshot or null if none exists
   */
  async getLatestSnapshot(frameId: string): Promise<FrameSnapshot | null> {
    const { data: snapshot, error } = await this.supabase
      .from('frame_snapshots')
      .select('*')
      .eq('frame_id', frameId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch snapshot: ${error.message}`)
    }

    return snapshot
  }

  /**
   * Get pixels placed since a specific timestamp
   * @param frameId - Frame ID
   * @param since - Timestamp to get pixels since
   * @returns Array of recent pixels
   */
  async getPixelsSince(frameId: string, since: string): Promise<Pixel[]> {
    const { data: pixels, error } = await this.supabase
      .from('pixels')
      .select('*')
      .eq('frame_id', frameId)
      .gt('placed_at', since)
      .order('placed_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch recent pixels: ${error.message}`)
    }

    return pixels || []
  }

  /**
   * Load complete frame state using snapshot + recent pixels
   * @param frameId - Frame ID to load
   * @returns Object with frame data, base pixels from snapshot, and recent pixels
   */
  async loadFrameState(frameId: string): Promise<{
    frame: Frame
    basePixels: Pixel[]
    recentPixels: Pixel[]
    snapshot: FrameSnapshot | null
  }> {
    // Get frame metadata
    const { data: frame, error: frameError } = await this.supabase
      .from('frames')
      .select('*')
      .eq('id', frameId)
      .single()

    if (frameError || !frame) {
      throw new Error(`Frame not found: ${frameId}`)
    }

    // Get latest snapshot
    const snapshot = await this.getLatestSnapshot(frameId)
    
    let basePixels: Pixel[] = []
    let recentPixels: Pixel[] = []

    if (snapshot) {
      // Decompress base pixels from snapshot
      basePixels = this.decompressPixelData(snapshot.snapshot_data, frame.width, frame.height)
      
      // Set frame_id for decompressed pixels
      basePixels.forEach(pixel => {
        pixel.frame_id = frameId
      })

      // Get pixels placed since snapshot
      recentPixels = await this.getPixelsSince(frameId, snapshot.created_at || new Date().toISOString())
    } else {
      // No snapshot exists, load all pixels as recent
      const { data: allPixels, error: pixelsError } = await this.supabase
        .from('pixels')
        .select('*')
        .eq('frame_id', frameId)
        .order('placed_at', { ascending: true })

      if (pixelsError) {
        throw new Error(`Failed to fetch pixels: ${pixelsError.message}`)
      }

      recentPixels = allPixels || []
    }

    return {
      frame,
      basePixels,
      recentPixels,
      snapshot
    }
  }

  /**
   * Compress pixel data using the compression utilities
   * @param pixels - Array of pixels to compress
   * @param frameWidth - Frame width
   * @param frameHeight - Frame height
   * @returns Compressed data as Uint8Array
   */
  compressPixelData(pixels: Pixel[], frameWidth: number, frameHeight: number): Uint8Array {
    return CompressionUtils.compressPixelData(pixels, frameWidth, frameHeight)
  }

  /**
   * Decompress pixel data from base64 string
   * @param snapshotData - Base64 encoded compressed data
   * @param frameWidth - Frame width
   * @param frameHeight - Frame height
   * @returns Array of decompressed pixels
   */
  decompressPixelData(snapshotData: string, frameWidth: number, frameHeight: number): Pixel[] {
    const compressedData = Buffer.from(snapshotData, 'base64')
    const uint8Array = new Uint8Array(compressedData)
    return CompressionUtils.decompressPixelData(uint8Array, frameWidth, frameHeight)
  }

  /**
   * Check if a frame needs a new snapshot based on activity
   * @param frameId - Frame ID to check
   * @returns True if snapshot should be created
   */
  async shouldCreateSnapshot(frameId: string): Promise<boolean> {
    const snapshot = await this.getLatestSnapshot(frameId)
    
    if (!snapshot) {
      // No snapshot exists, check if frame has enough pixels
      const { count } = await this.supabase
        .from('pixels')
        .select('*', { count: 'exact', head: true })
        .eq('frame_id', frameId)

      return (count || 0) >= 100 // Create snapshot after 100 pixels
    }

    // Check pixels since last snapshot
    const recentPixels = await this.getPixelsSince(frameId, snapshot.created_at || new Date().toISOString())
    
    // Create new snapshot if:
    // 1. More than 1000 pixels since last snapshot, OR
    // 2. More than 24 hours since last snapshot and frame is active
    const pixelThreshold = recentPixels.length >= 1000
    const timeThreshold = snapshot.created_at ? 
      (Date.now() - new Date(snapshot.created_at).getTime()) > 24 * 60 * 60 * 1000 &&
      recentPixels.length > 0 : false

    return pixelThreshold || timeThreshold
  }

  /**
   * Clean up old snapshots, keeping only the most recent ones
   * @param frameId - Frame ID to clean up snapshots for
   * @param keepCount - Number of snapshots to keep (default: 3)
   * @returns Number of snapshots deleted
   */
  async cleanupOldSnapshots(frameId: string, keepCount: number = 3): Promise<number> {
    // Get all snapshots for the frame, ordered by creation date
    const { data: snapshots, error } = await this.supabase
      .from('frame_snapshots')
      .select('id, created_at')
      .eq('frame_id', frameId)
      .order('created_at', { ascending: false })

    if (error || !snapshots) {
      throw new Error(`Failed to fetch snapshots for cleanup: ${error?.message}`)
    }

    // If we have more snapshots than we want to keep, delete the oldest ones
    if (snapshots.length > keepCount) {
      const snapshotsToDelete = snapshots.slice(keepCount)
      const idsToDelete = snapshotsToDelete.map(s => s.id)

      const { error: deleteError } = await this.supabase
        .from('frame_snapshots')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) {
        throw new Error(`Failed to delete old snapshots: ${deleteError.message}`)
      }

      return snapshotsToDelete.length
    }

    return 0
  }

  /**
   * Get snapshot statistics for a frame
   * @param frameId - Frame ID
   * @returns Snapshot statistics
   */
  async getSnapshotStats(frameId: string): Promise<{
    totalSnapshots: number
    latestSnapshot: FrameSnapshot | null
    totalCompressedSize: number
    averageCompressionRatio: number
  }> {
    const { data: snapshots, error } = await this.supabase
      .from('frame_snapshots')
      .select('*')
      .eq('frame_id', frameId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch snapshot stats: ${error.message}`)
    }

    const totalSnapshots = snapshots?.length || 0
    const latestSnapshot = snapshots?.[0] || null
    
    let totalCompressedSize = 0
    let totalCompressionRatio = 0

    if (snapshots) {
      for (const snapshot of snapshots) {
        const compressedSize = Buffer.from(snapshot.snapshot_data, 'base64').length
        totalCompressedSize += compressedSize
        
        // Estimate original size (4 bytes per pixel)
        const originalSize = snapshot.pixel_count * 4
        const ratio = CompressionUtils.getCompressionRatio(originalSize, compressedSize)
        totalCompressionRatio += ratio
      }
    }

    const averageCompressionRatio = totalSnapshots > 0 ? totalCompressionRatio / totalSnapshots : 0

    return {
      totalSnapshots,
      latestSnapshot,
      totalCompressedSize,
      averageCompressionRatio
    }
  }

  /**
   * Create snapshot if needed based on activity thresholds
   * @param frameId - Frame ID to check and potentially snapshot
   * @returns Created snapshot or null if not needed
   */
  async createSnapshotIfNeeded(frameId: string): Promise<FrameSnapshot | null> {
    const shouldCreate = await this.shouldCreateSnapshot(frameId)
    
    if (shouldCreate) {
      const snapshot = await this.createSnapshot(frameId)
      
      // Clean up old snapshots after creating new one
      await this.cleanupOldSnapshots(frameId)
      
      return snapshot
    }
    
    return null
  }
}

// Export a singleton instance
export const snapshotManager = new SnapshotManager()

// Export individual methods for convenience
export const {
  createSnapshot,
  getLatestSnapshot,
  loadFrameState,
  compressPixelData,
  decompressPixelData,
  shouldCreateSnapshot,
  cleanupOldSnapshots,
  getSnapshotStats,
  createSnapshotIfNeeded
} = snapshotManager