import { describe, it, expect, vi, afterEach } from 'vitest'
import { pickRandomVerse, getRandomBuiltInVerse, builtInVerses } from './verses.js'

describe('pickRandomVerse', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null for empty list', () => {
    expect(pickRandomVerse([])).toBeNull()
    expect(pickRandomVerse(null)).toBeNull()
  })

  it('returns the only row when the sheet has one verse', () => {
    const only = { reference: 'A 1:1', text: 'x' }
    expect(pickRandomVerse([only])).toBe(only)
  })

  it('when multiple rows, avoids matching current when possible', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const a = { reference: 'A 1:1', text: 'a' }
    const b = { reference: 'B 2:2', text: 'b' }
    expect(pickRandomVerse([a, b], a)).toBe(b)
  })
})

describe('getRandomBuiltInVerse', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a fresh object from the built-in list', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const v = getRandomBuiltInVerse()
    expect(v).toEqual({ ...builtInVerses[0] })
    expect(v).not.toBe(builtInVerses[0])
  })
})
