import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  STORAGE_KEY,
  readOverlayBackdropIndex,
  persistOverlayBackdropIndex,
  DEFAULT_OVERLAY_BACKDROP_INDEX,
  OVERLAY_BACKDROP_OPTIONS,
  CONTROLS_OVERLAY_BACKDROP,
  overlayBackdropCssAt,
} from './overlayBackdrop.js'

describe('overlayBackdrop', () => {
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

  it('uses the opaque black palette entry as the default export alias', () => {
    expect(CONTROLS_OVERLAY_BACKDROP).toBe('rgb(0, 0, 0)')
    expect(OVERLAY_BACKDROP_OPTIONS[DEFAULT_OVERLAY_BACKDROP_INDEX].value).toBe(CONTROLS_OVERLAY_BACKDROP)
  })

  it('defaults reading menu backdrop index when storage is missing', () => {
    expect(readOverlayBackdropIndex()).toBe(DEFAULT_OVERLAY_BACKDROP_INDEX)
  })

  it('returns the default index for invalid stored values', () => {
    localStorage.setItem(STORAGE_KEY, 'xyz')
    expect(readOverlayBackdropIndex()).toBe(DEFAULT_OVERLAY_BACKDROP_INDEX)
    localStorage.setItem(STORAGE_KEY, '-1')
    expect(readOverlayBackdropIndex()).toBe(DEFAULT_OVERLAY_BACKDROP_INDEX)
    localStorage.setItem(STORAGE_KEY, '99')
    expect(readOverlayBackdropIndex()).toBe(DEFAULT_OVERLAY_BACKDROP_INDEX)
  })

  it('persists a clamped index and returns usable CSS colours', () => {
    expect(persistOverlayBackdropIndex(2)).toBe(2)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('2')
    expect(readOverlayBackdropIndex()).toBe(2)
    expect(overlayBackdropCssAt(2)).toBe(OVERLAY_BACKDROP_OPTIONS[2].value)

    expect(persistOverlayBackdropIndex(100)).toBe(OVERLAY_BACKDROP_OPTIONS.length - 1)
    expect(persistOverlayBackdropIndex(-40)).toBe(0)
  })
})
