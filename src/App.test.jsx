import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'
import * as verses from './verses'
import { pickRandomFromPool } from './memoryHelpers'

vi.mock('./memoryHelpers', () => ({
  pickRandomFromPool: vi.fn(() => [0]),
}))

vi.mock('./verses', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getRandomVerse: vi.fn(() => ({
      reference: 'Test 1:1',
      text: 'Alpha Beta Gamma',
    })),
  }
})

describe('App', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(pickRandomFromPool).mockReturnValue([0])
    vi.mocked(verses.getRandomVerse).mockReturnValue({
      reference: 'Test 1:1',
      text: 'Alpha Beta Gamma',
    })
  })

  it('toggles hidden word text while keeping memory styling on the slot', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /hide 2/i }))

    const hiddenSlot = screen.getByLabelText('Hidden word')
    expect(hiddenSlot).toHaveClass('memory-hidden-word', 'memory-blank')
    expect(hiddenSlot.textContent?.trim() ?? '').toBe('')

    const toggle = screen.getByRole('button', { name: /show hidden words/i })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)

    expect(screen.queryByLabelText('Hidden word')).not.toBeInTheDocument()
    const blockquote = screen.getByRole('blockquote')
    expect(within(blockquote).getByText('Alpha')).toHaveClass('memory-hidden-word', 'memory-word-visible')
    expect(screen.getByRole('button', { name: /hide word text/i })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: /hide word text/i }))
    expect(screen.getByLabelText('Hidden word')).toBeInTheDocument()
  })

  it('disables the reveal toggle when no words are hidden', async () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /show hidden words/i })).toBeDisabled()
  })
})
