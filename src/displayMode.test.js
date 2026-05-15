import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isMirroredOrExternalLargeScreen,
  shouldUseLargeDisplay,
  applyLargeDisplayClass,
  setDisplayModePreference,
} from './displayMode.js'

describe('displayMode', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('is-large-display')
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects a large screen with a compact viewport (mirrored phone)', () => {
    vi.stubGlobal('screen', { width: 1920, height: 1080 })
    vi.stubGlobal('innerWidth', 390)
    vi.stubGlobal('innerHeight', 844)

    expect(isMirroredOrExternalLargeScreen()).toBe(true)
  })

  it('does not treat a normal phone screen as mirrored', () => {
    vi.stubGlobal('screen', { width: 390, height: 844 })
    vi.stubGlobal('innerWidth', 390)
    vi.stubGlobal('innerHeight', 844)

    expect(isMirroredOrExternalLargeScreen()).toBe(false)
  })

  it('uses large display when viewport media matches', () => {
    vi.stubGlobal('screen', { width: 1920, height: 1080 })
    vi.stubGlobal('innerWidth', 1920)
    vi.stubGlobal('innerHeight', 1080)
    vi.mocked(matchMedia).mockImplementation((query) => ({
      matches: query.includes('1600px'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    expect(shouldUseLargeDisplay()).toBe(true)
  })

  it('respects a forced normal preference', () => {
    vi.stubGlobal('screen', { width: 1920, height: 1080 })
    vi.stubGlobal('innerWidth', 390)
    vi.stubGlobal('innerHeight', 844)
    localStorage.setItem('displayMode', 'normal')

    expect(shouldUseLargeDisplay()).toBe(false)
  })

  it('applies is-large-display on the document element', () => {
    vi.stubGlobal('screen', { width: 1920, height: 1080 })
    vi.stubGlobal('innerWidth', 390)
    vi.stubGlobal('innerHeight', 844)

    expect(applyLargeDisplayClass()).toBe(true)
    expect(document.documentElement.classList.contains('is-large-display')).toBe(true)

    setDisplayModePreference('normal')
    expect(document.documentElement.classList.contains('is-large-display')).toBe(false)
  })

  it('sets screen-based --display-vmin when mirrored to a large display', () => {
    vi.stubGlobal('screen', { width: 1920, height: 1080 })
    vi.stubGlobal('innerWidth', 390)
    vi.stubGlobal('innerHeight', 844)

    applyLargeDisplayClass()
    expect(document.documentElement.style.getPropertyValue('--display-vmin')).toBe('10.8px')
  })
})
