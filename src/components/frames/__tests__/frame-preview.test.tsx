import { render, screen, fireEvent } from '@testing-library/react'
import { FramePreview } from '../frame-preview'
import { FrameWithStats } from '@/lib/types'
import { useAuth } from '@/lib/auth/context'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock the auth context
jest.mock('@/lib/auth/context')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch
global.fetch = jest.fn()

const mockFrame: FrameWithStats = {
  id: '1',
  handle: 'test-frame',
  title: 'Test Frame',
  description: 'A test frame for unit testing',
  keywords: ['test', 'pixel', 'art'],
  owner_handle: 'testuser',
  width: 128,
  height: 128,
  permissions: 'open',
  is_frozen: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  stats: {
    frame_id: '1',
    contributors_count: 5,
    total_pixels: 100,
    likes_count: 10,
    last_activity: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
}

describe('FramePreview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
    
    // Mock auth context with default values
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      createHandle: jest.fn()
    })
  })

  test('renders frame information correctly', () => {
    render(<FramePreview frame={mockFrame} />)
    
    expect(screen.getByText('Test Frame')).toBeInTheDocument()
    expect(screen.getByText('A test frame for unit testing')).toBeInTheDocument()
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'by @testuser'
    })).toBeInTheDocument()
    expect(screen.getByText('128×128')).toBeInTheDocument()
  })

  test('displays frame statistics', () => {
    render(<FramePreview frame={mockFrame} />)
    
    expect(screen.getByText('5')).toBeInTheDocument() // contributors
    expect(screen.getByText('100')).toBeInTheDocument() // pixels
    expect(screen.getByText('10')).toBeInTheDocument() // likes
  })

  test('displays keywords', () => {
    render(<FramePreview frame={mockFrame} />)
    
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('pixel')).toBeInTheDocument()
    expect(screen.getByText('art')).toBeInTheDocument()
  })

  test('shows frozen indicator when frame is frozen', () => {
    const frozenFrame = { ...mockFrame, is_frozen: true }
    render(<FramePreview frame={frozenFrame} />)
    
    expect(screen.getByText('Frozen')).toBeInTheDocument()
  })

  test('shows permission indicator for non-open frames', () => {
    const approvalFrame = { ...mockFrame, permissions: 'approval-required' as const }
    render(<FramePreview frame={approvalFrame} />)
    
    expect(screen.getByText('Approval')).toBeInTheDocument()
  })

  test('shows private indicator for owner-only frames', () => {
    const privateFrame = { ...mockFrame, permissions: 'owner-only' as const }
    render(<FramePreview frame={privateFrame} />)
    
    expect(screen.getByText('Private')).toBeInTheDocument()
  })

  test('links to correct frame URL', () => {
    render(<FramePreview frame={mockFrame} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/testuser/test-frame')
  })

  test('handles missing description gracefully', () => {
    const frameWithoutDescription = { ...mockFrame, description: null }
    render(<FramePreview frame={frameWithoutDescription} />)
    
    expect(screen.getByText('No description')).toBeInTheDocument()
  })

  test('limits keywords display to 3 items', () => {
    const frameWithManyKeywords = {
      ...mockFrame,
      keywords: ['one', 'two', 'three', 'four', 'five']
    }
    render(<FramePreview frame={frameWithManyKeywords} />)
    
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
    expect(screen.getByText('three')).toBeInTheDocument()
    expect(screen.getByText('+2 more')).toBeInTheDocument()
    expect(screen.queryByText('four')).not.toBeInTheDocument()
  })

  test('formats large numbers correctly', () => {
    const popularFrame = {
      ...mockFrame,
      stats: {
        ...mockFrame.stats,
        contributors_count: 1500,
        total_pixels: 2500000,
        likes_count: 1000000
      }
    }
    render(<FramePreview frame={popularFrame} />)
    
    expect(screen.getByText('1.5K')).toBeInTheDocument() // contributors
    expect(screen.getByText('2.5M')).toBeInTheDocument() // pixels
    expect(screen.getByText('1.0M')).toBeInTheDocument() // likes
  })

  test('handles hover state changes', () => {
    render(<FramePreview frame={mockFrame} />)
    
    const link = screen.getByRole('link')
    
    fireEvent.mouseEnter(link)
    // Note: Testing hover state changes would require more complex setup
    // as CSS classes and transforms are not easily testable in jsdom
    
    fireEvent.mouseLeave(link)
    // Same note applies here
  })

  test('applies custom className', () => {
    const { container } = render(<FramePreview frame={mockFrame} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})