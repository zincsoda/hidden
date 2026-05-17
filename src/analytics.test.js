import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('analytics', () => {
  beforeEach(() => {
    vi.resetModules()
    document.head.querySelectorAll('script[data-ga-id]').forEach((el) => el.remove())
    delete window.dataLayer
    delete window.gtag
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.head.querySelectorAll('script[data-ga-id]').forEach((el) => el.remove())
    delete window.dataLayer
    delete window.gtag
  })

  it('is disabled without VITE_GA_MEASUREMENT_ID', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')
    const { isAnalyticsEnabled, initAnalytics, trackEvent } = await import('./analytics.js')
    expect(isAnalyticsEnabled()).toBe(false)
    initAnalytics()
    trackEvent('test')
    expect(window.gtag).toBeUndefined()
    expect(document.querySelector('script[data-ga-id]')).toBeNull()
  })

  it('loads gtag and queues config when measurement id is set', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
    const { isAnalyticsEnabled, initAnalytics, trackEvent } = await import('./analytics.js')
    expect(isAnalyticsEnabled()).toBe(true)
    initAnalytics()
    expect(window.gtag).toBeTypeOf('function')
    expect(window.dataLayer.length).toBeGreaterThan(0)
    const script = document.querySelector('script[data-ga-id="G-TEST123"]')
    expect(script).not.toBeNull()
    expect(script?.getAttribute('src')).toContain('G-TEST123')
    trackEvent('verse_pick', { reference: 'John 3:16' })
    const last = window.dataLayer[window.dataLayer.length - 1]
    expect(last[0]).toBe('event')
    expect(last[1]).toBe('verse_pick')
    expect(last[2]).toEqual({ reference: 'John 3:16' })
  })
})
