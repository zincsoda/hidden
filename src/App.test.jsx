import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, cleanup, fireEvent } from '@testing-library/react'
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

  it('toggles hidden word text; highlight only when revealed, not on the empty slot', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /hide 2/i }))

    const hiddenSlot = screen.getByLabelText('Hidden word')
    expect(hiddenSlot).toHaveClass('memory-word-slot')
    expect(hiddenSlot.querySelector('.memory-word-revealed')).toBeNull()
    expect(hiddenSlot).toHaveTextContent('Alpha')
    expect(hiddenSlot.querySelector('.memory-word-visible')).toBeNull()
    expect(hiddenSlot.firstElementChild).toHaveStyle({ visibility: 'hidden' })

    const toggle = screen.getByRole('button', { name: /show hidden words/i })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)

    expect(screen.queryByLabelText('Hidden word')).not.toBeInTheDocument()
    const blockquote = screen.getByRole('blockquote')
    const revealedWord = within(blockquote).getByText('Alpha')
    expect(revealedWord).toHaveClass('memory-word-visible', 'memory-word-revealed')
    expect(revealedWord.closest('.memory-word-slot')).toBeTruthy()
    expect(screen.getByRole('button', { name: /hide word text/i })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: /hide word text/i }))
    expect(screen.getByLabelText('Hidden word')).toBeInTheDocument()
  })

  it('keeps hidden word slot width stable when toggling reveal (same word in flow, visibility only)', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /hide 2/i }))

    const slot = screen.getByLabelText('Hidden word')
    expect(slot).toHaveTextContent('Alpha')

    await user.click(screen.getByRole('button', { name: /show hidden words/i }))
    expect(screen.queryByLabelText('Hidden word')).not.toBeInTheDocument()

    const revealed = within(screen.getByRole('blockquote')).getByText('Alpha')
    expect(revealed.closest('.memory-word-slot')).toBeTruthy()
    expect(revealed).toHaveClass('memory-word-revealed')
    expect(revealed).toHaveStyle({ visibility: 'visible' })
  })

  it('disables the reveal toggle when no words are hidden', async () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /show hidden words/i })).toBeDisabled()
  })

  it('opens an overlay from the verse area with build label and navigation; dismisses via tap on overlay or Escape', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByLabelText('Build version')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /another verse/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('blockquote'))
    expect(screen.getByRole('dialog', { name: /reading menu/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Build version')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /another verse/i })).toBeInTheDocument()

    await user.click(screen.getByLabelText('Build version'))
    expect(screen.queryByRole('dialog', { name: /reading menu/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('blockquote'))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /reading menu/i })).not.toBeInTheDocument()
  })

  it('opens the pick dialog from Choose verse in the overlay and closes the overlay', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('blockquote'))
    await user.click(screen.getByRole('button', { name: /choose verse/i }))

    expect(screen.queryByRole('heading', { name: /reading menu/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /go to verse/i })).toBeInTheDocument()
  })

  it('does not open the overlay when the event target is the memory controls strip wrapper', () => {
    const { container } = render(<App />)
    const actions = container.querySelector('.verse-actions')
    expect(actions).toBeTruthy()
    fireEvent.click(actions)
    expect(screen.queryByRole('dialog', { name: /reading menu/i })).not.toBeInTheDocument()
  })
})
