import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  readVerseFontScaleIndex,
  setVerseFontScaleIndex,
  bumpVerseFontScale,
  DEFAULT_VERSE_FONT_SCALE_INDEX,
  VERSE_FONT_SCALE_STEPS,
} from './verseFontSize.js'

describe('verseFontSize', () => {
  beforeEach(() => {
    const store = Object.create(null)
    vi.stubGlobal('localStorage', {
      getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
      setItem: (key, value) => {
        store[key] = String(value)
      },
      removeItem: (key) => {
        delete store[key]
      },
      clear: () => {
        for (const key of Object.keys(store)) delete store[key]
      },
    })
    document.documentElement.style.removeProperty('--verse-font-scale')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.style.removeProperty('--verse-font-scale')
  })

  it('defaults to the middle step', () => {
    expect(readVerseFontScaleIndex()).toBe(DEFAULT_VERSE_FONT_SCALE_INDEX)
    expect(VERSE_FONT_SCALE_STEPS[DEFAULT_VERSE_FONT_SCALE_INDEX].label).toBe('Default')
  })

  it('ignores invalid stored values', () => {
    localStorage.setItem('verseFontScale', '99')
    expect(readVerseFontScaleIndex()).toBe(DEFAULT_VERSE_FONT_SCALE_INDEX)
  })

  it('includes XL and XXL steps with larger scales than Larger', () => {
    const larger = VERSE_FONT_SCALE_STEPS.find((s) => s.label === 'Larger')
    const xl = VERSE_FONT_SCALE_STEPS.find((s) => s.label === 'XL')
    const xxl = VERSE_FONT_SCALE_STEPS.find((s) => s.label === 'XXL')
    expect(larger?.scale).toBe(1.3)
    expect(xl?.scale).toBe(1.5)
    expect(xxl?.scale).toBe(1.7)
    expect(xxl?.scale ?? 0).toBeGreaterThan(xl?.scale ?? 0)
    expect(xl?.scale ?? 0).toBeGreaterThan(larger?.scale ?? 0)
  })

  it('applies --verse-font-scale on the document element', () => {
    setVerseFontScaleIndex(4)
    expect(document.documentElement.style.getPropertyValue('--verse-font-scale')).toBe('1.3')
    setVerseFontScaleIndex(VERSE_FONT_SCALE_STEPS.length - 1)
    expect(document.documentElement.style.getPropertyValue('--verse-font-scale')).toBe('1.7')
  })

  it('clamps bumps at the ends of the range', () => {
    setVerseFontScaleIndex(0)
    expect(bumpVerseFontScale(-1)).toBe(0)
    expect(bumpVerseFontScale(1)).toBe(1)

    setVerseFontScaleIndex(VERSE_FONT_SCALE_STEPS.length - 1)
    expect(bumpVerseFontScale(1)).toBe(VERSE_FONT_SCALE_STEPS.length - 1)
    expect(bumpVerseFontScale(-1)).toBe(VERSE_FONT_SCALE_STEPS.length - 2)
  })
})
