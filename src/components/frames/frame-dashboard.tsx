'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { FrameWithStats, FrameListResponse, APIResponse, APIError } from '@/lib/types'
import { FrameSearch } from './frame-search'
import { FrameGrid } from './frame-grid'
import { FramePagination } from './frame-pagination'

interface FrameDashboardProps {
  initialData?: FrameListResponse
  className?: string
}

export function FrameDashboard({ initialData, className = '' }: FrameDashboardProps) {
  const searchParams = useSearchParams()
  
  // State management
  const [frames, setFrames] = useState<FrameWithStats[]>(initialData?.frames || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(initialData?.total || 0)
  const [currentPage, setCurrentPage] = useState(initialData?.page || 1)
  const [itemsPerPage] = useState(20)

  // Search and filter state
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  )

  // Fetch frames from API
  const fetchFrames = useCallback(async (
    page: number = 1,
    searchTerm: string = search,
    sortField: string = sortBy,
    sortDirection: 'asc' | 'desc' = sortOrder
  ) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortField,
        sortOrder: sortDirection
      })

      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      }

      const response = await fetch(`/api/frames?${params}`)
      const data: APIResponse<FrameListResponse> | APIError = await response.json()

      if (!response.ok || !data.success) {
        const errorData = data as APIError
        throw new Error(errorData.error || 'Failed to fetch frames')
      }

      const successData = data as APIResponse<FrameListResponse>
      setFrames(successData.data.frames)
      setTotalItems(successData.data.total)
      setCurrentPage(successData.data.page)
    } catch (err) {
      console.error('Error fetching frames:', err)
      setError(err instanceof Error ? err.message : 'Failed to load frames')
      setFrames([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [search, sortBy, sortOrder, itemsPerPage])

  // Handle search changes
  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch)
    setCurrentPage(1)
    fetchFrames(1, newSearch, sortBy, sortOrder)
  }, [fetchFrames, sortBy, sortOrder])

  // Handle sort changes
  const handleSortChange = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setCurrentPage(1)
    fetchFrames(1, search, newSortBy, newSortOrder)
  }, [fetchFrames, search])

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage)
    fetchFrames(newPage, search, sortBy, sortOrder)
  }, [fetchFrames, search, sortBy, sortOrder])

  // Refresh frames
  const refreshFrames = useCallback(() => {
    fetchFrames(currentPage, search, sortBy, sortOrder)
  }, [fetchFrames, currentPage, search, sortBy, sortOrder])

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(refreshFrames, 30000)
    return () => clearInterval(interval)
  }, [refreshFrames])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Discover Frames
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore collaborative pixel art created by the community
          </p>
        </div>
        
        {/* Refresh button */}
        <button
          onClick={refreshFrames}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg 
            className={`-ml-1 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Search and filters */}
      <FrameSearch
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
      />

      {/* Results summary */}
      {!loading && !error && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {search ? (
            <span>
              Found <span className="font-medium">{totalItems}</span> frames matching &ldquo;{search}&rdquo;
            </span>
          ) : (
            <span>
              Showing <span className="font-medium">{totalItems}</span> frames
            </span>
          )}
        </div>
      )}

      {/* Frame grid */}
      <FrameGrid
        frames={frames}
        loading={loading}
        error={error}
      />

      {/* Pagination */}
      <FramePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  )
}