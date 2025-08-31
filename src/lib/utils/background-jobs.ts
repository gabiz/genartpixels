/**
 * Background job system for automatic snapshot generation
 * Handles queuing and processing of snapshot creation tasks
 */

import { snapshotManager } from './snapshot-manager'

/**
 * Job types for the background job system
 */
export type JobType = 'create-snapshot' | 'cleanup-snapshots'

/**
 * Job interface
 */
export interface Job {
  id: string
  type: JobType
  frameId: string
  priority: number
  createdAt: Date
  attempts: number
  maxAttempts: number
  data?: Record<string, unknown>
}

/**
 * Job result interface
 */
export interface JobResult {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Background job queue manager
 */
export class BackgroundJobManager {
  private jobs: Map<string, Job> = new Map()
  private processing = false
  private processingInterval: NodeJS.Timeout | null = null

  /**
   * Add a job to the queue
   * @param type - Job type
   * @param frameId - Frame ID for the job
   * @param priority - Job priority (higher = more important)
   * @param data - Additional job data
   * @returns Job ID
   */
  addJob(type: JobType, frameId: string, priority: number = 0, data?: Record<string, unknown>): string {
    const jobId = `${type}-${frameId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const job: Job = {
      id: jobId,
      type,
      frameId,
      priority,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      data
    }

    this.jobs.set(jobId, job)
    
    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing()
    }

    return jobId
  }

  /**
   * Add a snapshot creation job
   * @param frameId - Frame ID to create snapshot for
   * @param priority - Job priority
   * @returns Job ID
   */
  addSnapshotJob(frameId: string, priority: number = 0): string {
    return this.addJob('create-snapshot', frameId, priority)
  }

  /**
   * Add a snapshot cleanup job
   * @param frameId - Frame ID to cleanup snapshots for
   * @param keepCount - Number of snapshots to keep
   * @returns Job ID
   */
  addCleanupJob(frameId: string, keepCount: number = 3): string {
    return this.addJob('cleanup-snapshots', frameId, 0, { keepCount })
  }

  /**
   * Start processing jobs
   */
  private startProcessing(): void {
    if (this.processing) return

    this.processing = true
    this.processingInterval = setInterval(() => {
      this.processNextJob()
    }, 1000) // Process jobs every second
  }

  /**
   * Stop processing jobs
   */
  stopProcessing(): void {
    this.processing = false
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    if (this.jobs.size === 0) {
      this.stopProcessing()
      return
    }

    // Get the highest priority job
    const sortedJobs = Array.from(this.jobs.values()).sort((a, b) => {
      // Sort by priority (descending), then by creation time (ascending)
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    const job = sortedJobs[0]
    if (!job) return

    try {
      const result = await this.executeJob(job)
      
      if (result.success) {
        // Job completed successfully, remove from queue
        this.jobs.delete(job.id)
        console.log(`Job ${job.id} completed successfully`)
      } else {
        // Job failed, increment attempts
        job.attempts++
        
        if (job.attempts >= job.maxAttempts) {
          // Max attempts reached, remove from queue
          this.jobs.delete(job.id)
          console.error(`Job ${job.id} failed after ${job.maxAttempts} attempts: ${result.error}`)
        } else {
          // Retry later
          console.warn(`Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}): ${result.error}`)
        }
      }
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error)
      job.attempts++
      
      if (job.attempts >= job.maxAttempts) {
        this.jobs.delete(job.id)
      }
    }
  }

  /**
   * Execute a specific job
   * @param job - Job to execute
   * @returns Job result
   */
  private async executeJob(job: Job): Promise<JobResult> {
    switch (job.type) {
      case 'create-snapshot':
        return this.executeSnapshotJob(job)
      
      case 'cleanup-snapshots':
        return this.executeCleanupJob(job)
      
      default:
        return {
          success: false,
          error: `Unknown job type: ${job.type}`
        }
    }
  }

  /**
   * Execute a snapshot creation job
   * @param job - Snapshot job to execute
   * @returns Job result
   */
  private async executeSnapshotJob(job: Job): Promise<JobResult> {
    try {
      const snapshot = await snapshotManager.createSnapshot(job.frameId)
      
      return {
        success: true,
        data: { snapshotId: snapshot.id }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Execute a snapshot cleanup job
   * @param job - Cleanup job to execute
   * @returns Job result
   */
  private async executeCleanupJob(job: Job): Promise<JobResult> {
    try {
      const keepCount = (job.data?.keepCount as number) || 3
      const deletedCount = await snapshotManager.cleanupOldSnapshots(job.frameId, keepCount)
      
      return {
        success: true,
        data: { deletedCount }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get queue status
   * @returns Queue status information
   */
  getQueueStatus(): {
    totalJobs: number
    jobsByType: Record<JobType, number>
    processing: boolean
  } {
    const jobs = Array.from(this.jobs.values())
    const jobsByType: Record<JobType, number> = {
      'create-snapshot': 0,
      'cleanup-snapshots': 0
    }

    for (const job of jobs) {
      jobsByType[job.type]++
    }

    return {
      totalJobs: jobs.length,
      jobsByType,
      processing: this.processing
    }
  }

  /**
   * Clear all jobs from the queue
   */
  clearQueue(): void {
    this.jobs.clear()
    this.stopProcessing()
  }

  /**
   * Get job by ID
   * @param jobId - Job ID
   * @returns Job or undefined if not found
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Remove job by ID
   * @param jobId - Job ID to remove
   * @returns True if job was removed
   */
  removeJob(jobId: string): boolean {
    return this.jobs.delete(jobId)
  }
}

/**
 * Snapshot trigger utilities
 */
export class SnapshotTriggers {
  private static jobManager = new BackgroundJobManager()

  /**
   * Trigger snapshot creation after pixel placement
   * @param frameId - Frame ID where pixel was placed
   */
  static async onPixelPlaced(frameId: string): Promise<void> {
    try {
      const shouldCreate = await snapshotManager.shouldCreateSnapshot(frameId)
      
      if (shouldCreate) {
        // Add high priority snapshot job
        this.jobManager.addSnapshotJob(frameId, 10)
        console.log(`Queued snapshot creation for frame ${frameId}`)
      }
    } catch (error) {
      console.error(`Error checking snapshot trigger for frame ${frameId}:`, error)
    }
  }

  /**
   * Trigger periodic cleanup of old snapshots
   * @param frameId - Frame ID to cleanup
   */
  static triggerCleanup(frameId: string): void {
    this.jobManager.addCleanupJob(frameId)
  }

  /**
   * Get the job manager instance
   * @returns Background job manager
   */
  static getJobManager(): BackgroundJobManager {
    return this.jobManager
  }
}

// Export singleton instances
export const backgroundJobManager = new BackgroundJobManager()
export const snapshotTriggers = SnapshotTriggers

// Export individual functions for convenience
export const {
  addSnapshotJob,
  addCleanupJob,
  getQueueStatus,
  clearQueue
} = backgroundJobManager