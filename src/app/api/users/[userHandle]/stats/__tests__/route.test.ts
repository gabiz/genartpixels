/**
 * Unit tests for user stats API route
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}))

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({})),
}))

const mockSupabase = {
  from: jest.fn(),
}

describe('/api/users/[userHandle]/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  test('returns user statistics successfully', async () => {
    const mockUser = {
      handle: 'test_user',
      created_at: '2024-01-01T00:00:00Z',
    }

    const mockStats = {
      handle: 'test_user',
      created_at: '2024-01-01T00:00:00Z',
      frames_created: 5,
      frames_contributed_to: 12,
      total_pixels_placed: 150,
      frames_liked: 8,
    }

    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockStats,
              error: null,
            }),
          }),
        }),
      })

    const request = new NextRequest('http://localhost/api/users/test_user/stats')
    const response = await GET(request, { params: { userHandle: 'test_user' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      handle: 'test_user',
      created_at: '2024-01-01T00:00:00Z',
      frames_created: 5,
      frames_contributed_to: 12,
      total_pixels_placed: 150,
      frames_liked: 8,
    })
  })

  test('returns 404 for non-existent user', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      }),
    })

    const request = new NextRequest('http://localhost/api/users/nonexistent/stats')
    const response = await GET(request, { params: { userHandle: 'nonexistent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  test('returns 400 for invalid handle format', async () => {
    const request = new NextRequest('http://localhost/api/users/ab/stats')
    const response = await GET(request, { params: { userHandle: 'ab' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid handle format')
  })

  test('handles database errors gracefully', async () => {
    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { handle: 'test_user', created_at: '2024-01-01T00:00:00Z' },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      })

    const request = new NextRequest('http://localhost/api/users/test_user/stats')
    const response = await GET(request, { params: { userHandle: 'test_user' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch user statistics')
  })

  test('returns default values for missing stats', async () => {
    const mockUser = {
      handle: 'test_user',
      created_at: '2024-01-01T00:00:00Z',
    }

    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null, // No stats found
              error: null,
            }),
          }),
        }),
      })

    const request = new NextRequest('http://localhost/api/users/test_user/stats')
    const response = await GET(request, { params: { userHandle: 'test_user' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      handle: 'test_user',
      created_at: '2024-01-01T00:00:00Z',
      frames_created: 0,
      frames_contributed_to: 0,
      total_pixels_placed: 0,
      frames_liked: 0,
    })
  })

  test('handles special characters in handle', async () => {
    const request = new NextRequest('http://localhost/api/users/test@user/stats')
    const response = await GET(request, { params: { userHandle: 'test@user' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid handle format')
  })

  test('handles very long handles', async () => {
    const longHandle = 'a'.repeat(25) // Longer than 20 characters
    const request = new NextRequest(`http://localhost/api/users/${longHandle}/stats`)
    const response = await GET(request, { params: { userHandle: longHandle } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid handle format')
  })
})