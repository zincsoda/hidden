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

  it('also applies TV typography when html has is-large-display (mirrored mobile)', () => {
    expect(appCss).toMatch(/html\.is-large-display\s+\.verse-text\s*\{/)
  })

  it('scales verse text with vmin so type tracks both width and height of the screen', () => {
    const tvBlock = appCss.slice(appCss.indexOf('@media (min-width: 1600px)'))
    const verseTextRule = tvBlock.slice(tvBlock.indexOf('.verse-text {'))
    expect(verseTextRule).toMatch(/font-size:\s*clamp\([^)]*vmin/s)
  })

  it('uses screen-based --display-vmin for mirrored large-display class rules', () => {
    const mirroredBlock = appCss.slice(appCss.indexOf('html.is-large-display .verse-text'))
    expect(mirroredBlock).toMatch(/var\(--display-vmin,\s*1vmin\)/)
  })

  it('scales verse text with --verse-font-scale for user-adjustable size', () => {
    expect(appCss).toMatch(/\.verse-text\s*\{[\s\S]*var\(--verse-font-scale,\s*1\)/)
    expect(appCss).toMatch(/\.verse-reference\s*\{[\s\S]*var\(--verse-font-scale,\s*1\)/)
  })

  it('uses Source Sans 3 for verse text (readable sans at signage distance)', () => {
    const indexCss = readFileSync(join(__dirname, 'index.css'), 'utf8')
    expect(indexCss).toMatch(/--verse-font:[\s\S]*Source Sans 3/)
    expect(appCss).toMatch(/\.verse-text\s*\{[\s\S]*font-family:\s*var\(--verse-font\)/)
  })

  it('uses semibold weight on large displays for clearer text at a distance', () => {
    const tvBlock = appCss.slice(appCss.indexOf('@media (min-width: 1600px)'))
    const verseTextRule = tvBlock.slice(tvBlock.indexOf('.verse-text {'))
    expect(verseTextRule).toMatch(/font-weight:\s*600/)
  })

  it('widens the verse column on large displays', () => {
    const tvBlock = appCss.slice(appCss.indexOf('@media (min-width: 1600px)'))
    const cardRule = tvBlock.slice(tvBlock.indexOf('.verse-card {'))
    expect(cardRule).toMatch(/max-width:\s*min\(\s*95vw/)
  })
})
