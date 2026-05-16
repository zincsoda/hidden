import { describe, it, expect, vi } from 'vitest'
import { formatBuildLabel } from './buildInfo.js'

describe('formatBuildLabel', () => {
  it('includes commit count and deployment time when built', () => {
    const label = formatBuildLabel()
    expect(label).toMatch(/^v.+ · .+/)
  })

  it('formats deployment time in the runtime local time zone', () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat')
    try {
      formatBuildLabel()
      expect(spy).toHaveBeenCalled()
      const [, options] = spy.mock.calls[0]
      expect(options.timeZone).toBeUndefined()
      expect(options.timeZoneName).toBe('short')
    } finally {
      spy.mockRestore()
    }
  })
})
