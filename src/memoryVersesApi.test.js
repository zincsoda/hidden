import { describe, it, expect } from 'vitest'
import {
  parseSheetDate,
  getMostRecentMemoryVerse,
  shouldUpdateToLatestMemoryVerse,
} from './memoryVersesApi.js'

describe('parseSheetDate', () => {
  it('parses DD/MM/YY as UK date', () => {
    expect(parseSheetDate('16/05/26')).toBe(Date.UTC(2026, 4, 16))
  })

  it('parses DD/MM/YYYY', () => {
    expect(parseSheetDate('1/12/2025')).toBe(Date.UTC(2025, 11, 1))
  })

  it('returns NaN for non-matching strings', () => {
    expect(parseSheetDate('')).toBeNaN()
    expect(parseSheetDate('2026-05-16')).toBeNaN()
  })
})

describe('getMostRecentMemoryVerse', () => {
  it('returns null for empty list', () => {
    expect(getMostRecentMemoryVerse([])).toBeNull()
    expect(getMostRecentMemoryVerse(null)).toBeNull()
  })

  it('picks highest parsed date', () => {
    const list = [
      { reference: 'Old', text: 'a', date: '1/1/25' },
      { reference: 'New', text: 'b', date: '16/05/26' },
      { reference: 'Mid', text: 'c', date: '15/06/25' },
    ]
    expect(getMostRecentMemoryVerse(list)).toEqual({
      reference: 'New',
      text: 'b',
      date: '16/05/26',
    })
  })

  it('when no dates parse, uses last row', () => {
    const list = [
      { reference: 'First', text: 'a' },
      { reference: 'Last', text: 'b' },
    ]
    expect(getMostRecentMemoryVerse(list)).toEqual({
      reference: 'Last',
      text: 'b',
    })
  })

  it('returns a plain copy', () => {
    const row = { reference: 'A', text: 't', date: '1/1/26' }
    const out = getMostRecentMemoryVerse([row])
    expect(out).toEqual(row)
    expect(out).not.toBe(row)
  })
})

describe('shouldUpdateToLatestMemoryVerse', () => {
  it('is false when API verse is missing', () => {
    expect(
      shouldUpdateToLatestMemoryVerse({ reference: 'A', text: 'a', date: '1/1/25' }, null),
    ).toBe(false)
  })

  it('is true when API date is strictly newer', () => {
    expect(
      shouldUpdateToLatestMemoryVerse(
        { reference: 'Old', text: 'o', date: '1/1/25' },
        { reference: 'New', text: 'n', date: '16/05/26' },
      ),
    ).toBe(true)
  })

  it('is false when dates are equal', () => {
    expect(
      shouldUpdateToLatestMemoryVerse(
        { reference: 'A', text: 'a', date: '1/1/26' },
        { reference: 'B', text: 'b', date: '1/1/26' },
      ),
    ).toBe(false)
  })

  it('is false when displayed verse has no parseable date', () => {
    expect(
      shouldUpdateToLatestMemoryVerse(
        { reference: 'A', text: 'built-in' },
        { reference: 'B', text: 'sheet', date: '16/05/26' },
      ),
    ).toBe(false)
  })

  it('is false when API verse has no parseable date', () => {
    expect(
      shouldUpdateToLatestMemoryVerse(
        { reference: 'A', text: 'a', date: '1/1/26' },
        { reference: 'B', text: 'b' },
      ),
    ).toBe(false)
  })
})
