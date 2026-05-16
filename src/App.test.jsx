import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App, { CONTROLS_OVERLAY_BACKDROP } from './App.jsx'
import { fetchMemoryVerses } from './memoryVersesApi'
import { LAST_DISPLAYED_VERSE_KEY } from './lastDisplayedVerse'
import { pickRandomFromPool } from './memoryHelpers'
import { isIosDevice } from './iosDevice.js'

vi.mock('./memoryHelpers', () => ({
  pickRandomFromPool: vi.fn(() => [0]),
}))

vi.mock('./iosDevice', () => ({
  isIosDevice: vi.fn(() => false),
}))

vi.mock('./memoryVersesApi', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    fetchMemoryVerses: vi.fn(),
  }
})

vi.mock('./verses', () => ({
  getRandomBuiltInVerse: vi.fn(() => ({
    reference: 'Test 1:1',
    text: 'Alpha Beta Gamma',
  })),
}))

describe('App', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      LAST_DISPLAYED_VERSE_KEY,
      JSON.stringify({ reference: 'Test 1:1', text: 'Alpha Beta Gamma' }),
    )
    vi.mocked(pickRandomFromPool).mockReturnValue([0])
    vi.mocked(fetchMemoryVerses).mockResolvedValue([
      { reference: 'Test 1:1', text: 'Alpha Beta Gamma' },
    ])
    vi.mocked(isIosDevice).mockReturnValue(false)
  })

  async function renderAppReady() {
    render(<App />)
    await waitFor(() => expect(screen.getByRole('blockquote')).toBeInTheDocument())
  }

  it('shows iOS add-to-home instructions above the dedication when enabled', async () => {
    vi.mocked(isIosDevice).mockReturnValue(true)
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    expect(screen.getByRole('button', { name: /^add to home screen$/i })).toBeInTheDocument()

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^add to home screen$/i }))
    const list = screen.getByRole('list')
    expect(list).toHaveAttribute('id', 'ios-install-instructions')
    expect(list).toHaveTextContent(/share button/i)
    expect(list).toHaveTextContent(/add to home screen/i)

    await user.click(screen.getByRole('button', { name: /^add to home screen$/i }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('hides iOS add-to-home control on non-iOS devices', async () => {
    vi.mocked(isIosDevice).mockReturnValue(false)
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    expect(screen.queryByRole('button', { name: /^add to home screen$/i })).not.toBeInTheDocument()
  })

  it('clears iOS install instructions when the reading menu closes', async () => {
    vi.mocked(isIosDevice).mockReturnValue(true)
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    await user.click(screen.getByRole('button', { name: /^add to home screen$/i }))
    expect(screen.getByRole('list')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /hide reading menu/i }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    await user.click(screen.getByRole('blockquote'))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  /** Turn on verse-card memory buttons (crowd mode), then close the reading menu. */
  async function enableCrowdModeFromMenu(user) {
    await user.click(screen.getByRole('blockquote'))
    const crowdSwitch = screen.getByRole('switch', { name: /^crowd mode$/i })
    if (crowdSwitch.getAttribute('aria-checked') !== 'true') {
      await user.click(crowdSwitch)
    }
    await user.click(screen.getByRole('button', { name: /hide reading menu/i }))
  }

  it('toggles hidden word text; highlight only when revealed, not on the empty slot', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await enableCrowdModeFromMenu(user)

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
    await renderAppReady()

    await enableCrowdModeFromMenu(user)

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
    const user = userEvent.setup()
    await renderAppReady()

    await enableCrowdModeFromMenu(user)

    expect(screen.getByRole('button', { name: /show hidden words/i })).toBeDisabled()
  })

  it('toggles the reading menu from a subtle top-right button', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    const showBtn = screen.getByRole('button', { name: /show reading menu/i })
    expect(showBtn).toHaveClass('controls-overlay-toggle')
    expect(showBtn).toHaveAttribute('aria-expanded', 'false')

    await user.click(showBtn)

    expect(screen.getByRole('dialog', { name: /reading menu/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hide reading menu/i })).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: /hide reading menu/i }))
    expect(screen.queryByRole('dialog', { name: /reading menu/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show reading menu/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens an overlay from the verse area with build label and navigation; dismisses via tap on overlay or Escape', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    expect(screen.queryByLabelText('Build version')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /inspire me/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('blockquote'))
    const dialog = screen.getByRole('dialog', { name: /reading menu/i })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByLabelText('Build version')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /inspire me/i })).toBeInTheDocument()

    await user.click(screen.getByLabelText('Build version'))
    expect(screen.queryByRole('dialog', { name: /reading menu/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('blockquote'))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /reading menu/i })).not.toBeInTheDocument()
  })

  it('orders reading menu actions: Memory Verses, then Inspire me, then Crowd mode', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    const dialog = screen.getByRole('dialog', { name: /reading menu/i })
    const actions = dialog.querySelector('.controls-overlay-actions')
    expect(actions).toBeTruthy()
    expect(actions.children.length).toBe(3)

    expect(actions.children[0]).toHaveTextContent(/memory verses/i)
    expect(actions.children[1]).toHaveTextContent(/inspire me/i)
    expect(actions.children[2]).toHaveClass('controls-overlay-crowd-row')
  })

  it('uses a fully opaque reading menu backdrop and anchors the build label to the bottom of the overlay', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    const dialog = screen.getByRole('dialog', { name: /reading menu/i })

    expect(dialog).toHaveStyle({ backgroundColor: CONTROLS_OVERLAY_BACKDROP })

    const build = dialog.querySelector('.controls-overlay-build')
    expect(build).toBeTruthy()
    expect(dialog.lastElementChild).toBe(build)

    const body = dialog.querySelector('.controls-overlay-body')
    expect(body).toBeTruthy()
    expect(dialog.firstElementChild).toBe(body)
  })

  it('exports a fully opaque controls overlay backdrop color', () => {
    expect(CONTROLS_OVERLAY_BACKDROP).toBe('rgb(0, 0, 0)')
  })

  it('opens the pick dialog from Memory Verses in the overlay and closes the overlay', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    await user.click(screen.getByRole('button', { name: /^memory verses$/i }))

    expect(screen.queryByRole('heading', { name: /reading menu/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^memory verses$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^test 1:1$/i })).toBeInTheDocument()
  })

  it('does not open the overlay when the event target is the memory controls strip wrapper', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await waitFor(() => expect(screen.getByRole('blockquote')).toBeInTheDocument())
    await enableCrowdModeFromMenu(user)
    const actions = container.querySelector('.verse-actions')
    expect(actions).toBeTruthy()
    fireEvent.click(actions)
    expect(screen.queryByRole('dialog', { name: /reading menu/i })).not.toBeInTheDocument()
  })

  it('defaults crowd mode off and exposes an iOS-style switch in the reading menu', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    expect(screen.queryByRole('button', { name: /hide 2/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('blockquote'))
    const crowdSwitch = screen.getByRole('switch', { name: /^crowd mode$/i })
    expect(crowdSwitch).toHaveClass('ios-switch')
    expect(crowdSwitch).toHaveAttribute('aria-checked', 'false')
  })

  it('reading menu switch hides crowd mode controls on the verse card while keeping verses readable', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await enableCrowdModeFromMenu(user)

    expect(screen.getByRole('button', { name: /hide 2/i })).toBeInTheDocument()

    await user.click(screen.getByRole('blockquote'))
    const crowdSwitch = screen.getByRole('switch', { name: /^crowd mode$/i })
    expect(crowdSwitch).toHaveAttribute('aria-checked', 'true')

    await user.click(crowdSwitch)
    expect(screen.queryByRole('button', { name: /hide 2/i })).not.toBeInTheDocument()
    expect(screen.getByRole('blockquote')).toHaveTextContent(/Alpha Beta Gamma/)

    await user.click(screen.getByRole('button', { name: /^hide reading menu/i }))
    expect(screen.queryByRole('dialog', { name: /reading menu/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /hide 2/i })).not.toBeInTheDocument()
  })

  it('shows crowd mode again from overlay when toggled back on', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await enableCrowdModeFromMenu(user)

    await user.click(screen.getByRole('blockquote'))
    await user.click(screen.getByRole('switch', { name: /^crowd mode$/i }))
    expect(screen.getByRole('switch', { name: /^crowd mode$/i })).toHaveAttribute('aria-checked', 'false')
    await user.click(screen.getByRole('button', { name: /^hide reading menu/i }))

    expect(screen.queryByRole('button', { name: /hide 2/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('blockquote'))
    await user.click(screen.getByRole('switch', { name: /^crowd mode$/i }))
    expect(screen.getByRole('switch', { name: /^crowd mode$/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await user.click(screen.getByRole('button', { name: /^hide reading menu/i }))
    expect(screen.getByRole('button', { name: /hide 2/i })).toBeInTheDocument()
  })
})
