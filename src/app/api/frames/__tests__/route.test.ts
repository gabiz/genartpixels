/**
 * Unit tests for frames API routes
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { createServerClient } from '@supabase/ssr'
import type { CreateFrameRequest } from '@/lib/types'

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
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn()
          }))
        })),
        order: jest.fn(() => ({
          range: jest.fn()
        }))
      })),
      or: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn()
        }))
      })),
      order: jest.fn(() => ({
        range: jest.fn()
      })),
      range: jest.fn(),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}

;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

describe('/api/frames', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return frames list with default pagination', async () => {
      const mockFrames = [
        {
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
      ]

      const mockQuery = {
        order: jest.fn(() => ({
          range: jest.fn().mockResolvedValue({
            data: mockFrames,
            error: null,
            count: 1
          })
        }))
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames') as unknown as NextRequest
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.frames).toHaveLength(1)
      expect(data.data.page).toBe(1)
      expect(data.data.limit).toBe(20)
      expect(data.data.total).toBe(1)
    })

    it('should handle search parameters', async () => {
      const mockQuery = {
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0
            })
          }))
        }))
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames?search=test&page=2&limit=10&sortBy=title&sortOrder=asc') as unknown as NextRequest
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.page).toBe(2)
      expect(data.data.limit).toBe(10)
      expect(mockQuery.or).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
              count: null
            })
          }))
        }))
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames') as unknown as NextRequest
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.code).toBe('DATABASE_ERROR')
    })
  })

  describe('POST', () => {
    const validFrameData: CreateFrameRequest = {
      handle: 'test-frame',
      title: 'Test Frame',
      description: 'A test frame',
      keywords: ['test', 'frame'],
      width: 128,
      height: 128,
      permissions: 'open'
    }

    it('should create a new frame successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockUserData = { handle: 'testuser' }
      const mockNewFrame = {
        id: 'frame-1',
        ...validFrameData,
        owner_handle: 'testuser',
        is_frozen: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock user lookup
      mockSupabase.from.mockImplementation((table) => {
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
                    data: null,
                    error: { code: 'PGRST116' } // Not found
                  })
                }))
              }))
            })),
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: mockNewFrame,
                  error: null
                })
              }))
            }))
          }
        }
        if (table === 'frame_stats') {
          return {
            insert: jest.fn().mockResolvedValue({
              error: null
            })
          }
        }
        return mockSupabase.from()
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames', {
        method: 'POST',
        body: JSON.stringify(validFrameData)
      }) as unknown as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.handle).toBe(validFrameData.handle)
      expect(data.data.title).toBe(validFrameData.title)
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames', {
        method: 'POST',
        body: JSON.stringify(validFrameData)
      }) as unknown as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.code).toBe('UNAUTHORIZED')
    })

    it('should validate frame handle', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockUserData = { handle: 'testuser' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null
            })
          }))
        }))
      })

      const invalidData = { ...validFrameData, handle: 'ab' } // Too short

      const request = new MockNextRequest('http://localhost:3000/api/frames', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      }) as unknown as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_HANDLE')
    })

    it('should validate frame title', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockUserData = { handle: 'testuser' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null
            })
          }))
        }))
      })

      const invalidData = { ...validFrameData, title: '' } // Empty title

      const request = new MockNextRequest('http://localhost:3000/api/frames', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      }) as unknown as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_TITLE')
    })

    it('should validate frame dimensions', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockUserData = { handle: 'testuser' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null
            })
          }))
        }))
      })

      const invalidData = { ...validFrameData, width: 100, height: 100 } // Invalid dimensions

      const request = new MockNextRequest('http://localhost:3000/api/frames', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      }) as unknown as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_DIMENSIONS')
    })

    it('should check for duplicate frame handles', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockUserData = { handle: 'testuser' }
      const mockExistingFrame = { id: 'existing-frame' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockImplementation((table) => {
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
                    data: mockExistingFrame,
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const request = new MockNextRequest('http://localhost:3000/api/frames', {
        method: 'POST',
        body: JSON.stringify(validFrameData)
      }) as unknown as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('HANDLE_EXISTS')
    })
  })
})