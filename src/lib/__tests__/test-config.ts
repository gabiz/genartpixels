/**
 * Test configuration and utilities
 * Handles environment-specific test setup and OAuth availability checks
 */

// Check if OAuth providers are configured
export const isOAuthConfigured = {
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  facebook: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET)
}

// Check if Supabase is available for testing
export const isSupabaseAvailable = () => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return !!(url && key && url.includes('127.0.0.1'))
  } catch {
    return false
  }
}

// Check if realtime features should be tested
export const isRealtimeTestable = () => {
  // Disable realtime tests due to known Supabase client issues
  // that cause infinite loops and stack overflows
  return false
}

// Conditional test runners
export const describeIfSupabase = isSupabaseAvailable() ? describe : describe.skip
export const describeIfOAuth = (provider: keyof typeof isOAuthConfigured) => 
  isOAuthConfigured[provider] ? describe : describe.skip
export const describeIfRealtime = isRealtimeTestable() ? describe : describe.skip

// Test environment info
export const getTestEnvironmentInfo = () => ({
  supabaseAvailable: isSupabaseAvailable(),
  oauthConfigured: isOAuthConfigured,
  realtimeTestable: isRealtimeTestable(),
  nodeEnv: process.env.NODE_ENV,
  testEnvironment: process.env.JEST_ENVIRONMENT || 'node'
})

// Mock data generators for consistent testing
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id',
  handle: 'testuser',
  email: 'test@example.com',
  pixels_available: 100,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockFrame = (overrides: Partial<any> = {}) => ({
  id: 'test-frame-id',
  handle: 'test-frame',
  title: 'Test Frame',
  description: 'A test frame',
  keywords: ['test'],
  owner_handle: 'testuser',
  width: 128,
  height: 128,
  permissions: 'open',
  is_frozen: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockPixel = (overrides: Partial<any> = {}) => ({
  id: 'test-pixel-id',
  frame_id: 'test-frame-id',
  x: 0,
  y: 0,
  color: 0xFF0000,
  contributor_handle: 'testuser',
  placed_at: '2024-01-01T00:00:00Z',
  ...overrides
})

// Test setup helpers
export const setupTestEnvironment = () => {
  // Set up common test environment variables
  process.env.NODE_ENV = 'test'
  
  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console }
  
  beforeEach(() => {
    // Suppress console output in tests unless explicitly needed
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })
  
  afterEach(() => {
    // Restore console methods
    Object.assign(console, originalConsole)
    jest.restoreAllMocks()
  })
  
  return originalConsole
}

// Skip message generators
export const getSkipMessage = (reason: string) => `Skipped: ${reason}`

export const skipMessages = {
  noSupabase: getSkipMessage('Supabase not available for testing'),
  noOAuth: (provider: string) => getSkipMessage(`${provider} OAuth not configured`),
  noRealtime: getSkipMessage('Realtime tests disabled due to known issues'),
  notImplemented: getSkipMessage('Feature not yet implemented'),
  knownIssue: (issue: string) => getSkipMessage(`Known issue: ${issue}`)
}