import {
  filterFrames,
  sortFrames,
  paginateFrames,
  formatTimeAgo,
  formatNumber,
  validateSearchParams,
  buildFrameSearchParams,
  parseFrameSearchParams
} from '../frame-utils'
import { FrameWithStats } from '@/lib/types'

// Mock frame data for testing
const mockFrames: FrameWithStats[] = [
  {
    id: '1',
    handle: 'test-frame-1',
    title: 'Test Frame One',
    description: 'A test frame for unit testing',
    keywords: ['test', 'pixel', 'art'],
    owner_handle: 'user1',
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
  },
  {
    id: '2',
    handle: 'test-frame-2',
    title: 'Another Frame',
    description: 'Another frame for testing search functionality',
    keywords: ['search', 'filter'],
    owner_handle: 'user2',
    width: 256,
    height: 256,
    permissions: 'approval-required',
    is_frozen: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    stats: {
      frame_id: '2',
      contributors_count: 3,
      total_pixels: 50,
      likes_count: 25,
      last_activity: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  },
  {
    id: '3',
    handle: 'popular-frame',
    title: 'Popular Frame',
    description: 'A very popular frame with lots of activity',
    keywords: ['popular', 'trending'],
    owner_handle: 'user3',
    width: 512,
    height: 288,
    permissions: 'open',
    is_frozen: true,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    stats: {
      frame_id: '3',
      contributors_count: 20,
      total_pixels: 1000,
      likes_count: 100,
      last_activity: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }
  }
]

describe('filterFrames', () => {
  test('returns all frames when search is empty', () => {
    const result = filterFrames(mockFrames, '')
    expect(result).toEqual(mockFrames)
  })

  test('filters frames by title', () => {
    const result = filterFrames(mockFrames, 'Test Frame')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Test Frame One')
  })

  test('filters frames by description', () => {
    const result = filterFrames(mockFrames, 'search functionality')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Another Frame')
  })

  test('filters frames by keywords', () => {
    const result = filterFrames(mockFrames, 'pixel')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Test Frame One')
  })

  test('filters frames by owner handle', () => {
    const result = filterFrames(mockFrames, 'user2')
    expect(result).toHaveLength(1)
    expect(result[0].owner_handle).toBe('user2')
  })

  test('is case insensitive', () => {
    const result = filterFrames(mockFrames, 'POPULAR')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Popular Frame')
  })

  test('returns empty array when no matches found', () => {
    const result = filterFrames(mockFrames, 'nonexistent')
    expect(result).toHaveLength(0)
  })
})

describe('sortFrames', () => {
  test('sorts by title ascending', () => {
    const result = sortFrames(mockFrames, 'title', 'asc')
    expect(result[0].title).toBe('Another Frame')
    expect(result[1].title).toBe('Popular Frame')
    expect(result[2].title).toBe('Test Frame One')
  })

  test('sorts by title descending', () => {
    const result = sortFrames(mockFrames, 'title', 'desc')
    expect(result[0].title).toBe('Test Frame One')
    expect(result[1].title).toBe('Popular Frame')
    expect(result[2].title).toBe('Another Frame')
  })

  test('sorts by created_at descending by default', () => {
    const result = sortFrames(mockFrames, 'created_at', 'desc')
    expect(result[0].id).toBe('3') // Latest created
    expect(result[1].id).toBe('2')
    expect(result[2].id).toBe('1') // Earliest created
  })

  test('sorts by total_pixels descending', () => {
    const result = sortFrames(mockFrames, 'total_pixels', 'desc')
    expect(result[0].stats.total_pixels).toBe(1000)
    expect(result[1].stats.total_pixels).toBe(100)
    expect(result[2].stats.total_pixels).toBe(50)
  })

  test('sorts by likes_count ascending', () => {
    const result = sortFrames(mockFrames, 'likes_count', 'asc')
    expect(result[0].stats.likes_count).toBe(10)
    expect(result[1].stats.likes_count).toBe(25)
    expect(result[2].stats.likes_count).toBe(100)
  })

  test('does not mutate original array', () => {
    const original = [...mockFrames]
    sortFrames(mockFrames, 'title', 'asc')
    expect(mockFrames).toEqual(original)
  })
})

describe('paginateFrames', () => {
  test('returns first page correctly', () => {
    const result = paginateFrames(mockFrames, 1, 2)
    expect(result.frames).toHaveLength(2)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(2)
    expect(result.total).toBe(3)
  })

  test('returns second page correctly', () => {
    const result = paginateFrames(mockFrames, 2, 2)
    expect(result.frames).toHaveLength(1)
    expect(result.page).toBe(2)
    expect(result.limit).toBe(2)
    expect(result.total).toBe(3)
  })

  test('returns empty array for page beyond available data', () => {
    const result = paginateFrames(mockFrames, 5, 2)
    expect(result.frames).toHaveLength(0)
    expect(result.page).toBe(5)
    expect(result.total).toBe(3)
  })

  test('uses default values when not provided', () => {
    const result = paginateFrames(mockFrames)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.frames).toEqual(mockFrames)
  })
})

describe('formatTimeAgo', () => {
  beforeEach(() => {
    // Mock current time to 2024-01-01T12:00:00Z
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('formats seconds ago', () => {
    const result = formatTimeAgo('2024-01-01T11:59:30Z')
    expect(result).toBe('just now')
  })

  test('formats minutes ago', () => {
    const result = formatTimeAgo('2024-01-01T11:55:00Z')
    expect(result).toBe('5m ago')
  })

  test('formats hours ago', () => {
    const result = formatTimeAgo('2024-01-01T10:00:00Z')
    expect(result).toBe('2h ago')
  })

  test('formats days ago', () => {
    const result = formatTimeAgo('2023-12-30T12:00:00Z')
    expect(result).toBe('2d ago')
  })

  test('formats old dates as date string', () => {
    const result = formatTimeAgo('2023-01-01T12:00:00Z')
    expect(result).toMatch(/1\/1\/2023/)
  })
})

describe('formatNumber', () => {
  test('formats small numbers as-is', () => {
    expect(formatNumber(42)).toBe('42')
    expect(formatNumber(999)).toBe('999')
  })

  test('formats thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1.0K')
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(999999)).toBe('1000.0K')
  })

  test('formats millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1.0M')
    expect(formatNumber(2500000)).toBe('2.5M')
  })
})

describe('validateSearchParams', () => {
  test('validates and corrects invalid sort field', () => {
    const result = validateSearchParams({ sortBy: 'invalid_field' })
    expect(result.sortBy).toBe('created_at')
  })

  test('validates and corrects invalid sort order', () => {
    const result = validateSearchParams({ sortOrder: 'invalid' as 'asc' | 'desc' })
    expect(result.sortOrder).toBe('desc')
  })

  test('validates and corrects invalid page number', () => {
    const result = validateSearchParams({ page: -1 })
    expect(result.page).toBe(1)
  })

  test('validates and corrects invalid limit', () => {
    const result = validateSearchParams({ limit: 100 })
    expect(result.limit).toBe(50) // Max limit is 50
  })

  test('trims search string', () => {
    const result = validateSearchParams({ search: '  test  ' })
    expect(result.search).toBe('test')
  })

  test('preserves valid parameters', () => {
    const params = {
      search: 'test',
      sortBy: 'title',
      sortOrder: 'asc' as const,
      page: 2,
      limit: 10
    }
    const result = validateSearchParams(params)
    expect(result).toEqual(params)
  })
})

describe('buildFrameSearchParams', () => {
  test('builds URL params with all options', () => {
    const options = {
      search: 'test',
      sortBy: 'title',
      sortOrder: 'asc' as const,
      page: 2,
      limit: 10
    }
    const params = buildFrameSearchParams(options)
    
    expect(params.get('search')).toBe('test')
    expect(params.get('sortBy')).toBe('title')
    expect(params.get('sortOrder')).toBe('asc')
    expect(params.get('page')).toBe('2')
    expect(params.get('limit')).toBe('10')
  })

  test('omits default values', () => {
    const options = {
      sortBy: 'created_at',
      sortOrder: 'desc' as const,
      page: 1,
      limit: 20
    }
    const params = buildFrameSearchParams(options)
    
    expect(params.get('sortBy')).toBeNull()
    expect(params.get('sortOrder')).toBeNull()
    expect(params.get('page')).toBeNull()
    expect(params.get('limit')).toBeNull()
  })

  test('omits empty search', () => {
    const options = { search: '' }
    const params = buildFrameSearchParams(options)
    expect(params.get('search')).toBeNull()
  })
})

describe('parseFrameSearchParams', () => {
  test('parses URL search params correctly', () => {
    const searchParams = new URLSearchParams('search=test&sortBy=title&sortOrder=asc&page=2&limit=10')
    const result = parseFrameSearchParams(searchParams)
    
    expect(result).toEqual({
      search: 'test',
      sortBy: 'title',
      sortOrder: 'asc',
      page: 2,
      limit: 10
    })
  })

  test('uses defaults for missing params', () => {
    const searchParams = new URLSearchParams()
    const result = parseFrameSearchParams(searchParams)
    
    expect(result).toEqual({
      search: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
      limit: 20
    })
  })

  test('validates parsed params', () => {
    const searchParams = new URLSearchParams('sortBy=invalid&page=-1&limit=100')
    const result = parseFrameSearchParams(searchParams)
    
    expect(result.sortBy).toBe('created_at')
    expect(result.page).toBe(1)
    expect(result.limit).toBe(50)
  })
})