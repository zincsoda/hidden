import { describe, it, expect, vi, afterEach } from 'vitest'
import { pickRandomFromPool } from './memoryHelpers.js'

describe('pickRandomFromPool', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty array when pool is empty', () => {
    expect(pickRandomFromPool([], 5)).toEqual([])
  })

  it('returns empty array when count is zero', () => {
    expect(pickRandomFromPool([1, 2, 3], 0)).toEqual([])
  })

  it('returns at most count items without replacement', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25)
    const out = pickRandomFromPool([10, 20, 30, 40], 2)
    expect(out).toHaveLength(2)
    expect(new Set(out).size).toBe(2)
    expect([10, 20, 30, 40]).toEqual(expect.arrayContaining(out))
  })

  it('never returns more than pool length', () => {
    expect(pickRandomFromPool(['a', 'b'], 99)).toHaveLength(2)
  })
})
