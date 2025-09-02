/**
 * Tests for FrameViewer component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FrameViewer } from '../frame-viewer'
import type { FrameWithStats, FramePermission } from '@/lib/types'
// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Mock the realtime hooks
jest.mock('@/lib/realtime/hooks', () => ({
  useFrameRealtime: () => ({
    events: [],
    isSubscribed: false,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    clearEvents: jest.fn()
  })
}))
import type { FrameWithStats, FramePermission } from '@/lib/types'

// Mock the auth context
jest.mock('@/lib/auth/context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      handle: 'testuser',
      email: 'test@example.com',
      pixels_available: 50,
      last_refill: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    refreshUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    createHandle: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockUser = {
  id: 'user-1',
  handle: 'testuser',
  email: 'test@example.com',
  pixels_available: 50,
  last_refill: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const mockFrame: FrameWithStats = {
  id: 'frame-1',
  handle: 'test-frame',
  title: 'Test Frame',
  description: 'A test frame for unit testing',
  keywords: ['test', 'demo'],
  owner_handle: 'frameowner',
  width: 128,
  height: 128,
  permissions: 'open',
  is_frozen: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  stats: {
    frame_id: 'frame-1',
    contributors_count: 5,
    total_pixels: 100,
    likes_count: 10,
    last_activity: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

const mockUserPermission: FramePermission = {
  id: 'perm-1',
  frame_id: 'frame-1',
  user_handle: 'testuser',
  permission_type: 'contributor',
  granted_by: 'frameowner',
  created_at: new Date().toISOString()
}

// Mock fetch
global.fetch = jest.fn()

// Mock window.matchMedia for mobile detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
})

const renderFrameViewer = (props: Partial<React.ComponentProps<typeof FrameViewer>> = {}) => {
  const defaultProps = {
    frame: mockFrame,
    userPermission: mockUserPermission,
    currentUserHandle: 'testuser',
    frameOwnerHandle: 'frameowner',
    frameHandle: 'test-frame',
    ...props
  }

  return render(<FrameViewer {...defaultProps} />)
}

describe.skip('FrameViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          frame: mockFrame,
          snapshotData: new Uint8Array(),
          recentPixels: [],
          userPermission: mockUserPermission
        }
      })
    })
  })

  test('renders frame title and owner', async () => {
    renderFrameViewer()
    
    await waitFor(() => {
      expect(screen.getByText('Test Frame')).toBeInTheDocument()
      expect(screen.getByText('by @frameowner')).toBeInTheDocument()
    })
  })

  test('displays frame statistics', async () => {
    renderFrameViewer()
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument() // likes count
      expect(screen.getByText('5')).toBeInTheDocument() // contributors count
      expect(screen.getByText('100')).toBeInTheDocument() // pixels count
    })
  })

  test('shows like and report buttons', async () => {
    renderFrameViewer()
    
    await waitFor(() => {
      expect(screen.getByTitle(/like/i)).toBeInTheDocument()
      expect(screen.getByTitle(/report/i)).toBeInTheDocument()
    })
  })

  test('shows share button and handles sharing', async () => {
    renderFrameViewer()
    
    await waitFor(() => {
      const shareButton = screen.getByTitle('Share frame')
      expect(shareButton).toBeInTheDocument()
      
      fireEvent.click(shareButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost/frameowner/test-frame'
      )
    })
  })

  test('displays frame description when available', async () => {
    renderFrameViewer()
    
    await waitFor(() => {
      expect(screen.getByText('A test frame for unit testing')).toBeInTheDocument()
    })
  })

  test('displays keywords when available', async () => {
    renderFrameViewer()
    
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
      expect(screen.getByText('demo')).toBeInTheDocument()
    })
  })

  test('shows settings button for frame owner', async () => {
    renderFrameViewer({
      currentUserHandle: 'frameowner' // Make user the owner
    })
    
    await waitFor(() => {
      expect(screen.getByTitle('Frame settings')).toBeInTheDocument()
    })
  })

  test('does not show settings button for non-owners', async () => {
    renderFrameViewer({
      currentUserHandle: 'otheruser'
    })
    
    await waitFor(() => {
      expect(screen.queryByTitle('Frame settings')).not.toBeInTheDocument()
    })
  })

  test('handles mobile layout detection', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    renderFrameViewer()
    
    await waitFor(() => {
      // Should show mobile-specific elements
      expect(screen.getByTitle('Toggle pixel editor')).toBeInTheDocument()
    })
  })

  test('shows login prompt for unauthenticated users', async () => {
    renderFrameViewer({
      currentUserHandle: null
    })
    
    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })
  })

  test('handles frozen frames', async () => {
    const frozenFrame = { ...mockFrame, is_frozen: true }
    renderFrameViewer({
      frame: frozenFrame
    })
    
    await waitFor(() => {
      // Should indicate frame is frozen
      expect(screen.getByText(/frozen/i)).toBeInTheDocument()
    })
  })

  test('handles loading state', () => {
    // Mock loading response
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    
    renderFrameViewer()
    
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  test('handles error state', async () => {
    // Mock error response
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    
    renderFrameViewer()
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Frame')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })
})