/**
 * Tests for frame like/unlike API endpoint
 */

import { NextRequest } from 'next/server'
import { POST, GET } from '../route'

// Mock Supabase client
const mockSupabaseInstance = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis()
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseInstance)
}))

describe('/api/frames/[userHandle]/[frameHandle]/like', () => {
  const mockParams = {
    userHandle: 'testuser',
    frameHandle: 'testframe'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should like a frame successfully', async () => {
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabaseInstance.single
        .mockResolvedValueOnce({ // User query
          data: { handle: 'testuser' },
          error: null
        })
        .mockResolvedValueOnce({ // Frame query
          data: { id: 'frame-123' },
          error: null
        })
        .mockResolvedValueOnce({ // Existing like check
          data: null,
          error: { code: 'PGRST116' } // Not found
        })
        .mockResolvedValueOnce({ // Stats query
          data: { likes_count: 1 },
          error: null
        })

      mockSupabaseInstance.insert.mockResolvedValue({ error: null })

      const request = new NextRequest('http://localhost/api/frames/testuser/testframe/like', {
        method: 'POST'
      })

      const response = await POST(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.liked).toBe(true)
      expect(data.data.likesCount).toBe(1)
    })

    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost/api/frames/testuser/testframe/like', {
        method: 'POST'
      })

      const response = await POST(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('GET', () => {
    it('should return like status for authenticated user', async () => {
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockSupabaseInstance.single
        .mockResolvedValueOnce({ // User query
          data: { handle: 'testuser' },
          error: null
        })
        .mockResolvedValueOnce({ // Frame query
          data: { id: 'frame-123' },
          error: null
        })
        .mockResolvedValueOnce({ // Like check
          data: { id: 'like-123' },
          error: null
        })
        .mockResolvedValueOnce({ // Stats query
          data: { likes_count: 5 },
          error: null
        })

      const request = new NextRequest('http://localhost/api/frames/testuser/testframe/like', {
        method: 'GET'
      })

      const response = await GET(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.liked).toBe(true)
      expect(data.data.likesCount).toBe(5)
    })

    it('should return like status for unauthenticated user', async () => {
      mockSupabaseInstance.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabaseInstance.single
        .mockResolvedValueOnce({ // Frame query
          data: { id: 'frame-123' },
          error: null
        })
        .mockResolvedValueOnce({ // Stats query
          data: { likes_count: 5 },
          error: null
        })

      const request = new NextRequest('http://localhost/api/frames/testuser/testframe/like', {
        method: 'GET'
      })

      const response = await GET(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.liked).toBe(false)
      expect(data.data.likesCount).toBe(5)
    })
  })
})