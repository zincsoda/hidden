import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appCss = readFileSync(join(__dirname, 'App.css'), 'utf8')

describe('display typography for large / TV viewports', () => {
  it('targets wide, tall viewports where TV-style reading distance applies', () => {
    expect(appCss).toMatch(/@media\s*\(\s*min-width:\s*1600px\s*\)\s*and\s*\(\s*min-height:\s*800px\s*\)/)
  })

  it('scales verse text with vmin so type tracks both width and height of the screen', () => {
    const tvBlock = appCss.slice(appCss.indexOf('@media (min-width: 1600px)'))
    const verseTextRule = tvBlock.slice(tvBlock.indexOf('.verse-text {'))
    expect(verseTextRule).toMatch(/font-size:\s*clamp\([^)]*vmin/s)
  })

  it('uses a sans UI stack on large displays for clearer text at a distance', () => {
    const tvBlock = appCss.slice(appCss.indexOf('@media (min-width: 1600px)'))
    const verseTextRule = tvBlock.slice(tvBlock.indexOf('.verse-text {'))
    expect(verseTextRule).toContain('system-ui')
  })

  it('widens the verse column on large displays', () => {
    const tvBlock = appCss.slice(appCss.indexOf('@media (min-width: 1600px)'))
    const cardRule = tvBlock.slice(tvBlock.indexOf('.verse-card {'))
    expect(cardRule).toMatch(/max-width:\s*min\(\s*95vw/)
  })
})
