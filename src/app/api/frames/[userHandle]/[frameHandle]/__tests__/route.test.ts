/**
 * Unit tests for individual frame API routes
 */

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'
import { createServerClient } from '@supabase/ssr'

// Mock NextRequest for testing
class MockNextRequest {
  public url: string
  public method: string
  public headers: Map<string, string>
  private body?: string
  
  constructor(input: string, init?: { method?: string; body?: string }) {
    this.url = input
    this.method = init?.method || 'GET'
    this.headers = new Map()
    this.body = init?.body
  }
  
  async json() {
    return this.body ? JSON.parse(this.body) : {}
  }
}

// Mock Supabase
jest.mock('@supabase/ssr')
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({
    getAll: jest.fn(() => []),
    set: jest.fn()
  }))
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        gte: jest.fn(() => ({
          order: jest.fn()
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }))
}

;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

const mockParams = {
  params: Promise.resolve({
    userHandle: 'testuser',
    frameHandle: 'test-frame'
  })
}

describe('/api/frames/[userHandle]/[frameHandle]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    const mockFrameData = {
      id: 'frame-1',
      handle: 'test-frame',
      title: 'Test Frame',
      description: 'A test frame',
      keywords: ['test'],
      owner_handle: 'testuser',
      width: 128,
      height: 128,
      permissions: 'open',
      is_frozen: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      contributors_count: 5,
      total_pixels: 100,
      likes_count: 10,
      last_activity: '2024-01-01T00:00:00Z'
    }

    it('should return frame data for open frame', async () => {
      const mockSnapshotData = {
        id: 'snapshot-1',
        frame_id: 'frame-1',
        snapshot_data: Buffer.from('test-data').toString('base64'),
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockPixels = [
        {
          id: 'pixel-1',
          frame_id: 'frame-1',
          x: 0,
          y: 0,
          color: 0xFF000000,
          contributor_handle: 'testuser',
          placed_at: '2024-01-01T01:00:00Z'
        }
      ]

        // Mock auth.getUser to return no user (anonymous access)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'frame_details') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: mockFrameData,
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        if (table === 'frame_permissions') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                }))
              }))
            }))
          }
        }
        if (table === 'frame_snapshots') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({
                      data: mockSnapshotData,
                      error: null
                    })
                  }))
                }))
              }))
            }))
          }
        }
        if (table === 'pixels') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                gte: jest.fn(() => ({
                  order: jest.fn().mockResolvedValue({
                    data: mockPixels,
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames/testuser/test-frame') as unknown as NextRequest
      const response = await GET(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.frame.handle).toBe('test-frame')
      expect(data.data.recentPixels).toHaveLength(1)
      expect(data.data.userPermission).toBeNull()
    })

    it('should return 404 for non-existent frame', async () => {
      // Mock auth.getUser to return no user (anonymous access)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            }))
          }))
        }))
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames/testuser/nonexistent') as unknown as NextRequest
      const response = await GET(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.code).toBe('FRAME_NOT_FOUND')
    })

    it('should check permissions for approval-required frame', async () => {
      const restrictedFrameData = {
        ...mockFrameData,
        permissions: 'approval-required'
      }

      // Mock auth.getUser to return no user (anonymous access)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'frame_details') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: restrictedFrameData,
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        if (table === 'frame_permissions') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames/testuser/test-frame') as unknown as NextRequest
      const response = await GET(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.code).toBe('PERMISSION_DENIED')
    })
  })

  describe('PUT', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockUserData = { handle: 'testuser' }
    const mockFrame = {
      id: 'frame-1',
      handle: 'test-frame',
      title: 'Test Frame',
      owner_handle: 'testuser',
      permissions: 'open'
    }

    it('should update frame successfully', async () => {
      const updateData = {
        title: 'Updated Frame Title',
        description: 'Updated description'
      }

      const updatedFrame = {
        ...mockFrame,
        ...updateData,
        updated_at: '2024-01-01T01:00:00Z'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: mockUserData,
                  error: null
                })
              }))
            }))
          }
        }
        if (table === 'frames') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: mockFrame,
                    error: null
                  })
                }))
              }))
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: updatedFrame,
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames/testuser/test-frame', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      }) as unknown as NextRequest

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe(updateData.title)
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames/testuser/test-frame', {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title' })
      }) as unknown as NextRequest

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.code).toBe('UNAUTHORIZED')
    })

    it('should require frame ownership', async () => {
      const otherUserData = { handle: 'otheruser' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: otherUserData,
                  error: null
                })
              }))
            }))
          }
        }
        if (table === 'frames') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: mockFrame,
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames/testuser/test-frame', {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title' })
      }) as unknown as NextRequest

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.code).toBe('PERMISSION_DENIED')
    })

    it('should validate update data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: mockUserData,
                  error: null
                })
              }))
            }))
          }
        }
        if (table === 'frames') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: mockFrame,
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const invalidData = { title: '' } // Empty title

      const request = new MockNextRequest('http://localhost:3000/api/frames/testuser/test-frame', {
        method: 'PUT',
        body: JSON.stringify(invalidData)
      }) as unknown as NextRequest

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_TITLE')
    })
  })

  describe('DELETE', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockUserData = { handle: 'testuser' }
    const mockFrame = {
      id: 'frame-1',
      handle: 'test-frame',
      owner_handle: 'testuser'
    }

    it('should delete frame successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: mockUserData,
                  error: null
                })
              }))
            }))
          }
        }
        if (table === 'frames') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: mockFrame,
                    error: null
                  })
                }))
              }))
            })),
            delete: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({
                error: null
              })
            }))
          }
        }
        return mockSupabase.from()
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames/testuser/test-frame', {
        method: 'DELETE'
      }) as unknown as NextRequest

      const response = await DELETE(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.deleted).toBe(true)
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames/testuser/test-frame', {
        method: 'DELETE'
      }) as unknown as NextRequest

      const response = await DELETE(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.code).toBe('UNAUTHORIZED')
    })

    it('should require frame ownership', async () => {
      const otherUserData = { handle: 'otheruser' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: otherUserData,
                  error: null
                })
              }))
            }))
          }
        }
        if (table === 'frames') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: mockFrame,
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames/testuser/test-frame', {
        method: 'DELETE'
      }) as unknown as NextRequest

      const response = await DELETE(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.code).toBe('PERMISSION_DENIED')
    })
  })
})