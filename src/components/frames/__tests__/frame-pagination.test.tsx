import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FramePagination } from '../frame-pagination'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}))

const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
})

describe('FramePagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 100,
    itemsPerPage: 20
  }

  test('renders pagination info correctly', () => {
    render(<FramePagination {...defaultProps} />)
    
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Showing 1 to 20 of 100 frames'
    })).toBeInTheDocument()
  })

  test('renders page numbers correctly', () => {
    render(<FramePagination {...defaultProps} currentPage={3} />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  test('highlights current page', () => {
    render(<FramePagination {...defaultProps} currentPage={3} />)
    
    const currentPageButton = screen.getByText('3')
    expect(currentPageButton).toHaveClass('bg-blue-50', 'text-blue-600')
  })

  test('disables previous button on first page', () => {
    render(<FramePagination {...defaultProps} currentPage={1} />)
    
    const prevButton = screen.getByRole('button', { name: 'Previous' })
    expect(prevButton).toBeDisabled()
  })

  test('disables next button on last page', () => {
    render(<FramePagination {...defaultProps} currentPage={5} />)
    
    const nextButton = screen.getByRole('button', { name: 'Next' })
    expect(nextButton).toBeDisabled()
  })

  test('calls onPageChange when page number is clicked', () => {
    const onPageChange = jest.fn()
    render(<FramePagination {...defaultProps} onPageChange={onPageChange} />)
    
    const pageButton = screen.getByText('3')
    fireEvent.click(pageButton)
    
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  test('calls onPageChange when previous button is clicked', () => {
    const onPageChange = jest.fn()
    render(<FramePagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />)
    
    const prevButton = screen.getByRole('button', { name: 'Previous' })
    fireEvent.click(prevButton)
    
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  test('calls onPageChange when next button is clicked', () => {
    const onPageChange = jest.fn()
    render(<FramePagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />)
    
    const nextButton = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(nextButton)
    
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  test('updates URL when page changes', () => {
    render(<FramePagination {...defaultProps} />)
    
    const pageButton = screen.getByText('3')
    fireEvent.click(pageButton)
    
    expect(mockPush).toHaveBeenCalledWith('/?page=3')
  })

  test('removes page param from URL when navigating to page 1', () => {
    render(<FramePagination {...defaultProps} currentPage={2} />)
    
    const pageButton = screen.getByText('1')
    fireEvent.click(pageButton)
    
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  test('preserves existing search params when updating page', () => {
    const searchParams = new URLSearchParams('search=test&sortBy=title')
    ;(useSearchParams as jest.Mock).mockReturnValue(searchParams)
    
    render(<FramePagination {...defaultProps} />)
    
    const pageButton = screen.getByText('3')
    fireEvent.click(pageButton)
    
    expect(mockPush).toHaveBeenCalledWith('/?search=test&sortBy=title&page=3')
  })

  test('shows dots for large page ranges', () => {
    const largePageProps = {
      ...defaultProps,
      currentPage: 10,
      totalPages: 20
    }
    render(<FramePagination {...largePageProps} />)
    
    expect(screen.getAllByText('...')).toHaveLength(2)
  })

  test('does not render when totalPages is 1 or less', () => {
    const { container } = render(<FramePagination {...defaultProps} totalPages={1} />)
    
    expect(container.firstChild).toBeNull()
  })

  test('does not render when totalItems is 0', () => {
    const { container } = render(<FramePagination {...defaultProps} totalItems={0} />)
    
    expect(container.firstChild).toBeNull()
  })

  test('calculates correct item range for middle pages', () => {
    render(<FramePagination {...defaultProps} currentPage={3} />)
    
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Showing 41 to 60 of 100 frames'
    })).toBeInTheDocument()
  })

  test('calculates correct item range for last page', () => {
    render(<FramePagination {...defaultProps} currentPage={5} totalItems={95} />)
    
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Showing 81 to 95 of 95 frames'
    })).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(<FramePagination {...defaultProps} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('does not call onPageChange for current page', () => {
    const onPageChange = jest.fn()
    render(<FramePagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />)
    
    const currentPageButton = screen.getByText('3')
    fireEvent.click(currentPageButton)
    
    expect(onPageChange).not.toHaveBeenCalled()
  })

  test('does not call onPageChange for invalid page numbers', () => {
    const onPageChange = jest.fn()
    render(<FramePagination {...defaultProps} onPageChange={onPageChange} />)
    
    // Try to navigate to page 0 (should not work)
    const prevButton = screen.getByRole('button', { name: 'Previous' })
    fireEvent.click(prevButton)
    
    expect(onPageChange).not.toHaveBeenCalled()
  })
})