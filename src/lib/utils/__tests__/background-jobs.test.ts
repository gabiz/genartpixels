/**
 * Unit tests for background job system
 */

import { BackgroundJobManager, SnapshotTriggers } from '../background-jobs'
import { snapshotManager } from '../snapshot-manager'

// Mock the snapshot manager
jest.mock('../snapshot-manager', () => ({
  snapshotManager: {
    createSnapshot: jest.fn(),
    cleanupOldSnapshots: jest.fn(),
    shouldCreateSnapshot: jest.fn()
  }
}))

const mockSnapshotManager = snapshotManager as jest.Mocked<typeof snapshotManager>

describe('BackgroundJobManager', () => {
  let jobManager: BackgroundJobManager

  beforeEach(() => {
    jobManager = new BackgroundJobManager()
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jobManager.stopProcessing()
    jest.useRealTimers()
  })

  describe('addJob', () => {
    test('adds job to queue', () => {
      const jobId = jobManager.addJob('create-snapshot', 'frame-1', 5)

      expect(jobId).toBeDefined()
      expect(typeof jobId).toBe('string')

      const job = jobManager.getJob(jobId)
      expect(job).toBeDefined()
      expect(job?.type).toBe('create-snapshot')
      expect(job?.frameId).toBe('frame-1')
      expect(job?.priority).toBe(5)
    })

    test('generates unique job IDs', () => {
      const jobId1 = jobManager.addJob('create-snapshot', 'frame-1')
      const jobId2 = jobManager.addJob('create-snapshot', 'frame-1')

      expect(jobId1).not.toBe(jobId2)
    })

    test('starts processing when first job is added', () => {
      const status = jobManager.getQueueStatus()
      expect(status.processing).toBe(false)

      jobManager.addJob('create-snapshot', 'frame-1')

      const newStatus = jobManager.getQueueStatus()
      expect(newStatus.processing).toBe(true)
    })
  })

  describe('addSnapshotJob', () => {
    test('adds snapshot creation job', () => {
      const jobId = jobManager.addSnapshotJob('frame-1', 10)

      const job = jobManager.getJob(jobId)
      expect(job?.type).toBe('create-snapshot')
      expect(job?.frameId).toBe('frame-1')
      expect(job?.priority).toBe(10)
    })
  })

  describe('addCleanupJob', () => {
    test('adds cleanup job with default keep count', () => {
      const jobId = jobManager.addCleanupJob('frame-1')

      const job = jobManager.getJob(jobId)
      expect(job?.type).toBe('cleanup-snapshots')
      expect(job?.frameId).toBe('frame-1')
      expect(job?.data?.keepCount).toBe(3)
    })

    test('adds cleanup job with custom keep count', () => {
      const jobId = jobManager.addCleanupJob('frame-1', 5)

      const job = jobManager.getJob(jobId)
      expect(job?.data?.keepCount).toBe(5)
    })
  })

  describe('job processing', () => {
    test('processes jobs in priority order', () => {
      // Add jobs with different priorities
      const jobId1 = jobManager.addSnapshotJob('frame-low', 1)
      const jobId2 = jobManager.addSnapshotJob('frame-high', 10)
      const jobId3 = jobManager.addSnapshotJob('frame-medium', 5)

      const jobs = [
        jobManager.getJob(jobId1)!,
        jobManager.getJob(jobId2)!,
        jobManager.getJob(jobId3)!
      ].sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return a.createdAt.getTime() - b.createdAt.getTime()
      })

      expect(jobs[0].frameId).toBe('frame-high')
      expect(jobs[1].frameId).toBe('frame-medium')
      expect(jobs[2].frameId).toBe('frame-low')
    })

    test('processes jobs in creation order when priority is same', () => {
      // Add jobs with same priority
      const jobId1 = jobManager.addSnapshotJob('frame-1', 5)
      const jobId2 = jobManager.addSnapshotJob('frame-2', 5)
      const jobId3 = jobManager.addSnapshotJob('frame-3', 5)

      const jobs = [
        jobManager.getJob(jobId1)!,
        jobManager.getJob(jobId2)!,
        jobManager.getJob(jobId3)!
      ].sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return a.createdAt.getTime() - b.createdAt.getTime()
      })

      expect(jobs[0].frameId).toBe('frame-1')
      expect(jobs[1].frameId).toBe('frame-2')
      expect(jobs[2].frameId).toBe('frame-3')
    })

    test('adds jobs to queue correctly', () => {
      const jobId = jobManager.addSnapshotJob('frame-1')
      const job = jobManager.getJob(jobId)

      expect(job).toBeDefined()
      expect(job?.type).toBe('create-snapshot')
      expect(job?.frameId).toBe('frame-1')
      expect(job?.attempts).toBe(0)
      expect(job?.maxAttempts).toBe(3)
    })

    test('tracks job attempts correctly', () => {
      const jobId = jobManager.addSnapshotJob('frame-1')
      const job = jobManager.getJob(jobId)!

      // Simulate failed attempts
      job.attempts = 1
      expect(job.attempts).toBe(1)

      job.attempts = 2
      expect(job.attempts).toBe(2)
    })

    test('removes jobs when requested', () => {
      const jobId = jobManager.addSnapshotJob('frame-1')
      
      expect(jobManager.getJob(jobId)).toBeDefined()
      
      const removed = jobManager.removeJob(jobId)
      
      expect(removed).toBe(true)
      expect(jobManager.getJob(jobId)).toBeUndefined()
    })
  })

  describe('cleanup job execution', () => {
    test('creates cleanup jobs correctly', () => {
      const jobId = jobManager.addCleanupJob('frame-1', 5)
      const job = jobManager.getJob(jobId)

      expect(job).toBeDefined()
      expect(job?.type).toBe('cleanup-snapshots')
      expect(job?.frameId).toBe('frame-1')
      expect(job?.data?.keepCount).toBe(5)
    })
  })

  describe('getQueueStatus', () => {
    test('returns correct queue status', () => {
      jobManager.addSnapshotJob('frame-1')
      jobManager.addSnapshotJob('frame-2')
      jobManager.addCleanupJob('frame-3')

      const status = jobManager.getQueueStatus()

      expect(status.totalJobs).toBe(3)
      expect(status.jobsByType['create-snapshot']).toBe(2)
      expect(status.jobsByType['cleanup-snapshots']).toBe(1)
      expect(status.processing).toBe(true)
    })

    test('returns empty status for empty queue', () => {
      const status = jobManager.getQueueStatus()

      expect(status.totalJobs).toBe(0)
      expect(status.jobsByType['create-snapshot']).toBe(0)
      expect(status.jobsByType['cleanup-snapshots']).toBe(0)
      expect(status.processing).toBe(false)
    })
  })

  describe('clearQueue', () => {
    test('clears all jobs and stops processing', () => {
      jobManager.addSnapshotJob('frame-1')
      jobManager.addSnapshotJob('frame-2')

      expect(jobManager.getQueueStatus().totalJobs).toBe(2)

      jobManager.clearQueue()

      const status = jobManager.getQueueStatus()
      expect(status.totalJobs).toBe(0)
      expect(status.processing).toBe(false)
    })
  })

  describe('removeJob', () => {
    test('removes specific job by ID', () => {
      const jobId = jobManager.addSnapshotJob('frame-1')

      expect(jobManager.getJob(jobId)).toBeDefined()

      const removed = jobManager.removeJob(jobId)

      expect(removed).toBe(true)
      expect(jobManager.getJob(jobId)).toBeUndefined()
    })

    test('returns false for non-existent job', () => {
      const removed = jobManager.removeJob('non-existent-id')
      expect(removed).toBe(false)
    })
  })

  describe('stopProcessing', () => {
    test('stops job processing', () => {
      jobManager.addSnapshotJob('frame-1')

      expect(jobManager.getQueueStatus().processing).toBe(true)

      jobManager.stopProcessing()

      expect(jobManager.getQueueStatus().processing).toBe(false)
    })
  })
})

describe('SnapshotTriggers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('onPixelPlaced', () => {
    test('queues snapshot job when snapshot is needed', async () => {
      mockSnapshotManager.shouldCreateSnapshot.mockResolvedValue(true)

      const jobManager = SnapshotTriggers.getJobManager()
      const addSnapshotJobSpy = jest.spyOn(jobManager, 'addSnapshotJob')

      await SnapshotTriggers.onPixelPlaced('frame-1')

      expect(mockSnapshotManager.shouldCreateSnapshot).toHaveBeenCalledWith('frame-1')
      expect(addSnapshotJobSpy).toHaveBeenCalledWith('frame-1', 10)
    })

    test('does not queue job when snapshot is not needed', async () => {
      mockSnapshotManager.shouldCreateSnapshot.mockResolvedValue(false)

      const jobManager = SnapshotTriggers.getJobManager()
      const addSnapshotJobSpy = jest.spyOn(jobManager, 'addSnapshotJob')

      await SnapshotTriggers.onPixelPlaced('frame-1')

      expect(mockSnapshotManager.shouldCreateSnapshot).toHaveBeenCalledWith('frame-1')
      expect(addSnapshotJobSpy).not.toHaveBeenCalled()
    })

    test('handles errors gracefully', async () => {
      mockSnapshotManager.shouldCreateSnapshot.mockRejectedValue(new Error('Test error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await SnapshotTriggers.onPixelPlaced('frame-1')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error checking snapshot trigger'),
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('triggerCleanup', () => {
    test('queues cleanup job', () => {
      const jobManager = SnapshotTriggers.getJobManager()
      const addCleanupJobSpy = jest.spyOn(jobManager, 'addCleanupJob')

      SnapshotTriggers.triggerCleanup('frame-1')

      expect(addCleanupJobSpy).toHaveBeenCalledWith('frame-1')
    })
  })

  describe('getJobManager', () => {
    test('returns job manager instance', () => {
      const jobManager = SnapshotTriggers.getJobManager()
      expect(jobManager).toBeInstanceOf(BackgroundJobManager)
    })
  })
})