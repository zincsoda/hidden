import { describe, it, expect } from 'vitest'
import { isIosDevice } from './iosDevice.js'

function mockNavigator(partial) {
  return {
    userAgent: '',
    platform: '',
    maxTouchPoints: 0,
    ...partial,
  }
}

describe('isIosDevice', () => {
  it('returns false when navigator is missing', () => {
    expect(isIosDevice(undefined)).toBe(false)
  })

  it('detects iPhone from user agent', () => {
    const nav = mockNavigator({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
    })
    expect(isIosDevice(nav)).toBe(true)
  })

  it('detects iPad from user agent', () => {
    const nav = mockNavigator({
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      platform: 'iPad',
    })
    expect(isIosDevice(nav)).toBe(true)
  })

  it('detects iPadOS desktop mode (MacIntel + touch)', () => {
    const nav = mockNavigator({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    })
    expect(isIosDevice(nav)).toBe(true)
  })

  it('returns false for desktop Safari without touch', () => {
    const nav = mockNavigator({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    })
    expect(isIosDevice(nav)).toBe(false)
  })

  it('returns false for typical Android Chrome', () => {
    const nav = mockNavigator({
      userAgent:
        'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
    })
    expect(isIosDevice(nav)).toBe(false)
  })
})
