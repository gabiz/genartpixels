/**
 * Color utility functions for Gen Art Pixels
 * Handles ARGB color format conversion and validation
 */

import { COLOR_PALETTE } from '@/lib/types'

/**
 * Color utilities for ARGB format handling
 */
export class ColorUtils {
  /**
   * Convert hex string to ARGB integer
   * @param hex - Hex color string (e.g., "#FF0000" or "#80FF0000" with alpha)
   * @returns ARGB integer (e.g., 0xFFFF0000)
   */
  static hexToArgb(hex: string): number {
    // Remove # if present
    const cleanHex = hex.replace('#', '')
    
    if (cleanHex.length === 6) {
      // RGB format - add full alpha
      return parseInt(`FF${cleanHex}`, 16)
    } else if (cleanHex.length === 8) {
      // ARGB format
      return parseInt(cleanHex, 16)
    } else {
      throw new Error(`Invalid hex color format: ${hex}`)
    }
  }

  /**
   * Convert ARGB integer to hex string
   * @param argb - ARGB integer (e.g., 0xFFFF0000)
   * @returns Hex string (e.g., "#FFFF0000")
   */
  static argbToHex(argb: number): string {
    return `#${(argb >>> 0).toString(16).padStart(8, '0').toUpperCase()}`
  }

  /**
   * Extract ARGB components from integer
   * @param argb - ARGB integer
   * @returns Object with alpha, red, green, blue components (0-255)
   */
  static extractArgb(argb: number): { a: number; r: number; g: number; b: number } {
    return {
      a: (argb >>> 24) & 0xFF,
      r: (argb >>> 16) & 0xFF,
      g: (argb >>> 8) & 0xFF,
      b: argb & 0xFF
    }
  }

  /**
   * Create ARGB integer from components
   * @param a - Alpha (0-255)
   * @param r - Red (0-255)
   * @param g - Green (0-255)
   * @param b - Blue (0-255)
   * @returns ARGB integer
   */
  static createArgb(a: number, r: number, g: number, b: number): number {
    return ((a & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF)
  }

  /**
   * Convert ARGB to CSS rgba string
   * @param argb - ARGB integer
   * @returns CSS rgba string (e.g., "rgba(255, 0, 0, 1)")
   */
  static argbToRgba(argb: number): string {
    const { a, r, g, b } = ColorUtils.extractArgb(argb)
    const alpha = a / 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  /**
   * Convert ARGB to CSS hex string (without alpha)
   * @param argb - ARGB integer
   * @returns CSS hex string (e.g., "#FF0000")
   */
  static argbToHexRgb(argb: number): string {
    const { r, g, b } = ColorUtils.extractArgb(argb)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase()}`
  }

  /**
   * Check if a color is in the predefined palette
   * @param color - ARGB integer
   * @returns True if color is in palette
   */
  static isValidPaletteColor(color: number): boolean {
    return COLOR_PALETTE.includes(color)
  }

  /**
   * Get the closest palette color to a given ARGB color
   * @param color - ARGB integer
   * @returns Closest palette color ARGB integer
   */
  static getClosestPaletteColor(color: number): number {
    if (ColorUtils.isValidPaletteColor(color)) {
      return color
    }

    const { r: targetR, g: targetG, b: targetB } = ColorUtils.extractArgb(color)
    let closestColor = COLOR_PALETTE[0]
    let minDistance = Infinity

    for (const paletteColor of COLOR_PALETTE) {
      const { r, g, b } = ColorUtils.extractArgb(paletteColor)
      
      // Calculate Euclidean distance in RGB space
      const distance = Math.sqrt(
        Math.pow(r - targetR, 2) +
        Math.pow(g - targetG, 2) +
        Math.pow(b - targetB, 2)
      )

      if (distance < minDistance) {
        minDistance = distance
        closestColor = paletteColor
      }
    }

    return closestColor
  }

  /**
   * Check if a color is transparent
   * @param color - ARGB integer
   * @returns True if color is transparent (alpha = 0)
   */
  static isTransparent(color: number): boolean {
    return (color >>> 24) === 0
  }

  /**
   * Get palette colors organized by families for UI display
   * @returns Array of color families with their colors
   */
  static getPaletteByFamilies(): Array<{ name: string; colors: number[] }> {
    return [
      {
        name: 'Special',
        colors: [COLOR_PALETTE[0]] // Transparent
      },
      {
        name: 'Reds',
        colors: [COLOR_PALETTE[1], COLOR_PALETTE[2]] // Dark Red, Red
      },
      {
        name: 'Oranges & Yellows',
        colors: [COLOR_PALETTE[3], COLOR_PALETTE[4], COLOR_PALETTE[5]] // Orange, Yellow-Orange, Yellow
      },
      {
        name: 'Greens',
        colors: [COLOR_PALETTE[6], COLOR_PALETTE[7], COLOR_PALETTE[8]] // Dark Green, Green, Light Green
      },
      {
        name: 'Teals',
        colors: [COLOR_PALETTE[9], COLOR_PALETTE[10], COLOR_PALETTE[11]] // Dark Teal, Teal, Light Teal
      },
      {
        name: 'Blues',
        colors: [COLOR_PALETTE[12], COLOR_PALETTE[13], COLOR_PALETTE[14]] // Dark Blue, Blue, Light Blue
      },
      {
        name: 'Indigos',
        colors: [COLOR_PALETTE[15], COLOR_PALETTE[16], COLOR_PALETTE[17]] // Dark Indigo, Indigo, Light Indigo
      },
      {
        name: 'Purples',
        colors: [COLOR_PALETTE[18], COLOR_PALETTE[19], COLOR_PALETTE[20]] // Dark Purple, Purple, Light Purple
      },
      {
        name: 'Pinks',
        colors: [COLOR_PALETTE[21], COLOR_PALETTE[22], COLOR_PALETTE[23]] // Dark Pink, Pink, Light Pink
      },
      {
        name: 'Browns',
        colors: [COLOR_PALETTE[24], COLOR_PALETTE[25], COLOR_PALETTE[26]] // Brown, Tan, Light Tan
      },
      {
        name: 'Grays',
        colors: [COLOR_PALETTE[27], COLOR_PALETTE[28], COLOR_PALETTE[29], COLOR_PALETTE[30], COLOR_PALETTE[31]] // Black to White
      }
    ]
  }

  /**
   * Get a human-readable name for a palette color
   * @param color - ARGB integer
   * @returns Color name or hex string if not in palette
   */
  static getColorName(color: number): string {
    const colorNames: Record<number, string> = {
      [COLOR_PALETTE[0]]: 'Transparent',
      [COLOR_PALETTE[1]]: 'Dark Red',
      [COLOR_PALETTE[2]]: 'Red',
      [COLOR_PALETTE[3]]: 'Orange',
      [COLOR_PALETTE[4]]: 'Yellow-Orange',
      [COLOR_PALETTE[5]]: 'Yellow',
      [COLOR_PALETTE[6]]: 'Dark Green',
      [COLOR_PALETTE[7]]: 'Green',
      [COLOR_PALETTE[8]]: 'Light Green',
      [COLOR_PALETTE[9]]: 'Dark Teal',
      [COLOR_PALETTE[10]]: 'Teal',
      [COLOR_PALETTE[11]]: 'Light Teal',
      [COLOR_PALETTE[12]]: 'Dark Blue',
      [COLOR_PALETTE[13]]: 'Blue',
      [COLOR_PALETTE[14]]: 'Light Blue',
      [COLOR_PALETTE[15]]: 'Dark Indigo',
      [COLOR_PALETTE[16]]: 'Indigo',
      [COLOR_PALETTE[17]]: 'Light Indigo',
      [COLOR_PALETTE[18]]: 'Dark Purple',
      [COLOR_PALETTE[19]]: 'Purple',
      [COLOR_PALETTE[20]]: 'Light Purple',
      [COLOR_PALETTE[21]]: 'Dark Pink',
      [COLOR_PALETTE[22]]: 'Pink',
      [COLOR_PALETTE[23]]: 'Light Pink',
      [COLOR_PALETTE[24]]: 'Brown',
      [COLOR_PALETTE[25]]: 'Tan',
      [COLOR_PALETTE[26]]: 'Light Tan',
      [COLOR_PALETTE[27]]: 'Black',
      [COLOR_PALETTE[28]]: 'Dark Gray',
      [COLOR_PALETTE[29]]: 'Gray',
      [COLOR_PALETTE[30]]: 'Light Gray',
      [COLOR_PALETTE[31]]: 'White'
    }

    return colorNames[color] || ColorUtils.argbToHex(color)
  }
}

// Export individual functions for convenience
export const {
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
  getColorName
} = ColorUtils