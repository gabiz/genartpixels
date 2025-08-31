/**
 * Unit tests for pixel placement validation functions
 */

import { 
  validateCoordinates, 
  validateColor,
  validateFrameDimensions,
  validateFramePermissions 
} from '@/lib/validation'
import { COLOR_PALETTE } from '@/lib/types'

describe('Pixel Placement Validation', () => {
  describe('validateCoordinates', () => {
    test('should validate coordinates within frame bounds', () => {
      expect(validateCoordinates(0, 0, 128, 128)).toBe(true)
      expect(validateCoordinates(127, 127, 128, 128)).toBe(true)
      expect(validateCoordinates(50, 75, 128, 128)).toBe(true)
    })

    test('should reject coordinates outside frame bounds', () => {
      expect(validateCoordinates(-1, 0, 128, 128)).toBe(false)
      expect(validateCoordinates(0, -1, 128, 128)).toBe(false)
      expect(validateCoordinates(128, 0, 128, 128)).toBe(false)
      expect(validateCoordinates(0, 128, 128, 128)).toBe(false)
      expect(validateCoordinates(128, 128, 128, 128)).toBe(false)
    })

    test('should reject non-integer coordinates', () => {
      expect(validateCoordinates(1.5, 0, 128, 128)).toBe(false)
      expect(validateCoordinates(0, 1.5, 128, 128)).toBe(false)
      expect(validateCoordinates(1.1, 1.1, 128, 128)).toBe(false)
    })

    test('should handle different frame sizes', () => {
      // Quick Landscape (128x72)
      expect(validateCoordinates(127, 71, 128, 72)).toBe(true)
      expect(validateCoordinates(127, 72, 128, 72)).toBe(false)
      
      // Quick Portrait (72x128)
      expect(validateCoordinates(71, 127, 72, 128)).toBe(true)
      expect(validateCoordinates(72, 127, 72, 128)).toBe(false)
      
      // Epic Frame (512x288)
      expect(validateCoordinates(511, 287, 512, 288)).toBe(true)
      expect(validateCoordinates(512, 287, 512, 288)).toBe(false)
    })

    test('should handle edge cases', () => {
      expect(validateCoordinates(0, 0, 1, 1)).toBe(true)
      expect(validateCoordinates(0, 0, 0, 0)).toBe(false) // Invalid frame size
    })
  })

  describe('validateColor', () => {
    test('should validate palette colors', () => {
      // Test all palette colors
      COLOR_PALETTE.forEach(color => {
        expect(validateColor(color)).toBe(true)
      })
    })

    test('should reject non-palette colors', () => {
      expect(validateColor(0x12345678)).toBe(false) // Random color not in palette
      expect(validateColor(0xFFFFFFFF + 1)).toBe(false) // Out of range
      expect(validateColor(-1)).toBe(false) // Negative
    })

    test('should reject non-integer colors', () => {
      expect(validateColor(1.5)).toBe(false)
      expect(validateColor(NaN)).toBe(false)
      expect(validateColor(Infinity)).toBe(false)
    })

    test('should validate specific palette colors', () => {
      expect(validateColor(0x00000000)).toBe(true) // Transparent
      expect(validateColor(0xFFFF0000)).toBe(false) // Pure red (not in palette)
      expect(validateColor(0xFFBE0039)).toBe(true) // Red from palette
      expect(validateColor(0xFFFFFFFF)).toBe(true) // White from palette
    })
  })

  describe('validateFrameDimensions', () => {
    test('should validate predefined frame sizes', () => {
      expect(validateFrameDimensions(128, 72)).toBe(true)   // Quick Landscape
      expect(validateFrameDimensions(72, 128)).toBe(true)   // Quick Portrait
      expect(validateFrameDimensions(128, 128)).toBe(true)  // Core Frame
      expect(validateFrameDimensions(512, 288)).toBe(true)  // Epic Frame
    })

    test('should reject invalid frame sizes', () => {
      expect(validateFrameDimensions(100, 100)).toBe(false) // Not predefined
      expect(validateFrameDimensions(128, 73)).toBe(false)  // Close but wrong
      expect(validateFrameDimensions(0, 0)).toBe(false)     // Zero size
      expect(validateFrameDimensions(-128, 128)).toBe(false) // Negative
    })
  })

  describe('validateFramePermissions', () => {
    test('should validate valid permission types', () => {
      expect(validateFramePermissions('open')).toBe(true)
      expect(validateFramePermissions('approval-required')).toBe(true)
      expect(validateFramePermissions('owner-only')).toBe(true)
    })

    test('should reject invalid permission types', () => {
      expect(validateFramePermissions('public')).toBe(false)
      expect(validateFramePermissions('private')).toBe(false)
      expect(validateFramePermissions('')).toBe(false)
      expect(validateFramePermissions('OPEN')).toBe(false) // Case sensitive
    })
  })

  describe('Coordinate boundary testing', () => {
    test('should test all frame size boundaries', () => {
      const frameSizes = [
        { width: 128, height: 72 },   // Quick Landscape
        { width: 72, height: 128 },   // Quick Portrait
        { width: 128, height: 128 },  // Core Frame
        { width: 512, height: 288 }   // Epic Frame
      ]

      frameSizes.forEach(({ width, height }) => {
        // Valid coordinates
        expect(validateCoordinates(0, 0, width, height)).toBe(true)
        expect(validateCoordinates(width - 1, height - 1, width, height)).toBe(true)
        
        // Invalid coordinates
        expect(validateCoordinates(width, height - 1, width, height)).toBe(false)
        expect(validateCoordinates(width - 1, height, width, height)).toBe(false)
        expect(validateCoordinates(width, height, width, height)).toBe(false)
      })
    })
  })

  describe('Color validation edge cases', () => {
    test('should handle color value limits', () => {
      expect(validateColor(0)).toBe(true) // Transparent (0x00000000)
      expect(validateColor(0xFFFFFFFF)).toBe(true) // White from palette
      expect(validateColor(0x100000000)).toBe(false) // Too large (33 bits)
    })

    test('should validate transparent color specifically', () => {
      expect(validateColor(0x00000000)).toBe(true) // Transparent
      expect(validateColor(0x01000000)).toBe(false) // Almost transparent but not in palette
    })
  })

  describe('Input type validation', () => {
    test('should handle string inputs for coordinates', () => {
      // @ts-expect-error Testing runtime validation
      expect(validateCoordinates('0', '0', 128, 128)).toBe(false)
      // @ts-expect-error Testing runtime validation
      expect(validateCoordinates('10', 10, 128, 128)).toBe(false)
    })

    test('should handle string inputs for colors', () => {
      // @ts-expect-error Testing runtime validation
      expect(validateColor('0xFF0000')).toBe(false)
      // @ts-expect-error Testing runtime validation
      expect(validateColor('#FF0000')).toBe(false)
    })

    test('should handle null and undefined inputs', () => {
      // @ts-expect-error Testing runtime validation
      expect(validateCoordinates(null, 0, 128, 128)).toBe(false)
      // @ts-expect-error Testing runtime validation
      expect(validateCoordinates(undefined, 0, 128, 128)).toBe(false)
      // @ts-expect-error Testing runtime validation
      expect(validateColor(null)).toBe(false)
      // @ts-expect-error Testing runtime validation
      expect(validateColor(undefined)).toBe(false)
    })
  })
})