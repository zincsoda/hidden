import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

/** Page chrome and PWA accents use the same dark blue as the viewport background */
const PAGE_BACKGROUND = '#0d1b2a'

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
})
