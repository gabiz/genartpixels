/**
 * Tests for LikeButton component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LikeButton } from '../like-button'
import { useAuth } from '@/lib/auth/context'

// Mock the auth context
jest.mock('@/lib/auth/context')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch
global.fetch = jest.fn()

describe('LikeButton', () => {
  const defaultProps = {
    frameOwnerHandle: 'testuser',
    frameHandle: 'testframe',
    initialLiked: false,
    initialLikesCount: 5
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  it('renders with initial state', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', handle: 'currentuser' } as any,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn()
    })

    render(<LikeButton {...defaultProps} />)
    
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows liked state when initially liked', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', handle: 'currentuser' } as any,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn()
    })

    render(<LikeButton {...defaultProps} initialLiked={true} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-red-500')
  })

  it('disables button when user is not logged in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn()
    })

    render(<LikeButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('cursor-not-allowed', 'opacity-50')
  })

  it('handles like toggle successfully', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', handle: 'currentuser' } as any,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn()
    })

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          liked: true,
          likesCount: 6
        }
      })
    })

    render(<LikeButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/frames/testuser/testframe/like',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', handle: 'currentuser' } as any,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn()
    })

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Failed to like frame'
      })
    })

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    render(<LikeButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    // Should maintain original state on error
    expect(screen.getByText('5')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('formats large numbers correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', handle: 'currentuser' } as any,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn()
    })

    render(<LikeButton {...defaultProps} initialLikesCount={1500} />)
    expect(screen.getByText('1.5K')).toBeInTheDocument()

    render(<LikeButton {...defaultProps} initialLikesCount={1500000} />)
    expect(screen.getByText('1.5M')).toBeInTheDocument()
  })

  it('hides count when showCount is false', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', handle: 'currentuser' } as any,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn()
    })

    render(<LikeButton {...defaultProps} showCount={false} />)
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })

  it('applies different sizes correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', handle: 'currentuser' } as any,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn()
    })

    const { rerender } = render(<LikeButton {...defaultProps} size="sm" />)
    expect(screen.getByRole('button')).toHaveClass('p-1', 'text-xs')

    rerender(<LikeButton {...defaultProps} size="lg" />)
    expect(screen.getByRole('button')).toHaveClass('p-3', 'text-base')
  })
})