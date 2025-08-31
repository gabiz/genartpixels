/**
 * Unit tests for UserProfile component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { UserProfile } from '../user-profile'
import { useAuth } from '@/lib/auth/context'

// Mock the auth context
jest.mock('@/lib/auth/context', () => ({
  useAuth: jest.fn(),
}))

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

const mockUser = {
  id: 'test-user-id',
  handle: 'test_user',
  email: 'test@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
  pixels_available: 75,
  last_refill: '2024-01-01T12:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T12:00:00Z',
  frames_created: 5,
  frames_contributed_to: 12,
  total_pixels_placed: 150,
  frames_liked: 8,
}

const mockOwnedFrames = [
  {
    id: 'frame-1',
    handle: 'test-frame',
    title: 'Test Frame',
    description: 'A test frame',
    owner_handle: 'test_user',
    width: 128,
    height: 128,
    created_at: '2024-01-01T00:00:00Z',
    contributors_count: 3,
    total_pixels: 50,
    likes_count: 2,
  },
]

const mockContributedFrames = [
  {
    frame_id: 'frame-2',
    last_contribution: '2024-01-01T10:00:00Z',
    frame: {
      id: 'frame-2',
      handle: 'other-frame',
      title: 'Other Frame',
      owner_handle: 'other_user',
      width: 128,
      height: 128,
      created_at: '2024-01-01T00:00:00Z',
    },
  },
]

describe('UserProfile', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
    })
  })

  test('renders user profile with statistics', () => {
    render(
      <UserProfile
        user={mockUser}
        ownedFrames={mockOwnedFrames}
        contributedFrames={mockContributedFrames}
      />
    )

    // Check user handle is displayed
    expect(screen.getByText('test_user')).toBeInTheDocument()

    // Check statistics are displayed
    expect(screen.getByText('5')).toBeInTheDocument() // frames created
    expect(screen.getByText('150')).toBeInTheDocument() // pixels placed
    expect(screen.getByText('12')).toBeInTheDocument() // frames contributed
    expect(screen.getByText('8')).toBeInTheDocument() // frames liked

    // Check sections are present
    expect(screen.getByText('Created Frames (5)')).toBeInTheDocument()
    expect(screen.getByText('Recent Contributions (12)')).toBeInTheDocument()
  })

  test('shows edit profile button for own profile', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { handle: 'test_user' },
    })

    render(
      <UserProfile
        user={mockUser}
        ownedFrames={mockOwnedFrames}
        contributedFrames={mockContributedFrames}
      />
    )

    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
  })

  test('does not show edit profile button for other users', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { handle: 'different_user' },
    })

    render(
      <UserProfile
        user={mockUser}
        ownedFrames={mockOwnedFrames}
        contributedFrames={mockContributedFrames}
      />
    )

    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument()
  })

  test('displays avatar when available', () => {
    render(
      <UserProfile
        user={mockUser}
        ownedFrames={mockOwnedFrames}
        contributedFrames={mockContributedFrames}
      />
    )

    const avatar = screen.getByAltText("test_user's avatar")
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  test('displays fallback avatar when no avatar URL', () => {
    const userWithoutAvatar = { ...mockUser, avatar_url: undefined }

    render(
      <UserProfile
        user={userWithoutAvatar}
        ownedFrames={mockOwnedFrames}
        contributedFrames={mockContributedFrames}
      />
    )

    expect(screen.getByText('T')).toBeInTheDocument() // First letter of handle
  })

  test('shows empty state for no owned frames', () => {
    render(
      <UserProfile
        user={mockUser}
        ownedFrames={[]}
        contributedFrames={mockContributedFrames}
      />
    )

    expect(screen.getByText("test_user hasn't created any frames yet.")).toBeInTheDocument()
  })

  test('shows empty state for no contributions', () => {
    render(
      <UserProfile
        user={mockUser}
        ownedFrames={mockOwnedFrames}
        contributedFrames={[]}
      />
    )

    expect(screen.getByText("test_user hasn't contributed to any frames yet.")).toBeInTheDocument()
  })

  test('shows create frame button for own profile with no frames', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { handle: 'test_user' },
    })

    render(
      <UserProfile
        user={mockUser}
        ownedFrames={[]}
        contributedFrames={mockContributedFrames}
      />
    )

    expect(screen.getByText("You haven't created any frames yet.")).toBeInTheDocument()
    expect(screen.getByText('Create Your First Frame')).toBeInTheDocument()
  })
})