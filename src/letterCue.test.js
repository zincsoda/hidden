import { describe, it, expect } from 'vitest'
import {
  isSelectableLetter,
  buildLetterCueLine,
  toggleLetterIndex,
  getWordCharRanges,
  getFirstSelectableLetterIndex,
  isWordCueSelected,
  toggleWordCueIndex,
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

  it('finds the first selectable letter in a word range', () => {
    const text = "'Alpha"
    expect(getFirstSelectableLetterIndex(text, 0, 6)).toBe(1)
    expect(getFirstSelectableLetterIndex(text, 0, 1)).toBe(null)
  })

  it('toggles word cues via each word first letter', () => {
    const text = 'Alpha Beta'
    const alphaRange = { start: 0, end: 5 }
    const betaRange = { start: 6, end: 10 }
    const afterAlpha = toggleWordCueIndex(new Set(), text, alphaRange)
    expect(afterAlpha).toEqual(new Set([0]))
    expect(isWordCueSelected(afterAlpha, text, alphaRange)).toBe(true)
    expect(isWordCueSelected(afterAlpha, text, betaRange)).toBe(false)
    const both = toggleWordCueIndex(afterAlpha, text, betaRange)
    expect(buildLetterCueLine(text, both)).toBe('A B')
    expect(toggleWordCueIndex(both, text, alphaRange)).toEqual(new Set([6]))
  })
})
