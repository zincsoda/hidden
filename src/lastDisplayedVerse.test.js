import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  LAST_DISPLAYED_VERSE_KEY,
  FALLBACK_DISPLAY_VERSE,
  readLastDisplayedVerse,
  writeLastDisplayedVerse,
} from './lastDisplayedVerse'

describe('lastDisplayedVerse', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing stored', () => {
    expect(readLastDisplayedVerse()).toBeNull()
  })

  it('round-trips reference and text', () => {
    const v = { reference: 'John 3:16', text: 'For God so loved…' }
    writeLastDisplayedVerse(v)
    expect(readLastDisplayedVerse()).toEqual(v)
    expect(localStorage.getItem(LAST_DISPLAYED_VERSE_KEY)).toBe(JSON.stringify(v))
  })

  it('returns null for invalid JSON', () => {
    localStorage.setItem(LAST_DISPLAYED_VERSE_KEY, 'not-json')
    expect(readLastDisplayedVerse()).toBeNull()
  })

  it('exports fallback verse snapshot', () => {
    expect(FALLBACK_DISPLAY_VERSE.reference).toBe('Psalm 119:11')
    expect(FALLBACK_DISPLAY_VERSE.text).toContain('heart')
  })
})
