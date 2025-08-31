import { render, screen } from '@testing-library/react'
import { FrameGrid } from '../frame-grid'
import { FrameWithStats } from '@/lib/types'

// Mock the FramePreview component
jest.mock('../frame-preview', () => ({
  FramePreview: ({ frame }: { frame: FrameWithStats }) => (
    <div data-testid={`frame-${frame.id}`}>{frame.title}</div>
  )
}))

// Mock the LoadingSpinner component
jest.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  )
}))

const mockFrames: FrameWithStats[] = [
  {
    id: '1',
    handle: 'frame-1',
    title: 'Frame One',
    description: 'First frame',
    keywords: ['test'],
    owner_handle: 'user1',
    width: 128,
    height: 128,
    permissions: 'open',
    is_frozen: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    stats: {
      frame_id: '1',
      contributors_count: 1,
      total_pixels: 10,
      likes_count: 5,
      last_activity: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  },
  {
    id: '2',
    handle: 'frame-2',
    title: 'Frame Two',
    description: 'Second frame',
    keywords: ['test'],
    owner_handle: 'user2',
    width: 256,
    height: 256,
    permissions: 'open',
    is_frozen: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    stats: {
      frame_id: '2',
      contributors_count: 2,
      total_pixels: 20,
      likes_count: 10,
      last_activity: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  }
]

describe('FrameGrid', () => {
  test('renders frames in grid layout', () => {
    render(<FrameGrid frames={mockFrames} />)
    
    expect(screen.getByTestId('frame-1')).toBeInTheDocument()
    expect(screen.getByTestId('frame-2')).toBeInTheDocument()
    expect(screen.getByText('Frame One')).toBeInTheDocument()
    expect(screen.getByText('Frame Two')).toBeInTheDocument()
  })

  test('shows loading spinner when loading', () => {
    render(<FrameGrid frames={[]} loading={true} />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('shows error message when error occurs', () => {
    const errorMessage = 'Failed to load frames'
    render(<FrameGrid frames={[]} error={errorMessage} />)
    
    expect(screen.getByText('Error loading frames')).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  test('shows empty state when no frames available', () => {
    render(<FrameGrid frames={[]} />)
    
    expect(screen.getByText('No frames found')).toBeInTheDocument()
    expect(screen.getByText(/try adjusting your search criteria/i)).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(<FrameGrid frames={mockFrames} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('uses grid layout classes', () => {
    const { container } = render(<FrameGrid frames={mockFrames} />)
    
    const gridElement = container.querySelector('.grid')
    expect(gridElement).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4')
  })

  test('passes correct props to FramePreview components', () => {
    render(<FrameGrid frames={mockFrames} />)
    
    // Check that both frames are rendered
    expect(screen.getByTestId('frame-1')).toBeInTheDocument()
    expect(screen.getByTestId('frame-2')).toBeInTheDocument()
  })

  test('loading state takes precedence over error state', () => {
    render(<FrameGrid frames={[]} loading={true} error="Some error" />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.queryByText('Error loading frames')).not.toBeInTheDocument()
  })

  test('error state takes precedence over empty state', () => {
    render(<FrameGrid frames={[]} error="Some error" />)
    
    expect(screen.getByText('Error loading frames')).toBeInTheDocument()
    expect(screen.queryByText('No frames found')).not.toBeInTheDocument()
  })

  test('renders with single frame', () => {
    render(<FrameGrid frames={[mockFrames[0]]} />)
    
    expect(screen.getByTestId('frame-1')).toBeInTheDocument()
    expect(screen.queryByTestId('frame-2')).not.toBeInTheDocument()
  })

  test('handles null error gracefully', () => {
    render(<FrameGrid frames={mockFrames} error={null} />)
    
    expect(screen.getByTestId('frame-1')).toBeInTheDocument()
    expect(screen.getByTestId('frame-2')).toBeInTheDocument()
  })
})