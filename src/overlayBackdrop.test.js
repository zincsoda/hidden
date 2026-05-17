import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  STORAGE_KEY,
  APP_BACKGROUND_STORAGE_KEY,
  readAppBackgroundIndex,
  persistAppBackgroundIndex,
  readOverlayBackdropIndex,
  DEFAULT_APP_BACKGROUND_INDEX,
  DEFAULT_OVERLAY_BACKDROP_INDEX,
  OVERLAY_BACKDROP_OPTIONS,
  CONTROLS_OVERLAY_BACKDROP,
  overlayBackdropCssAt,
} from './overlayBackdrop.js'

describe('overlayBackdrop / app background', () => {
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
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses page green as the default export alias', () => {
    expect(CONTROLS_OVERLAY_BACKDROP).toBe('#082818')
    expect(OVERLAY_BACKDROP_OPTIONS[DEFAULT_APP_BACKGROUND_INDEX].value).toBe(CONTROLS_OVERLAY_BACKDROP)
    expect(DEFAULT_OVERLAY_BACKDROP_INDEX).toBe(DEFAULT_APP_BACKGROUND_INDEX)
  })

  it('defaults app background index when storage is missing', () => {
    expect(readAppBackgroundIndex()).toBe(DEFAULT_APP_BACKGROUND_INDEX)
    expect(readOverlayBackdropIndex()).toBe(DEFAULT_APP_BACKGROUND_INDEX)
  })

  it('ignores legacy black-only storage so the main view stays page green', () => {
    localStorage.setItem(STORAGE_KEY, '0')
    expect(readAppBackgroundIndex()).toBe(DEFAULT_APP_BACKGROUND_INDEX)
  })

  it('reads non-default legacy overlay index when app key is absent', () => {
    localStorage.setItem(STORAGE_KEY, '3')
    expect(readAppBackgroundIndex()).toBe(3)
  })

  it('prefers app storage over legacy', () => {
    localStorage.setItem(STORAGE_KEY, '3')
    localStorage.setItem(APP_BACKGROUND_STORAGE_KEY, '2')
    expect(readAppBackgroundIndex()).toBe(2)
  })

  it('returns the default index for invalid stored values', () => {
    localStorage.setItem(APP_BACKGROUND_STORAGE_KEY, 'xyz')
    expect(readAppBackgroundIndex()).toBe(DEFAULT_APP_BACKGROUND_INDEX)
    localStorage.setItem(APP_BACKGROUND_STORAGE_KEY, '-1')
    expect(readAppBackgroundIndex()).toBe(DEFAULT_APP_BACKGROUND_INDEX)
    localStorage.setItem(APP_BACKGROUND_STORAGE_KEY, '99')
    expect(readAppBackgroundIndex()).toBe(DEFAULT_APP_BACKGROUND_INDEX)
  })

  it('persists a clamped index, removes legacy key, and returns usable CSS colours', () => {
    expect(persistAppBackgroundIndex(2)).toBe(2)
    expect(localStorage.getItem(APP_BACKGROUND_STORAGE_KEY)).toBe('2')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(null)
    expect(readAppBackgroundIndex()).toBe(2)
    expect(overlayBackdropCssAt(2)).toBe(OVERLAY_BACKDROP_OPTIONS[2].value)

    expect(persistAppBackgroundIndex(100)).toBe(OVERLAY_BACKDROP_OPTIONS.length - 1)
    expect(persistAppBackgroundIndex(-40)).toBe(0)
  })
})
