import { 
  hexToArgb, 
  argbToHex, 
  extractArgb, 
  createArgb,
  argbToRgba,
  argbToHexRgb,
  isValidPaletteColor,
  getClosestPaletteColor,
  isTransparent,
  getPaletteByFamilies,
  getColorName,
  ColorUtils
} from '../color-utils'
import { COLOR_PALETTE } from '@/lib/types'

describe('ColorUtils', () => {
  describe('hexToArgb', () => {
    test('converts 6-digit hex to ARGB with full alpha', () => {
      expect(hexToArgb('#FF0000')).toBe(0xFFFF0000)
      expect(hexToArgb('#00FF00')).toBe(0xFF00FF00)
      expect(hexToArgb('#0000FF')).toBe(0xFF0000FF)
      expect(hexToArgb('#FFFFFF')).toBe(0xFFFFFFFF)
      expect(hexToArgb('#000000')).toBe(0xFF000000)
    })

    test('converts 8-digit hex to ARGB with alpha', () => {
      expect(hexToArgb('#80FF0000')).toBe(0x80FF0000)
      expect(hexToArgb('#00FF0000')).toBe(0x00FF0000)
      expect(hexToArgb('#FFFF0000')).toBe(0xFFFF0000)
    })

    test('handles hex without # prefix', () => {
      expect(hexToArgb('FF0000')).toBe(0xFFFF0000)
      expect(hexToArgb('80FF0000')).toBe(0x80FF0000)
    })

    test('throws error for invalid hex format', () => {
      expect(() => hexToArgb('#FFF')).toThrow('Invalid hex color format')
      expect(() => hexToArgb('#FFFFF')).toThrow('Invalid hex color format')
      expect(() => hexToArgb('#FFFFFFFFF')).toThrow('Invalid hex color format')
    })
  })

  describe('argbToHex', () => {
    test('converts ARGB to hex string', () => {
      expect(argbToHex(0xFFFF0000)).toBe('#FFFF0000')
      expect(argbToHex(0xFF00FF00)).toBe('#FF00FF00')
      expect(argbToHex(0xFF0000FF)).toBe('#FF0000FF')
      expect(argbToHex(0x80FF0000)).toBe('#80FF0000')
      expect(argbToHex(0x00000000)).toBe('#00000000')
    })

    test('pads with zeros correctly', () => {
      expect(argbToHex(0x000000FF)).toBe('#000000FF')
      expect(argbToHex(0x0000FF00)).toBe('#0000FF00')
      expect(argbToHex(0x00FF0000)).toBe('#00FF0000')
    })
  })

  describe('extractArgb', () => {
    test('extracts ARGB components correctly', () => {
      expect(extractArgb(0xFFFF0000)).toEqual({ a: 255, r: 255, g: 0, b: 0 })
      expect(extractArgb(0xFF00FF00)).toEqual({ a: 255, r: 0, g: 255, b: 0 })
      expect(extractArgb(0xFF0000FF)).toEqual({ a: 255, r: 0, g: 0, b: 255 })
      expect(extractArgb(0x80808080)).toEqual({ a: 128, r: 128, g: 128, b: 128 })
      expect(extractArgb(0x00000000)).toEqual({ a: 0, r: 0, g: 0, b: 0 })
    })
  })

  describe('createArgb', () => {
    test('creates ARGB from components', () => {
      expect(createArgb(255, 255, 0, 0) >>> 0).toBe(0xFFFF0000)
      expect(createArgb(255, 0, 255, 0) >>> 0).toBe(0xFF00FF00)
      expect(createArgb(255, 0, 0, 255) >>> 0).toBe(0xFF0000FF)
      expect(createArgb(128, 128, 128, 128) >>> 0).toBe(0x80808080)
      expect(createArgb(0, 0, 0, 0)).toBe(0x00000000)
    })

    test('handles component overflow correctly', () => {
      expect(createArgb(256, 256, 256, 256)).toBe(0x00000000) // Overflow wraps
      expect(createArgb(255, 255, 255, 255) >>> 0).toBe(0xFFFFFFFF)
    })
  })

  describe('argbToRgba', () => {
    test('converts ARGB to CSS rgba string', () => {
      expect(argbToRgba(0xFFFF0000)).toBe('rgba(255, 0, 0, 1)')
      expect(argbToRgba(0xFF00FF00)).toBe('rgba(0, 255, 0, 1)')
      expect(argbToRgba(0xFF0000FF)).toBe('rgba(0, 0, 255, 1)')
      expect(argbToRgba(0x80FF0000)).toBe('rgba(255, 0, 0, 0.5019607843137255)')
      expect(argbToRgba(0x00000000)).toBe('rgba(0, 0, 0, 0)')
    })
  })

  describe('argbToHexRgb', () => {
    test('converts ARGB to CSS hex string without alpha', () => {
      expect(argbToHexRgb(0xFFFF0000)).toBe('#FF0000')
      expect(argbToHexRgb(0xFF00FF00)).toBe('#00FF00')
      expect(argbToHexRgb(0xFF0000FF)).toBe('#0000FF')
      expect(argbToHexRgb(0x80FF0000)).toBe('#FF0000') // Alpha ignored
      expect(argbToHexRgb(0x00000000)).toBe('#000000')
    })
  })

  describe('isValidPaletteColor', () => {
    test('returns true for palette colors', () => {
      COLOR_PALETTE.forEach(color => {
        expect(isValidPaletteColor(color)).toBe(true)
      })
    })

    test('returns false for non-palette colors', () => {
      expect(isValidPaletteColor(0xFF123456)).toBe(false)
      expect(isValidPaletteColor(0xFF987654)).toBe(false)
      expect(isValidPaletteColor(0xFFABCDEF)).toBe(false)
    })
  })

  describe('getClosestPaletteColor', () => {
    test('returns same color if already in palette', () => {
      COLOR_PALETTE.forEach(color => {
        expect(getClosestPaletteColor(color)).toBe(color)
      })
    })

    test('finds closest color for non-palette colors', () => {
      // Test with a color close to red
      const closeToRed = 0xFFBE0040 // Very close to palette red 0xFFBE0039
      expect(getClosestPaletteColor(closeToRed)).toBe(0xFFBE0039)
      
      // Test with a color close to blue
      const closeToBlue = 0xFF3690EB // Very close to palette blue 0xFF3690EA
      expect(getClosestPaletteColor(closeToBlue)).toBe(0xFF3690EA)
    })

    test('handles edge cases', () => {
      // Pure white should map to white in palette
      expect(getClosestPaletteColor(0xFFFFFFFF)).toBe(0xFFFFFFFF)
      
      // Pure black should map to black in palette
      expect(getClosestPaletteColor(0xFF000000)).toBe(0xFF000000)
    })
  })

  describe('isTransparent', () => {
    test('returns true for transparent colors', () => {
      expect(isTransparent(0x00000000)).toBe(true)
      expect(isTransparent(0x00FF0000)).toBe(true)
      expect(isTransparent(0x00FFFFFF)).toBe(true)
    })

    test('returns false for opaque colors', () => {
      expect(isTransparent(0xFFFF0000)).toBe(false)
      expect(isTransparent(0x80FF0000)).toBe(false)
      expect(isTransparent(0x01FF0000)).toBe(false)
    })
  })

  describe('getPaletteByFamilies', () => {
    test('returns organized color families', () => {
      const families = getPaletteByFamilies()
      
      expect(families).toHaveLength(11) // 11 color families
      expect(families[0].name).toBe('Special')
      expect(families[0].colors).toEqual([COLOR_PALETTE[0]]) // Transparent
      
      expect(families[1].name).toBe('Reds')
      expect(families[1].colors).toHaveLength(2)
      
      expect(families[10].name).toBe('Grays')
      expect(families[10].colors).toHaveLength(5) // Black to White
    })

    test('includes all palette colors', () => {
      const families = getPaletteByFamilies()
      const allFamilyColors = families.flatMap(family => family.colors)
      
      expect(allFamilyColors).toHaveLength(COLOR_PALETTE.length)
      COLOR_PALETTE.forEach(color => {
        expect(allFamilyColors).toContain(color)
      })
    })
  })

  describe('getColorName', () => {
    test('returns names for palette colors', () => {
      expect(getColorName(COLOR_PALETTE[0])).toBe('Transparent')
      expect(getColorName(COLOR_PALETTE[1])).toBe('Dark Red')
      expect(getColorName(COLOR_PALETTE[2])).toBe('Red')
      expect(getColorName(COLOR_PALETTE[31])).toBe('White')
    })

    test('returns hex string for non-palette colors', () => {
      expect(getColorName(0xFF123456)).toBe('#FF123456')
      expect(getColorName(0xFF987654)).toBe('#FF987654')
    })
  })

  describe('ColorUtils class methods', () => {
    test('all static methods work correctly', () => {
      expect(ColorUtils.hexToArgb('#FF0000')).toBe(0xFFFF0000)
      expect(ColorUtils.argbToHex(0xFFFF0000)).toBe('#FFFF0000')
      expect(ColorUtils.isValidPaletteColor(COLOR_PALETTE[0])).toBe(true)
      expect(ColorUtils.isTransparent(0x00000000)).toBe(true)
    })
  })
})