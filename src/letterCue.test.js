import { describe, it, expect } from 'vitest'
import {
  isSelectableLetter,
  buildLetterCueLine,
  toggleLetterIndex,
  getWordCharRanges,
} from './letterCue.js'

describe('letterCue', () => {
  it('identifies selectable letters', () => {
    expect(isSelectableLetter('a')).toBe(true)
    expect(isSelectableLetter('Z')).toBe(true)
    expect(isSelectableLetter("'")).toBe(false)
    expect(isSelectableLetter(' ')).toBe(false)
  })

  it('builds cue line in verse order', () => {
    const text = 'Alpha Beta'
    expect(buildLetterCueLine(text, new Set([0, 6]))).toBe('A B')
    expect(buildLetterCueLine(text, new Set([6, 0]))).toBe('A B')
  })

  it('toggles letter indices', () => {
    expect(toggleLetterIndex(new Set([1]), 1)).toEqual(new Set())
    expect(toggleLetterIndex(new Set(), 3)).toEqual(new Set([3]))
  })

  it('maps words to character ranges in the source text', () => {
    const text = 'Alpha Beta Gamma'
    const words = ['Alpha', 'Beta', 'Gamma']
    expect(getWordCharRanges(text, words)).toEqual([
      { start: 0, end: 5 },
      { start: 6, end: 10 },
      { start: 11, end: 16 },
    ])
  })
})
