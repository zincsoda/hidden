import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const trackEvent = vi.fn()

vi.mock('./analytics.js', () => ({
  trackEvent: (...args) => trackEvent(...args),
}))

describe('pwaInstallTracking', () => {
  const matchMediaMock = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    sessionStorage.clear()
    trackEvent.mockClear()
    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: matchMediaMock,
    })
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      writable: true,
      value: false,
    })
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('isStandaloneDisplayMode is false in normal browser tab', async () => {
    const { isStandaloneDisplayMode } = await import('./pwaInstallTracking.js')
    expect(isStandaloneDisplayMode()).toBe(false)
  })

  it('isStandaloneDisplayMode is true on iOS standalone', async () => {
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: true,
    })
    const { isStandaloneDisplayMode } = await import('./pwaInstallTracking.js')
    expect(isStandaloneDisplayMode()).toBe(true)
  })

  it('tracks pwa_install on appinstalled', async () => {
    const { initPwaInstallTracking } = await import('./pwaInstallTracking.js')
    initPwaInstallTracking()
    window.dispatchEvent(new Event('appinstalled'))
    expect(trackEvent).toHaveBeenCalledWith('pwa_install', { method: 'appinstalled' })
  })

  it('tracks pwa_standalone_session once per session in standalone mode', async () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const { initPwaInstallTracking } = await import('./pwaInstallTracking.js')
    initPwaInstallTracking()
    initPwaInstallTracking()
    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith('pwa_standalone_session')
  })
})
