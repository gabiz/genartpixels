/**
 * Core TypeScript types and interfaces for Gen Art Pixels
 * Based on the design document specifications
 */

import { Database } from '@/lib/supabase/database.types'

// Database row types
export type User = Database['public']['Tables']['users']['Row']
export type Frame = Database['public']['Tables']['frames']['Row']
export type Pixel = Database['public']['Tables']['pixels']['Row']
export type FramePermission = Database['public']['Tables']['frame_permissions']['Row']
export type FrameStats = Database['public']['Tables']['frame_stats']['Row']
export type FrameLike = Database['public']['Tables']['frame_likes']['Row']
export type FrameSnapshot = Database['public']['Tables']['frame_snapshots']['Row']

// Insert types for creating new records
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type FrameInsert = Database['public']['Tables']['frames']['Insert']
export type PixelInsert = Database['public']['Tables']['pixels']['Insert']
export type FramePermissionInsert = Database['public']['Tables']['frame_permissions']['Insert']
export type FrameStatsInsert = Database['public']['Tables']['frame_stats']['Insert']
export type FrameLikeInsert = Database['public']['Tables']['frame_likes']['Insert']
export type FrameSnapshotInsert = Database['public']['Tables']['frame_snapshots']['Insert']

// Update types for modifying existing records
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type FrameUpdate = Database['public']['Tables']['frames']['Update']
export type PixelUpdate = Database['public']['Tables']['pixels']['Update']
export type FramePermissionUpdate = Database['public']['Tables']['frame_permissions']['Update']
export type FrameStatsUpdate = Database['public']['Tables']['frame_stats']['Update']
export type FrameLikeUpdate = Database['public']['Tables']['frame_likes']['Update']
export type FrameSnapshotUpdate = Database['public']['Tables']['frame_snapshots']['Update']

// Permission types
export type FramePermissionType = 'open' | 'approval-required' | 'owner-only'
export type UserPermissionType = 'contributor' | 'blocked' | 'pending'

// Frame size presets
export interface FrameSize {
  name: string
  width: number
  height: number
  description: string
}

export const FRAME_SIZES: Record<string, FrameSize> = {
  QUICK_LANDSCAPE: {
    name: 'Quick Landscape',
    width: 128,
    height: 72,
    description: '16:9 - Banners, memes'
  },
  QUICK_PORTRAIT: {
    name: 'Quick Portrait',
    width: 72,
    height: 128,
    description: '9:16 - Mobile stories, campaigns'
  },
  CORE_FRAME: {
    name: 'Core Frame',
    width: 128,
    height: 128,
    description: '1:1 - Default, profile images, badges'
  },
  EPIC_FRAME: {
    name: 'Epic Frame',
    width: 512,
    height: 288,
    description: '16:9 - Community showcases, viral content'
  }
} as const

// Color palette (32 colors in ARGB format)
export const COLOR_PALETTE: readonly number[] = [
  0x00000000, // Transparent
  0xFF6D001A, // Dark Red
  0xFFBE0039, // Red
  0xFFFF4500, // Orange
  0xFFFFA800, // Yellow-Orange
  0xFFFFD635, // Yellow
  0xFF00A368, // Dark Green
  0xFF00CC78, // Green
  0xFF7EED56, // Light Green
  0xFF00756F, // Dark Teal
  0xFF009EAA, // Teal
  0xFF00CCC0, // Light Teal
  0xFF2450A4, // Dark Blue
  0xFF3690EA, // Blue
  0xFF51E9F4, // Light Blue
  0xFF493AC1, // Dark Indigo
  0xFF6A5CFF, // Indigo
  0xFF94B3FF, // Light Indigo
  0xFF811E9F, // Dark Purple
  0xFFB44AC0, // Purple
  0xFFE4ABFF, // Light Purple
  0xFFDE107F, // Dark Pink
  0xFFFF3881, // Pink
  0xFFFF99AA, // Light Pink
  0xFF6D482F, // Brown
  0xFF9C6926, // Tan
  0xFFFFB470, // Light Tan
  0xFF000000, // Black
  0xFF515252, // Dark Gray
  0xFF898D90, // Gray
  0xFFD4D7D9, // Light Gray
  0xFFFFFFFF  // White
] as const

// Pixel placement interface
export interface PixelPlacement {
  frameId: string
  x: number
  y: number
  color: number // ARGB format
  userHandle: string
}

// Frame with extended data
export interface FrameWithStats extends Frame {
  stats: FrameStats
  userPermission?: FramePermission | null
}

// Real-time event types
export type FrameEvent = 
  | { type: 'pixel'; data: Pixel }
  | { type: 'freeze'; frameId: string; isFrozen: boolean }
  | { type: 'updateTitle'; frameId: string; title: string }
  | { type: 'updatePermissions'; frameId: string; permissions: FramePermissionType }
  | { type: 'delete'; frameId: string }

// API response types
export interface APIResponse<T> {
  data: T
  success: true
}

export interface APIError {
  error: string
  code: string
  details?: unknown
  success: false
}

// Frame API types
export interface FrameListResponse {
  frames: FrameWithStats[]
  total: number
  page: number
  limit: number
}

export interface CreateFrameRequest {
  handle: string
  title: string
  description: string
  keywords: string[]
  width: number
  height: number
  permissions: FramePermissionType
}

export interface FrameResponse {
  frame: FrameWithStats
  snapshotData: Uint8Array // Compressed pixel data
  recentPixels: Pixel[] // Pixels placed since last snapshot
  userPermission: FramePermission | null // Only current user's permission
}

// Pixel API types
export interface PlacePixelRequest {
  frameId: string
  x: number
  y: number
  color: number // ARGB format
}

export interface PlacePixelResponse {
  success: boolean
  pixel?: Pixel
  quotaRemaining: number
  error?: string
}

// Canvas renderer interface
export interface CanvasRenderer {
  initialize(canvas: HTMLCanvasElement, frame: Frame): void
  loadFromSnapshot(snapshotData: Uint8Array): void
  applyRecentPixels(pixels: Pixel[]): void
  renderPixels(pixels: Pixel[]): void
  setZoom(level: number): void
  setPan(x: number, y: number): void
  showGrid(visible: boolean): void
  getPixelAtCoordinate(x: number, y: number): {x: number, y: number} | null
  fitToFrame(): void
}

// Authentication provider interface
export interface AuthProvider {
  signIn(provider: 'google' | 'github' | 'facebook'): Promise<void>
  signOut(): Promise<void>
  getCurrentUser(): User | null
  createHandle(handle: string): Promise<boolean>
}

// Real-time manager interface
export interface RealtimeManager {
  subscribeToFrame(frameId: string, callback: (event: FrameEvent) => void): void
  unsubscribeFromFrame(frameId: string): void
  broadcastFrameEvent(event: FrameEvent): void
  handleConnectionLoss(): void
  reconnect(): void
}

// Snapshot manager interface
export interface SnapshotManager {
  createSnapshot(frameId: string): Promise<FrameSnapshot>
  getLatestSnapshot(frameId: string): Promise<FrameSnapshot | null>
  compressPixelData(pixels: Pixel[]): Uint8Array
  decompressPixelData(data: Uint8Array): Pixel[]
}

// Error types
export class DatabaseError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class QuotaExceededError extends Error {
  constructor(public remainingTime: number) {
    super('Pixel quota exceeded')
    this.name = 'QuotaExceededError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Standard error codes
export const ERROR_CODES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_HANDLE: 'INVALID_HANDLE',
  FRAME_NOT_FOUND: 'FRAME_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INVALID_COLOR: 'INVALID_COLOR',
  FRAME_FROZEN: 'FRAME_FROZEN',
  USER_BLOCKED: 'USER_BLOCKED'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// Validation constraints
export const VALIDATION_CONSTRAINTS = {
  HANDLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/
  },
  FRAME_HANDLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9_-]+$/
  },
  FRAME_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255
  },
  FRAME_DESCRIPTION: {
    MAX_LENGTH: 1000
  },
  KEYWORDS: {
    MAX_COUNT: 10,
    MAX_LENGTH: 50
  },
  PIXELS: {
    MAX_PER_HOUR: 100,
    REFILL_INTERVAL_MS: 3600000 // 1 hour
  }
} as const