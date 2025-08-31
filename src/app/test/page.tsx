'use client'

import { COLOR_PALETTE, FRAME_SIZES } from '@/lib/types'
import { ColorUtils, getPaletteByFamilies } from '@/lib/utils/color-utils'
import { validateHandle, validateColor } from '@/lib/validation'

export default function TestPage() {
  const colorFamilies = getPaletteByFamilies()

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Gen Art Pixels - Foundation Test</h1>
        
        {/* Color Palette Test */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Color Palette ({COLOR_PALETTE.length} colors)</h2>
          <div className="space-y-4">
            {colorFamilies.map((family) => (
              <div key={family.name}>
                <h3 className="text-lg font-medium mb-2">{family.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {family.colors.map((color) => (
                    <div
                      key={color}
                      className="w-12 h-12 border border-gray-300 rounded flex items-center justify-center text-xs"
                      style={{ backgroundColor: ColorUtils.argbToRgba(color) }}
                      title={`${ColorUtils.getColorName(color)} - ${ColorUtils.argbToHex(color)}`}
                    >
                      {ColorUtils.isTransparent(color) && (
                        <span className="text-gray-500">T</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Frame Sizes Test */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Frame Sizes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(FRAME_SIZES).map(([key, size]) => (
              <div key={key} className="border border-gray-300 rounded p-4">
                <h3 className="font-medium">{size.name}</h3>
                <p className="text-sm text-gray-600">{size.width} × {size.height}</p>
                <p className="text-sm text-gray-500">{size.description}</p>
                <div 
                  className="mt-2 border border-gray-400 bg-gray-100"
                  style={{ 
                    width: Math.min(size.width / 4, 100), 
                    height: Math.min(size.height / 4, 100) 
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Validation Test */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Validation Tests</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>validateHandle(&quot;user123&quot;): {validateHandle('user123').toString()}</div>
            <div>validateHandle(&quot;ab&quot;): {validateHandle('ab').toString()}</div>
            <div>validateColor({COLOR_PALETTE[1]}): {validateColor(COLOR_PALETTE[1]).toString()}</div>
            <div>validateColor(0xFF123456): {validateColor(0xFF123456).toString()}</div>
          </div>
        </section>

        {/* Color Conversion Test */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Color Conversion Tests</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>hexToArgb(&quot;#FF0000&quot;): {ColorUtils.hexToArgb('#FF0000').toString(16)}</div>
            <div>argbToHex(0xFFFF0000): {ColorUtils.argbToHex(0xFFFF0000)}</div>
            <div>argbToRgba(0x80FF0000): {ColorUtils.argbToRgba(0x80FF0000)}</div>
            <div>getClosestPaletteColor(0xFFBE0040): {ColorUtils.argbToHex(ColorUtils.getClosestPaletteColor(0xFFBE0040))}</div>
          </div>
        </section>
      </div>
    </div>
  )
}