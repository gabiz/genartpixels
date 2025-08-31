import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FrameSearch } from '../frame-search'

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

describe('FrameSearch', () => {
  test('renders search input and sort controls', () => {
    render(<FrameSearch />)
    
    expect(screen.getByPlaceholderText(/search frames/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Newest')).toBeInTheDocument()
    expect(screen.getByTitle(/sort ascending/i)).toBeInTheDocument()
  })

  test('calls onSearchChange when typing in search input', async () => {
    const onSearchChange = jest.fn()
    render(<FrameSearch onSearchChange={onSearchChange} />)
    
    const searchInput = screen.getByPlaceholderText(/search frames/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    // Wait for debounced function to be called
    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('test')
    }, { timeout: 500 })
  })

  test('debounces search input changes', async () => {
    const onSearchChange = jest.fn()
    render(<FrameSearch onSearchChange={onSearchChange} />)
    
    const searchInput = screen.getByPlaceholderText(/search frames/i)
    
    // Type multiple characters quickly
    fireEvent.change(searchInput, { target: { value: 't' } })
    fireEvent.change(searchInput, { target: { value: 'te' } })
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    // Should only call once after debounce delay
    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledTimes(1)
      expect(onSearchChange).toHaveBeenCalledWith('test')
    }, { timeout: 500 })
  })

  test('shows clear button when search has value', () => {
    render(<FrameSearch />)
    
    const searchInput = screen.getByPlaceholderText(/search frames/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument()
  })

  test('clears search when clear button is clicked', () => {
    const onSearchChange = jest.fn()
    render(<FrameSearch onSearchChange={onSearchChange} />)
    
    const searchInput = screen.getByPlaceholderText(/search frames/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    const clearButton = screen.getByRole('button', { name: '' })
    fireEvent.click(clearButton)
    
    expect(searchInput).toHaveValue('')
    expect(onSearchChange).toHaveBeenCalledWith('')
  })

  test('calls onSortChange when sort option changes', () => {
    const onSortChange = jest.fn()
    render(<FrameSearch onSortChange={onSortChange} />)
    
    const sortSelect = screen.getByDisplayValue('Newest')
    fireEvent.change(sortSelect, { target: { value: 'title' } })
    
    expect(onSortChange).toHaveBeenCalledWith('title', 'desc')
  })

  test('toggles sort order when sort order button is clicked', () => {
    const onSortChange = jest.fn()
    render(<FrameSearch onSortChange={onSortChange} />)
    
    const sortOrderButton = screen.getByTitle(/sort ascending/i)
    fireEvent.click(sortOrderButton)
    
    expect(onSortChange).toHaveBeenCalledWith('created_at', 'asc')
  })

  test('updates URL when search changes', async () => {
    render(<FrameSearch />)
    
    const searchInput = screen.getByPlaceholderText(/search frames/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/?search=test')
    }, { timeout: 500 })
  })

  test('updates URL when sort changes', () => {
    render(<FrameSearch />)
    
    const sortSelect = screen.getByDisplayValue('Newest')
    fireEvent.change(sortSelect, { target: { value: 'title' } })
    
    expect(mockPush).toHaveBeenCalledWith('/?sortBy=title&sortOrder=desc')
  })

  test('initializes with values from search params', () => {
    const searchParams = new URLSearchParams('search=test&sortBy=title&sortOrder=asc')
    ;(useSearchParams as jest.Mock).mockReturnValue(searchParams)
    
    render(<FrameSearch />)
    
    expect(screen.getByDisplayValue('test')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Title A-Z')).toBeInTheDocument()
    expect(screen.getByTitle(/sort descending/i)).toBeInTheDocument()
  })

  test('displays all sort options', () => {
    render(<FrameSearch />)
    
    // Check that all options are available
    expect(screen.getByText('Newest')).toBeInTheDocument()
    expect(screen.getByText('Most Active')).toBeInTheDocument()
    expect(screen.getByText('Most Pixels')).toBeInTheDocument()
    expect(screen.getByText('Most Contributors')).toBeInTheDocument()
    expect(screen.getByText('Most Liked')).toBeInTheDocument()
    expect(screen.getByText('Title A-Z')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(<FrameSearch className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('handles same sort field click by toggling order', () => {
    const onSortChange = jest.fn()
    render(<FrameSearch onSortChange={onSortChange} />)
    
    // First click should change to asc
    const sortOrderButton = screen.getByTitle(/sort ascending/i)
    fireEvent.click(sortOrderButton)
    
    expect(onSortChange).toHaveBeenCalledWith('created_at', 'asc')
  })
})