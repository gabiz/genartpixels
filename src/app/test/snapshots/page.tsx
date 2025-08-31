'use client'

/**
 * Snapshot test page to verify compression efficiency and loading speed
 */

import { useState, useEffect } from 'react'
import { CompressionUtils } from '@/lib/utils/compression-utils'
import { backgroundJobManager } from '@/lib/utils/background-jobs'
import { Pixel } from '@/lib/types'

interface CompressionTest {
  name: string
  frameWidth: number
  frameHeight: number
  pixelCount: number
  pattern: 'sparse' | 'dense' | 'random' | 'checkerboard'
}

interface TestResult {
  test: CompressionTest
  originalSize: number
  compressedSize: number
  compressionRatio: number
  compressionTime: number
  decompressionTime: number
  pixelsPreserved: boolean
}

const COMPRESSION_TESTS: CompressionTest[] = [
  {
    name: 'Sparse Small Frame',
    frameWidth: 32,
    frameHeight: 32,
    pixelCount: 10,
    pattern: 'sparse'
  },
  {
    name: 'Dense Small Frame',
    frameWidth: 32,
    frameHeight: 32,
    pixelCount: 500,
    pattern: 'dense'
  },
  {
    name: 'Checkerboard Pattern',
    frameWidth: 64,
    frameHeight: 64,
    pixelCount: 2048, // Half the pixels
    pattern: 'checkerboard'
  },
  {
    name: 'Random Large Frame',
    frameWidth: 128,
    frameHeight: 128,
    pixelCount: 1000,
    pattern: 'random'
  },
  {
    name: 'Epic Frame Sparse',
    frameWidth: 512,
    frameHeight: 288,
    pixelCount: 100,
    pattern: 'sparse'
  },
  {
    name: 'Epic Frame Dense',
    frameWidth: 512,
    frameHeight: 288,
    pixelCount: 10000,
    pattern: 'random'
  }
]

export default function SnapshotTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>('')
  const [jobQueueStatus, setJobQueueStatus] = useState(backgroundJobManager.getQueueStatus())

  // Update job queue status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setJobQueueStatus(backgroundJobManager.getQueueStatus())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const generatePixels = (test: CompressionTest): Pixel[] => {
    const pixels: Pixel[] = []
    const { frameWidth, frameHeight, pixelCount, pattern } = test

    switch (pattern) {
      case 'sparse':
        // Randomly place pixels across the frame
        for (let i = 0; i < pixelCount; i++) {
          pixels.push({
            id: `pixel-${i}`,
            frame_id: 'test-frame',
            x: Math.floor(Math.random() * frameWidth),
            y: Math.floor(Math.random() * frameHeight),
            color: 0xFFFF0000, // Red
            contributor_handle: 'testuser',
            placed_at: new Date().toISOString()
          })
        }
        break

      case 'dense':
        // Fill pixels sequentially
        for (let i = 0; i < pixelCount; i++) {
          pixels.push({
            id: `pixel-${i}`,
            frame_id: 'test-frame',
            x: i % frameWidth,
            y: Math.floor(i / frameWidth),
            color: i % 2 === 0 ? 0xFFFF0000 : 0xFF00FF00, // Alternating red/green
            contributor_handle: 'testuser',
            placed_at: new Date().toISOString()
          })
        }
        break

      case 'checkerboard':
        // Create checkerboard pattern
        for (let y = 0; y < frameHeight; y++) {
          for (let x = 0; x < frameWidth; x++) {
            if ((x + y) % 2 === 0 && pixels.length < pixelCount) {
              pixels.push({
                id: `pixel-${x}-${y}`,
                frame_id: 'test-frame',
                x,
                y,
                color: 0xFFFFFFFF, // White
                contributor_handle: 'testuser',
                placed_at: new Date().toISOString()
              })
            }
          }
        }
        break

      case 'random':
        // Random colors and positions
        for (let i = 0; i < pixelCount; i++) {
          pixels.push({
            id: `pixel-${i}`,
            frame_id: 'test-frame',
            x: Math.floor(Math.random() * frameWidth),
            y: Math.floor(Math.random() * frameHeight),
            color: Math.floor(Math.random() * 0xFFFFFF) | 0xFF000000, // Random color with full alpha
            contributor_handle: 'testuser',
            placed_at: new Date().toISOString()
          })
        }
        break
    }

    return pixels
  }

  const runCompressionTest = async (test: CompressionTest): Promise<TestResult> => {
    const pixels = generatePixels(test)
    const originalSize = CompressionUtils.estimateUncompressedSize(test.frameWidth, test.frameHeight)

    // Test compression
    const compressionStart = performance.now()
    const compressed = CompressionUtils.compressPixelData(pixels, test.frameWidth, test.frameHeight)
    const compressionTime = performance.now() - compressionStart

    // Test decompression
    const decompressionStart = performance.now()
    const decompressed = CompressionUtils.decompressPixelData(compressed, test.frameWidth, test.frameHeight)
    const decompressionTime = performance.now() - decompressionStart

    // Verify pixels are preserved
    const pixelsPreserved = verifyPixelsPreserved(pixels, decompressed)

    const compressionRatio = CompressionUtils.getCompressionRatio(originalSize, compressed.length)

    return {
      test,
      originalSize,
      compressedSize: compressed.length,
      compressionRatio,
      compressionTime,
      decompressionTime,
      pixelsPreserved
    }
  }

  const verifyPixelsPreserved = (original: Pixel[], decompressed: Pixel[]): boolean => {
    // Create maps for easier comparison
    const originalMap = new Map<string, number>()
    const decompressedMap = new Map<string, number>()

    for (const pixel of original) {
      originalMap.set(`${pixel.x},${pixel.y}`, pixel.color)
    }

    for (const pixel of decompressed) {
      decompressedMap.set(`${pixel.x},${pixel.y}`, pixel.color)
    }

    // Check if all original pixels are preserved
    for (const [key, color] of originalMap) {
      if (decompressedMap.get(key) !== color) {
        return false
      }
    }

    return true
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    for (const test of COMPRESSION_TESTS) {
      setCurrentTest(test.name)
      try {
        const result = await runCompressionTest(test)
        setTestResults(prev => [...prev, result])
      } catch (error) {
        console.error(`Test failed: ${test.name}`, error)
      }
    }

    setCurrentTest('')
    setIsRunning(false)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms: number): string => {
    return `${ms.toFixed(2)}ms`
  }

  const addTestSnapshotJob = () => {
    backgroundJobManager.addSnapshotJob('test-frame-1', 5)
  }

  const addTestCleanupJob = () => {
    backgroundJobManager.addCleanupJob('test-frame-1')
  }

  const clearJobQueue = () => {
    backgroundJobManager.clearQueue()
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Snapshot System Test Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compression Tests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Compression Tests</h2>
          
          <div className="mb-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              {isRunning ? 'Running Tests...' : 'Run Compression Tests'}
            </button>
            
            {currentTest && (
              <p className="mt-2 text-sm text-gray-600">
                Currently testing: {currentTest}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg">{result.test.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div>Frame Size: {result.test.frameWidth}×{result.test.frameHeight}</div>
                  <div>Pixels: {result.test.pixelCount}</div>
                  <div>Pattern: {result.test.pattern}</div>
                  <div>Preserved: {result.pixelsPreserved ? '✅' : '❌'}</div>
                  <div>Original Size: {formatBytes(result.originalSize)}</div>
                  <div>Compressed: {formatBytes(result.compressedSize)}</div>
                  <div>Compression: {result.compressionRatio}%</div>
                  <div>Comp. Time: {formatTime(result.compressionTime)}</div>
                  <div>Decomp. Time: {formatTime(result.decompressionTime)}</div>
                </div>
                
                {/* Compression ratio bar */}
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        result.compressionRatio > 80 ? 'bg-green-500' :
                        result.compressionRatio > 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(result.compressionRatio, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Compression Efficiency: {result.compressionRatio > 80 ? 'Excellent' :
                    result.compressionRatio > 60 ? 'Good' : 'Poor'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Jobs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Background Job System</h2>
          
          <div className="mb-4 space-y-2">
            <button
              onClick={addTestSnapshotJob}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              Add Snapshot Job
            </button>
            <button
              onClick={addTestCleanupJob}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded mr-2"
            >
              Add Cleanup Job
            </button>
            <button
              onClick={clearJobQueue}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Clear Queue
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Queue Status</h3>
            <div className="space-y-1 text-sm">
              <div>Total Jobs: {jobQueueStatus.totalJobs}</div>
              <div>Processing: {jobQueueStatus.processing ? '✅' : '❌'}</div>
              <div>Snapshot Jobs: {jobQueueStatus.jobsByType['create-snapshot']}</div>
              <div>Cleanup Jobs: {jobQueueStatus.jobsByType['cleanup-snapshots']}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Test Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800">Average Compression</h3>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(testResults.reduce((sum, r) => sum + r.compressionRatio, 0) / testResults.length)}%
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800">Average Compression Time</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatTime(testResults.reduce((sum, r) => sum + r.compressionTime, 0) / testResults.length)}
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800">Tests Passed</h3>
              <p className="text-2xl font-bold text-purple-600">
                {testResults.filter(r => r.pixelsPreserved).length}/{testResults.length}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Performance Insights</h3>
            <ul className="text-sm space-y-1">
              <li>
                • Best compression: {Math.max(...testResults.map(r => r.compressionRatio))}% 
                ({testResults.find(r => r.compressionRatio === Math.max(...testResults.map(r => r.compressionRatio)))?.test.name})
              </li>
              <li>
                • Fastest compression: {formatTime(Math.min(...testResults.map(r => r.compressionTime)))}
                ({testResults.find(r => r.compressionTime === Math.min(...testResults.map(r => r.compressionTime)))?.test.name})
              </li>
              <li>
                • Largest frame tested: {Math.max(...testResults.map(r => r.test.frameWidth * r.test.frameHeight))} pixels
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}