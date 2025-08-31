/**
 * Integration tests for frame viewer page
 */

import { render } from '@testing-library/react'
import { notFound } from 'next/navigation'
import FramePage, { generateMetadata } from '../page'

// Mock Next.js functions
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}))

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: () => [],
    setAll: () => {},
  })),
}))

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}))

// Mock the FrameViewer component to avoid Canvas issues
jest.mock('@/components/frames/frame-viewer', () => ({
  FrameViewer: ({ frame }: any) => (
    <div data-testid="frame-viewer">
      <h1>{frame.title}</h1>
      <p>by @{frame.owner_handle}</p>
    </div>
  ),
}))

describe('Frame Page', () => {
  const mockParams = Promise.resolve({
    userHandle: 'testuser',
    frameHandle: 'test-frame',
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('generates correct metadata for existing frame', async () => {
    const mockFrame = {
      id: 'frame-1',
      handle: 'test-frame',
      title: 'Test Frame',
      description: 'A test frame',
      keywords: ['test', 'demo'],
      owner_handle: 'testuser',
      width: 128,
      height: 128,
      permissions: 'open',
      is_frozen: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contributors_count: 5,
      total_pixels: 100,
      likes_count: 10,
      last_activity: new Date().toISOString(),
    }

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockFrame,
              error: null,
            }),
          })),
        })),
      })),
    })

    const metadata = await generateMetadata({ params: mockParams })

    expect(metadata.title).toContain('Test Frame')
    expect(metadata.title).toContain('@testuser')
    expect(metadata.description).toContain('A test frame')
    expect(metadata.keywords).toEqual(['test', 'demo'])
  })

  test('generates not found metadata for missing frame', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          })),
        })),
      })),
    })

    const metadata = await generateMetadata({ params: mockParams })

    expect(metadata.title).toBe('Frame Not Found')
    expect(metadata.description).toContain('could not be found')
  })

  test('calls notFound for missing frame', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          })),
        })),
      })),
    })

    try {
      await FramePage({ params: mockParams })
    } catch (error) {
      // notFound() throws an error in Next.js
    }

    expect(notFound).toHaveBeenCalled()
  })
})