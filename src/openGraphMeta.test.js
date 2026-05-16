import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

describe('Open Graph meta (index.html)', () => {
  it('sets og:description for link previews', () => {
    const html = readFileSync(join(PROJECT_ROOT, 'index.html'), 'utf8')
    expect(html).toMatch(
      /<meta\s+property="og:description"\s+content="Memory verses for hidden treasure"\s*\/?>/,
    )
  })

  it('includes a single og:description tag', () => {
    const html = readFileSync(join(PROJECT_ROOT, 'index.html'), 'utf8')
    const matches = html.match(/property="og:description"/g)
    expect(matches?.length ?? 0).toBe(1)
  })
})
