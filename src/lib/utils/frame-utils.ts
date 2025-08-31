import { FrameWithStats } from '@/lib/types'

/**
 * Utility functions for frame operations and filtering
 */

export interface FrameSearchOptions {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * Filters frames based on search criteria
 */
export function filterFrames(frames: FrameWithStats[], search: string): FrameWithStats[] {
  if (!search.trim()) {
    return frames
  }

  const searchTerm = search.toLowerCase().trim()
  
  return frames.filter(frame => {
    // Search in title
    if (frame.title.toLowerCase().includes(searchTerm)) {
      return true
    }
    
    // Search in description
    if (frame.description?.toLowerCase().includes(searchTerm)) {
      return true
    }
    
    // Search in keywords
    if (frame.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm))) {
      return true
    }
    
    // Search in owner handle
    if (frame.owner_handle.toLowerCase().includes(searchTerm)) {
      return true
    }
    
    return false
  })
}

/**
 * Sorts frames based on the specified criteria
 */
export function sortFrames(
  frames: FrameWithStats[], 
  sortBy: string, 
  sortOrder: 'asc' | 'desc' = 'desc'
): FrameWithStats[] {
  const sorted = [...frames].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'created_at':
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
      case 'updated_at':
        aValue = new Date(a.updated_at).getTime()
        bValue = new Date(b.updated_at).getTime()
        break
      case 'last_activity':
        aValue = a.stats.last_activity ? new Date(a.stats.last_activity).getTime() : 0
        bValue = b.stats.last_activity ? new Date(b.stats.last_activity).getTime() : 0
        break
      case 'total_pixels':
        aValue = a.stats.total_pixels
        bValue = b.stats.total_pixels
        break
      case 'contributors_count':
        aValue = a.stats.contributors_count
        bValue = b.stats.contributors_count
        break
      case 'likes_count':
        aValue = a.stats.likes_count
        bValue = b.stats.likes_count
        break
      default:
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1
    }
    return 0
  })

  return sorted
}

/**
 * Paginates an array of frames
 */
export function paginateFrames(
  frames: FrameWithStats[], 
  page: number = 1, 
  limit: number = 20
): { frames: FrameWithStats[]; total: number; page: number; limit: number } {
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  
  return {
    frames: frames.slice(startIndex, endIndex),
    total: frames.length,
    page,
    limit
  }
}

/**
 * Formats time ago string for display
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}

/**
 * Formats numbers for display (e.g., 1000 -> 1K)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * Validates search parameters
 */
export function validateSearchParams(params: FrameSearchOptions): FrameSearchOptions {
  const validSortFields = [
    'created_at', 
    'updated_at', 
    'title', 
    'total_pixels', 
    'contributors_count', 
    'likes_count', 
    'last_activity'
  ]

  return {
    search: params.search?.trim() || '',
    sortBy: validSortFields.includes(params.sortBy || '') ? params.sortBy : 'created_at',
    sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc',
    page: Math.max(1, params.page || 1),
    limit: Math.min(50, Math.max(1, params.limit || 20))
  }
}

/**
 * Builds URL search parameters for frame queries
 */
export function buildFrameSearchParams(options: FrameSearchOptions): URLSearchParams {
  const params = new URLSearchParams()
  
  if (options.search?.trim()) {
    params.set('search', options.search.trim())
  }
  
  if (options.sortBy && options.sortBy !== 'created_at') {
    params.set('sortBy', options.sortBy)
  }
  
  if (options.sortOrder && options.sortOrder !== 'desc') {
    params.set('sortOrder', options.sortOrder)
  }
  
  if (options.page && options.page > 1) {
    params.set('page', options.page.toString())
  }
  
  if (options.limit && options.limit !== 20) {
    params.set('limit', options.limit.toString())
  }
  
  return params
}

/**
 * Extracts frame search options from URL search parameters
 */
export function parseFrameSearchParams(searchParams: URLSearchParams): FrameSearchOptions {
  return validateSearchParams({
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20')
  })
}