import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

/** Page chrome and PWA accents use the same dark green as the viewport background */
const PAGE_BACKGROUND = '#082818'

const PREVIOUS_PAGE_BACKGROUND = '#050d18'

/** True when the #rrggbb colour is visibly green (green channel dominates R and B). */
function isGreenDominant(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return g > r && g > b
}

describe('page background (dark green)', () => {
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

  it('uses a green dominant base tone (not blue-grey)', () => {
    expect(isGreenDominant(PAGE_BACKGROUND)).toBe(true)
    expect(isGreenDominant(PREVIOUS_PAGE_BACKGROUND)).toBe(false)
  })

  it('uses the same base colour at the end of the app icon gradient', () => {
    const iconSvg = readFileSync(join(PROJECT_ROOT, 'public/icon.svg'), 'utf8')
    expect(iconSvg).toContain(`stop-color="${PAGE_BACKGROUND}"`)
  })
})
