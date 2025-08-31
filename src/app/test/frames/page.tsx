'use client'

/**
 * API test page for frame management endpoints
 * This page provides UI forms to test frame creation, listing, and retrieval
 */

import { useState } from 'react'
import type { 
  CreateFrameRequest, 
  FrameWithStats
} from '@/lib/types'

export default function FramesTestPage() {
  const [results, setResults] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const logResult = (operation: string, result: unknown) => {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${operation}:\n${JSON.stringify(result, null, 2)}\n\n`
    setResults(prev => logEntry + prev)
  }

  const handleError = (operation: string, error: unknown) => {
    logResult(`${operation} ERROR`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
  }

  // Test frame creation
  const testCreateFrame = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const frameData: CreateFrameRequest = {
        handle: formData.get('handle') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        keywords: (formData.get('keywords') as string).split(',').map(k => k.trim()).filter(k => k),
        width: parseInt(formData.get('width') as string),
        height: parseInt(formData.get('height') as string),
        permissions: formData.get('permissions') as 'open' | 'approval-required' | 'owner-only'
      }

      logResult('CREATE FRAME REQUEST', frameData)

      const response = await fetch('/api/frames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(frameData)
      })

      const result = await response.json()
      
      if (response.ok) {
        logResult('CREATE FRAME SUCCESS', result)
      } else {
        logResult('CREATE FRAME ERROR', {
          status: response.status,
          statusText: response.statusText,
          body: result
        })
      }
    } catch (error) {
      handleError('CREATE FRAME', error)
    } finally {
      setLoading(false)
    }
  }

  // Test frame listing
  const testListFrames = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const params = new URLSearchParams()
      
      const search = formData.get('search') as string
      const page = formData.get('page') as string
      const limit = formData.get('limit') as string
      const sortBy = formData.get('sortBy') as string
      const sortOrder = formData.get('sortOrder') as string

      if (search) params.append('search', search)
      if (page) params.append('page', page)
      if (limit) params.append('limit', limit)
      if (sortBy) params.append('sortBy', sortBy)
      if (sortOrder) params.append('sortOrder', sortOrder)

      const url = `/api/frames?${params.toString()}`
      logResult('LIST FRAMES REQUEST', { url, params: Object.fromEntries(params) })

      const response = await fetch(url)
      const result = await response.json()
      
      if (response.ok) {
        logResult('LIST FRAMES SUCCESS', {
          total: result.data.total,
          page: result.data.page,
          limit: result.data.limit,
          framesCount: result.data.frames.length,
          frames: result.data.frames.map((f: FrameWithStats) => ({
            id: f.id,
            handle: f.handle,
            title: f.title,
            owner_handle: f.owner_handle,
            stats: f.stats
          }))
        })
      } else {
        logResult('LIST FRAMES ERROR', {
          status: response.status,
          statusText: response.statusText,
          body: result
        })
      }
    } catch (error) {
      handleError('LIST FRAMES', error)
    } finally {
      setLoading(false)
    }
  }

  // Test individual frame retrieval
  const testGetFrame = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const userHandle = formData.get('userHandle') as string
      const frameHandle = formData.get('frameHandle') as string

      const url = `/api/frames/${userHandle}/${frameHandle}`
      logResult('GET FRAME REQUEST', { url, userHandle, frameHandle })

      const response = await fetch(url)
      const result = await response.json()
      
      if (response.ok) {
        logResult('GET FRAME SUCCESS', {
          frame: {
            id: result.data.frame.id,
            handle: result.data.frame.handle,
            title: result.data.frame.title,
            owner_handle: result.data.frame.owner_handle,
            permissions: result.data.frame.permissions,
            stats: result.data.frame.stats
          },
          snapshotDataSize: result.data.snapshotData?.length || 0,
          recentPixelsCount: result.data.recentPixels?.length || 0,
          userPermission: result.data.userPermission
        })
      } else {
        logResult('GET FRAME ERROR', {
          status: response.status,
          statusText: response.statusText,
          body: result
        })
      }
    } catch (error) {
      handleError('GET FRAME', error)
    } finally {
      setLoading(false)
    }
  }

  // Test frame update
  const testUpdateFrame = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const userHandle = formData.get('userHandle') as string
      const frameHandle = formData.get('frameHandle') as string
      
      const updateData: Record<string, unknown> = {}
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const keywords = formData.get('keywords') as string
      const permissions = formData.get('permissions') as string
      const isFrozen = formData.get('isFrozen') as string

      if (title) updateData.title = title
      if (description) updateData.description = description
      if (keywords) updateData.keywords = keywords.split(',').map(k => k.trim()).filter(k => k)
      if (permissions) updateData.permissions = permissions
      if (isFrozen) updateData.is_frozen = isFrozen === 'true'

      const url = `/api/frames/${userHandle}/${frameHandle}`
      logResult('UPDATE FRAME REQUEST', { url, updateData })

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()
      
      if (response.ok) {
        logResult('UPDATE FRAME SUCCESS', result)
      } else {
        logResult('UPDATE FRAME ERROR', {
          status: response.status,
          statusText: response.statusText,
          body: result
        })
      }
    } catch (error) {
      handleError('UPDATE FRAME', error)
    } finally {
      setLoading(false)
    }
  }

  // Test permission management
  const testManagePermissions = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const userHandle = formData.get('userHandle') as string
      const frameHandle = formData.get('frameHandle') as string
      const targetUserHandle = formData.get('targetUserHandle') as string
      const permissionType = formData.get('permissionType') as string
      const action = formData.get('action') as string

      const url = `/api/frames/${userHandle}/${frameHandle}/permissions`
      
      if (action === 'grant') {
        const permissionData = {
          targetUserHandle,
          permissionType
        }

        logResult('GRANT PERMISSION REQUEST', { url, permissionData })

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(permissionData)
        })

        const result = await response.json()
        
        if (response.ok) {
          logResult('GRANT PERMISSION SUCCESS', result)
        } else {
          logResult('GRANT PERMISSION ERROR', {
            status: response.status,
            statusText: response.statusText,
            body: result
          })
        }
      } else if (action === 'remove') {
        const deleteUrl = `${url}?userHandle=${targetUserHandle}`
        logResult('REMOVE PERMISSION REQUEST', { url: deleteUrl })

        const response = await fetch(deleteUrl, {
          method: 'DELETE'
        })

        const result = await response.json()
        
        if (response.ok) {
          logResult('REMOVE PERMISSION SUCCESS', result)
        } else {
          logResult('REMOVE PERMISSION ERROR', {
            status: response.status,
            statusText: response.statusText,
            body: result
          })
        }
      } else if (action === 'list') {
        logResult('LIST PERMISSIONS REQUEST', { url })

        const response = await fetch(url)
        const result = await response.json()
        
        if (response.ok) {
          logResult('LIST PERMISSIONS SUCCESS', result)
        } else {
          logResult('LIST PERMISSIONS ERROR', {
            status: response.status,
            statusText: response.statusText,
            body: result
          })
        }
      }
    } catch (error) {
      handleError('MANAGE PERMISSIONS', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Frame API Test Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Forms */}
        <div className="space-y-8">
          {/* Create Frame Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create Frame</h2>
            <form onSubmit={testCreateFrame} className="space-y-4">
              <input
                name="handle"
                placeholder="Frame handle (e.g., my-awesome-frame)"
                className="w-full p-2 border rounded"
                required
              />
              <input
                name="title"
                placeholder="Frame title"
                className="w-full p-2 border rounded"
                required
              />
              <textarea
                name="description"
                placeholder="Frame description"
                className="w-full p-2 border rounded"
                rows={3}
              />
              <input
                name="keywords"
                placeholder="Keywords (comma-separated)"
                className="w-full p-2 border rounded"
              />
              <select name="width" className="w-full p-2 border rounded" required>
                <option value="">Select width</option>
                <option value="128">128 (Core/Quick Landscape)</option>
                <option value="72">72 (Quick Portrait)</option>
                <option value="512">512 (Epic Frame)</option>
              </select>
              <select name="height" className="w-full p-2 border rounded" required>
                <option value="">Select height</option>
                <option value="128">128 (Core/Quick Portrait)</option>
                <option value="72">72 (Quick Landscape)</option>
                <option value="288">288 (Epic Frame)</option>
              </select>
              <select name="permissions" className="w-full p-2 border rounded" required>
                <option value="open">Open</option>
                <option value="approval-required">Approval Required</option>
                <option value="owner-only">Owner Only</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Create Frame
              </button>
            </form>
          </div>

          {/* List Frames Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">List Frames</h2>
            <form onSubmit={testListFrames} className="space-y-4">
              <input
                name="search"
                placeholder="Search frames"
                className="w-full p-2 border rounded"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="page"
                  type="number"
                  placeholder="Page (default: 1)"
                  className="p-2 border rounded"
                  min="1"
                />
                <input
                  name="limit"
                  type="number"
                  placeholder="Limit (default: 20)"
                  className="p-2 border rounded"
                  min="1"
                  max="50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select name="sortBy" className="p-2 border rounded">
                  <option value="">Sort by</option>
                  <option value="created_at">Created At</option>
                  <option value="updated_at">Updated At</option>
                  <option value="title">Title</option>
                  <option value="total_pixels">Total Pixels</option>
                  <option value="contributors_count">Contributors</option>
                  <option value="likes_count">Likes</option>
                </select>
                <select name="sortOrder" className="p-2 border rounded">
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                List Frames
              </button>
            </form>
          </div>

          {/* Get Frame Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Get Frame</h2>
            <form onSubmit={testGetFrame} className="space-y-4">
              <input
                name="userHandle"
                placeholder="User handle"
                className="w-full p-2 border rounded"
                required
              />
              <input
                name="frameHandle"
                placeholder="Frame handle"
                className="w-full p-2 border rounded"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50"
              >
                Get Frame
              </button>
            </form>
          </div>

          {/* Update Frame Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Update Frame</h2>
            <form onSubmit={testUpdateFrame} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="userHandle"
                  placeholder="User handle"
                  className="p-2 border rounded"
                  required
                />
                <input
                  name="frameHandle"
                  placeholder="Frame handle"
                  className="p-2 border rounded"
                  required
                />
              </div>
              <input
                name="title"
                placeholder="New title (optional)"
                className="w-full p-2 border rounded"
              />
              <textarea
                name="description"
                placeholder="New description (optional)"
                className="w-full p-2 border rounded"
                rows={2}
              />
              <input
                name="keywords"
                placeholder="New keywords (optional, comma-separated)"
                className="w-full p-2 border rounded"
              />
              <select name="permissions" className="w-full p-2 border rounded">
                <option value="">Keep current permissions</option>
                <option value="open">Open</option>
                <option value="approval-required">Approval Required</option>
                <option value="owner-only">Owner Only</option>
              </select>
              <select name="isFrozen" className="w-full p-2 border rounded">
                <option value="">Keep current frozen state</option>
                <option value="false">Unfreeze</option>
                <option value="true">Freeze</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600 disabled:opacity-50"
              >
                Update Frame
              </button>
            </form>
          </div>

          {/* Manage Permissions Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Manage Permissions</h2>
            <form onSubmit={testManagePermissions} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="userHandle"
                  placeholder="Frame owner handle"
                  className="p-2 border rounded"
                  required
                />
                <input
                  name="frameHandle"
                  placeholder="Frame handle"
                  className="p-2 border rounded"
                  required
                />
              </div>
              <input
                name="targetUserHandle"
                placeholder="Target user handle"
                className="w-full p-2 border rounded"
              />
              <select name="permissionType" className="w-full p-2 border rounded">
                <option value="">Select permission type</option>
                <option value="contributor">Contributor</option>
                <option value="blocked">Blocked</option>
                <option value="pending">Pending</option>
              </select>
              <select name="action" className="w-full p-2 border rounded" required>
                <option value="">Select action</option>
                <option value="grant">Grant Permission</option>
                <option value="remove">Remove Permission</option>
                <option value="list">List Permissions</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                Manage Permissions
              </button>
            </form>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">API Results</h2>
            <button
              onClick={() => setResults('')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
          <pre className="bg-white p-4 rounded border h-96 overflow-auto text-sm">
            {results || 'No results yet. Use the forms to test the API endpoints.'}
          </pre>
          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2">Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}