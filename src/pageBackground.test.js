import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

/** Page chrome and PWA accents use the same dark blue as the viewport background */
const PAGE_BACKGROUND = '#050d18'

const PREVIOUS_PAGE_BACKGROUND = '#0d1b2a'

/** WCAG relative luminance for #rrggbb (sRGB) */
function relativeLuminance(hex) {
  const n = parseInt(hex.slice(1), 16)
  const srgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const x = c / 255
    return x <= 0.039_28 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

describe('page background (dark blue)', () => {
  it('sets the viewport background on :root in index.css', () => {
    const indexCss = readFileSync(join(__dirname, 'index.css'), 'utf8')
    expect(indexCss).toMatch(new RegExp(`:root\\s*\\{[^}]*background-color:\\s*${PAGE_BACKGROUND}`, 's'))
  })

  it('matches the theme-color meta tag for browser chrome', () => {
    const html = readFileSync(join(PROJECT_ROOT, 'index.html'), 'utf8')
    expect(html).toContain(`content="${PAGE_BACKGROUND}"`)
    expect(html).toMatch(/<meta\s+name="theme-color"\s*/)
  })

  it('matches theme and background colours in the web app manifest', () => {
    const manifestJson = readFileSync(join(PROJECT_ROOT, 'public/manifest.json'), 'utf8')
    const manifest = JSON.parse(manifestJson)
    expect(manifest.theme_color).toBe(PAGE_BACKGROUND)
    expect(manifest.background_color).toBe(PAGE_BACKGROUND)
  })

  it('is a darker navy than the previous background colour', () => {
    expect(relativeLuminance(PAGE_BACKGROUND)).toBeLessThan(
      relativeLuminance(PREVIOUS_PAGE_BACKGROUND),
    )
  })

  it('uses the same base colour at the end of the app icon gradient', () => {
    const iconSvg = readFileSync(join(PROJECT_ROOT, 'public/icon.svg'), 'utf8')
    expect(iconSvg).toContain(`stop-color="${PAGE_BACKGROUND}"`)
  })
})
