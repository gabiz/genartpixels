'use client'

/**
 * Test page for pixel placement system
 * Verifies quota system, placement validation, and undo functionality
 */

import { useState } from 'react'
import { COLOR_PALETTE } from '@/lib/types'
import { ColorUtils } from '@/lib/utils/color-utils'

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any
}

export default function PixelTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedFrameId, setSelectedFrameId] = useState('')
  const [userQuota, setUserQuota] = useState<number | null>(null)

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result])
  }

  const updateTestResult = (index: number, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map((result, i) => 
      i === index ? { ...result, ...updates } : result
    ))
  }

  const runPixelPlacementTests = async () => {
    setIsRunning(true)
    setTestResults([])

    // Test 1: Valid pixel placement
    const test1Index = testResults.length
    addTestResult({
      test: 'Valid Pixel Placement',
      status: 'pending',
      message: 'Testing valid pixel placement...'
    })

    try {
      const response = await fetch('/api/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameId: selectedFrameId,
          x: 10,
          y: 20,
          color: COLOR_PALETTE[1] // Red
        })
      })

      const result = await response.json()
      
      if (result.success) {
        updateTestResult(test1Index, {
          status: 'success',
          message: `Pixel placed successfully. Quota remaining: ${result.quotaRemaining}`,
          details: result
        })
        setUserQuota(result.quotaRemaining)
      } else {
        updateTestResult(test1Index, {
          status: 'error',
          message: `Failed: ${result.error}`,
          details: result
        })
      }
    } catch (error) {
      updateTestResult(test1Index, {
        status: 'error',
        message: `Network error: ${error}`,
        details: error
      })
    }

    // Test 2: Invalid coordinates
    const test2Index = testResults.length
    addTestResult({
      test: 'Invalid Coordinates',
      status: 'pending',
      message: 'Testing invalid coordinates rejection...'
    })

    try {
      const response = await fetch('/api/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameId: selectedFrameId,
          x: 999, // Invalid coordinate
          y: 20,
          color: COLOR_PALETTE[1]
        })
      })

      const result = await response.json()
      
      if (!result.success && result.code === 'INVALID_COORDINATES') {
        updateTestResult(test2Index, {
          status: 'success',
          message: 'Invalid coordinates correctly rejected',
          details: result
        })
      } else {
        updateTestResult(test2Index, {
          status: 'error',
          message: 'Should have rejected invalid coordinates',
          details: result
        })
      }
    } catch (error) {
      updateTestResult(test2Index, {
        status: 'error',
        message: `Network error: ${error}`,
        details: error
      })
    }

    // Test 3: Invalid color
    const test3Index = testResults.length
    addTestResult({
      test: 'Invalid Color',
      status: 'pending',
      message: 'Testing invalid color rejection...'
    })

    try {
      const response = await fetch('/api/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameId: selectedFrameId,
          x: 15,
          y: 25,
          color: 0x12345678 // Not in palette
        })
      })

      const result = await response.json()
      
      if (!result.success && result.code === 'INVALID_COLOR') {
        updateTestResult(test3Index, {
          status: 'success',
          message: 'Invalid color correctly rejected',
          details: result
        })
      } else {
        updateTestResult(test3Index, {
          status: 'error',
          message: 'Should have rejected invalid color',
          details: result
        })
      }
    } catch (error) {
      updateTestResult(test3Index, {
        status: 'error',
        message: `Network error: ${error}`,
        details: error
      })
    }

    // Test 4: Same pixel placement (should not decrement quota)
    const test4Index = testResults.length
    addTestResult({
      test: 'Duplicate Pixel Placement',
      status: 'pending',
      message: 'Testing duplicate pixel placement...'
    })

    try {
      const response = await fetch('/api/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameId: selectedFrameId,
          x: 10,
          y: 20,
          color: COLOR_PALETTE[1] // Same as test 1
        })
      })

      const result = await response.json()
      
      if (result.success && result.quotaRemaining === userQuota) {
        updateTestResult(test4Index, {
          status: 'success',
          message: 'Duplicate placement handled correctly (quota not decremented)',
          details: result
        })
      } else {
        updateTestResult(test4Index, {
          status: 'error',
          message: 'Duplicate placement should not decrement quota',
          details: result
        })
      }
    } catch (error) {
      updateTestResult(test4Index, {
        status: 'error',
        message: `Network error: ${error}`,
        details: error
      })
    }

    // Test 5: Undo functionality
    const test5Index = testResults.length
    addTestResult({
      test: 'Undo Functionality',
      status: 'pending',
      message: 'Testing pixel undo...'
    })

    try {
      const response = await fetch('/api/pixels', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameId: selectedFrameId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        updateTestResult(test5Index, {
          status: 'success',
          message: `Pixel undone successfully. Quota refunded: ${result.quotaRemaining}`,
          details: result
        })
        setUserQuota(result.quotaRemaining)
      } else {
        updateTestResult(test5Index, {
          status: 'error',
          message: `Undo failed: ${result.error}`,
          details: result
        })
      }
    } catch (error) {
      updateTestResult(test5Index, {
        status: 'error',
        message: `Network error: ${error}`,
        details: error
      })
    }

    setIsRunning(false)
  }

  const testQuotaSystem = async () => {
    setIsRunning(true)
    
    const testIndex = testResults.length
    addTestResult({
      test: 'Quota System Stress Test',
      status: 'pending',
      message: 'Testing quota system with multiple placements...'
    })

    let successCount = 0
    let quotaExceededCount = 0
    let currentQuota = userQuota

    try {
      // Try to place 10 pixels rapidly
      for (let i = 0; i < 10; i++) {
        const response = await fetch('/api/pixels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frameId: selectedFrameId,
            x: i,
            y: i,
            color: COLOR_PALETTE[i % COLOR_PALETTE.length]
          })
        })

        const result = await response.json()
        
        if (result.success) {
          successCount++
          currentQuota = result.quotaRemaining
        } else if (result.code === 'QUOTA_EXCEEDED') {
          quotaExceededCount++
        }
      }

      updateTestResult(testIndex, {
        status: 'success',
        message: `Quota test completed. Successful placements: ${successCount}, Quota exceeded: ${quotaExceededCount}`,
        details: { successCount, quotaExceededCount, finalQuota: currentQuota }
      })
      
      setUserQuota(currentQuota)
    } catch (error) {
      updateTestResult(testIndex, {
        status: 'error',
        message: `Quota test failed: ${error}`,
        details: error
      })
    }

    setIsRunning(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Pixel Placement System Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Frame ID (required for testing):
          </label>
          <input
            type="text"
            value={selectedFrameId}
            onChange={(e) => setSelectedFrameId(e.target.value)}
            placeholder="Enter frame ID to test with"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {userQuota !== null && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              Current Quota: {userQuota} pixels
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={runPixelPlacementTests}
            disabled={isRunning || !selectedFrameId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Run Placement Tests'}
          </button>
          
          <button
            onClick={testQuotaSystem}
            disabled={isRunning || !selectedFrameId}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Test Quota System'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet. Configure a frame ID and click a test button.</p>
        ) : (
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border-l-4 ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-400'
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-400'
                    : 'bg-yellow-50 border-yellow-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{result.test}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      result.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : result.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500">View Details</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Color Palette Reference</h2>
        <div className="grid grid-cols-8 gap-2">
          {COLOR_PALETTE.map((color, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded border border-gray-300 flex items-center justify-center text-xs"
              style={{ backgroundColor: ColorUtils.argbToRgba(color) }}
              title={`${ColorUtils.getColorName(color)} (${ColorUtils.argbToHex(color)})`}
            >
              {index}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>First, create a test frame using the frame creation API or test page</li>
          <li>Copy the frame ID and paste it in the Frame ID field above</li>
          <li>Run the &quot;Placement Tests&quot; to verify basic pixel placement functionality</li>
          <li>Run the &quot;Quota System&quot; test to verify quota management and limits</li>
          <li>Check the test results to ensure all functionality works correctly</li>
        </ol>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> You must be authenticated to run these tests. 
            Make sure you&apos;re logged in before testing.
          </p>
        </div>
      </div>
    </div>
  )
}