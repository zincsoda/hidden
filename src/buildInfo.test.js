import { describe, it, expect } from 'vitest'
import { formatBuildLabel } from './buildInfo.js'

describe('formatBuildLabel', () => {
  it('includes commit count and UTC deployment time when built', () => {
    const label = formatBuildLabel()
    expect(label).toMatch(/^v.+ · /)
  })
})
