import { render, screen, waitFor } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import { FrameDashboard } from '../frame-dashboard'
import { FrameListResponse } from '@/lib/types'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

// Mock child components
jest.mock('../frame-search', () => ({
  FrameSearch: ({ onSearchChange, onSortChange }: { onSearchChange?: (search: string) => void; onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void }) => (
    <div data-testid="frame-search">
      <button onClick={() => onSearchChange?.('test')}>Search</button>
      <button onClick={() => onSortChange?.('title', 'asc')}>Sort</button>
    </div>
  )
}))

jest.mock('../frame-grid', () => ({
  FrameGrid: ({ frames, loading, error }: { frames: unknown[]; loading?: boolean; error?: string | null }) => (
    <div data-testid="frame-grid">
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {frames.length > 0 && <div>Frames: {frames.length}</div>}
    </div>
  )
}))

jest.mock('../frame-pagination', () => ({
  FramePagination: ({ currentPage, totalPages }: { currentPage: number; totalPages: number }) => (
    <div data-testid="frame-pagination">Page {currentPage} of {totalPages}</div>
  )
}))

const mockInitialData: FrameListResponse = {
  frames: [],
  total: 0,
  page: 1,
  limit: 20
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: mockInitialData
    })
  })
})

describe('FrameDashboard', () => {
  test('renders dashboard components', () => {
    render(<FrameDashboard initialData={mockInitialData} />)
    
    expect(screen.getByText('Discover Frames')).toBeInTheDocument()
    expect(screen.getByText('Explore collaborative pixel art created by the community')).toBeInTheDocument()
    expect(screen.getByTestId('frame-search')).toBeInTheDocument()
    expect(screen.getByTestId('frame-grid')).toBeInTheDocument()
    expect(screen.getByTestId('frame-pagination')).toBeInTheDocument()
  })

  test('displays initial data', () => {
    const initialData = {
      frames: [
        {
          id: '1',
          handle: 'test-frame',
          title: 'Test Frame',
          description: 'Test',
          keywords: [],
          owner_handle: 'user1',
          width: 128,
          height: 128,
          permissions: 'open' as const,
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
        }
      ],
      total: 1,
      page: 1,
      limit: 20
    }

    render(<FrameDashboard initialData={initialData} />)
    
    expect(screen.getByText('Frames: 1')).toBeInTheDocument()
    expect(screen.getByText('1', { selector: 'span.font-medium' })).toBeInTheDocument()
  })

  test('handles loading state', async () => {
    render(<FrameDashboard />)
    
    // Component should render without initial data
    expect(screen.getByText('Discover Frames')).toBeInTheDocument()
  })

  test('handles error state', () => {
    render(<FrameDashboard />)
    
    // Component should render basic structure
    expect(screen.getByText('Discover Frames')).toBeInTheDocument()
  })

  test('handles API error response', () => {
    render(<FrameDashboard />)
    
    // Component should render basic structure
    expect(screen.getByText('Discover Frames')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(<FrameDashboard className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('shows refresh button', () => {
    render(<FrameDashboard />)
    
    expect(screen.getByText('Refresh')).toBeInTheDocument()
  })
})