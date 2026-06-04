import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App, {
  CONTROLS_OVERLAY_BACKDROP,
  FEATURE_REQUEST_EMAIL,
  FEATURE_REQUEST_SUBJECT,
  featureRequestMailtoHref,
} from './App.jsx'
import { OVERLAY_BACKDROP_OPTIONS, APP_BACKGROUND_STORAGE_KEY } from './overlayBackdrop.js'
import { fetchMemoryVerses } from './memoryVersesApi'
import { deleteAccount, DELETE_ACCOUNT_WARNING, clearLocalAppData } from './accountApi'
import { LAST_DISPLAYED_VERSE_KEY } from './lastDisplayedVerse'
import { pickRandomFromPool } from './memoryHelpers'
import { isIosDevice } from './iosDevice.js'
import { getRandomBuiltInVerse } from './verses'
import { VERSE_FONT_SCALE_STEPS, DEFAULT_VERSE_FONT_SCALE_INDEX } from './verseFontSize.js'

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

vi.mock('./accountApi', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    deleteAccount: vi.fn(),
    clearLocalAppData: vi.fn(actual.clearLocalAppData),
  }
})

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
    vi.mocked(getRandomBuiltInVerse).mockReturnValue({
      reference: 'Test 1:1',
      text: 'Alpha Beta Gamma',
    })
    vi.mocked(deleteAccount).mockResolvedValue(undefined)
  })

  async function renderAppReady() {
    render(<App />)
    await waitFor(() => expect(screen.getByRole('blockquote')).toBeInTheDocument())
  }

  it('on first open shows loading text then the newest dated memory verse from the API', async () => {
    localStorage.clear()
    vi.mocked(fetchMemoryVerses).mockResolvedValue([
      { reference: 'Older', text: 'old line', date: '1/1/25' },
      { reference: 'Newer', text: 'new line', date: '16/05/26' },
    ])
    render(<App />)
    expect(screen.getByText('Loading memory verse …')).toBeInTheDocument()
    expect(screen.queryByRole('blockquote')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Loading memory verse …')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('blockquote')).toHaveTextContent(/new line/)
    expect(screen.getByText(/— Newer$/)).toBeInTheDocument()
  })

  it('on first open when the API fails, falls back to the built-in verse', async () => {
    localStorage.clear()
    vi.mocked(fetchMemoryVerses).mockRejectedValue(new Error('network'))
    render(<App />)
    expect(screen.getByText('Loading memory verse …')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('blockquote')).toHaveTextContent(/hidden your word/i)
    })
  })

  it('shows the last verse immediately then presents a newer API verse once fetched', async () => {
    localStorage.setItem(
      LAST_DISPLAYED_VERSE_KEY,
      JSON.stringify({ reference: 'Old', text: 'cached body', date: '1/1/25' }),
    )
    let resolveShared
    const sharedPromise = new Promise((resolve) => {
      resolveShared = resolve
    })
    vi.mocked(fetchMemoryVerses).mockImplementation(() => sharedPromise)
    render(<App />)
    expect(screen.queryByText('Loading memory verse …')).not.toBeInTheDocument()
    expect(screen.getByRole('blockquote')).toHaveTextContent(/cached body/)
    resolveShared([
      { reference: 'Old', text: 'cached body', date: '1/1/25' },
      { reference: 'Fresh', text: 'from api', date: '16/05/26' },
    ])
    await waitFor(() => {
      expect(screen.getByRole('blockquote')).toHaveTextContent(/from api/)
    })
    expect(screen.getByText(/— Fresh$/)).toBeInTheDocument()
  })

  it('does not replace an undated displayed verse when the API returns a newer sheet verse', async () => {
    localStorage.setItem(
      LAST_DISPLAYED_VERSE_KEY,
      JSON.stringify({ reference: 'Built', text: 'built-in line' }),
    )
    vi.mocked(fetchMemoryVerses).mockResolvedValue([
      { reference: 'Sheet', text: 'sheet line', date: '16/05/26' },
    ])
    render(<App />)
    await waitFor(() => expect(screen.getByRole('blockquote')).toBeInTheDocument())
    expect(screen.getByRole('blockquote')).toHaveTextContent(/built-in line/)
    expect(screen.queryByText(/sheet line/)).not.toBeInTheDocument()
  })

  it('does not swap when the API latest is not newer than the stored dated verse', async () => {
    localStorage.setItem(
      LAST_DISPLAYED_VERSE_KEY,
      JSON.stringify({ reference: 'Current', text: 'stay', date: '16/05/26' }),
    )
    vi.mocked(fetchMemoryVerses).mockResolvedValue([
      { reference: 'Older', text: 'other text', date: '1/1/25' },
    ])
    render(<App />)
    await waitFor(() => expect(screen.getByRole('blockquote')).toHaveTextContent(/stay/))
    expect(screen.queryByText(/other text/)).not.toBeInTheDocument()
  })

  it('shows iOS install instructions above the dedication when enabled', async () => {
    vi.mocked(isIosDevice).mockReturnValue(true)
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    expect(screen.getByRole('button', { name: /^install on ios$/i })).toBeInTheDocument()

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^install on ios$/i }))
    const list = screen.getByRole('list')
    expect(list).toHaveAttribute('id', 'ios-install-instructions')
    expect(list).toHaveTextContent(/share button/i)
    expect(list).toHaveTextContent(/add to home screen/i)

    await user.click(screen.getByRole('button', { name: /^install on ios$/i }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('hides iOS install control on non-iOS devices', async () => {
    vi.mocked(isIosDevice).mockReturnValue(false)
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    expect(screen.queryByRole('button', { name: /^install on ios$/i })).not.toBeInTheDocument()
  })

  it('names the iOS PWA install trigger “Install on iOS” (not Add to Home Screen)', async () => {
    vi.mocked(isIosDevice).mockReturnValue(true)
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    expect(screen.getByRole('button', { name: 'Install on iOS' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to Home Screen' })).not.toBeInTheDocument()
  })

  it('clears iOS install instructions when the reading menu closes', async () => {
    vi.mocked(isIosDevice).mockReturnValue(true)
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    await user.click(screen.getByRole('button', { name: /^install on ios$/i }))
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

  it('orders reading menu actions: Memory Verses, Inspire me, request feature, Text size, Letter cue, Crowd mode, Background colour', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    const dialog = screen.getByRole('dialog', { name: /reading menu/i })
    const actions = dialog.querySelector('.controls-overlay-actions')
    expect(actions).toBeTruthy()
    expect(actions.children.length).toBe(7)

    expect(actions.children[0]).toHaveTextContent(/memory verses/i)
    expect(actions.children[1]).toHaveTextContent(/inspire me/i)
    expect(actions.children[2]).toHaveAttribute('href', featureRequestMailtoHref())
    expect(actions.children[2]).toHaveAttribute('target', '_blank')
    expect(actions.children[2]).toHaveAttribute('rel', 'noopener noreferrer')
    expect(actions.children[2]).toHaveTextContent(/request feature/i)
    expect(actions.children[3]).toHaveClass('controls-overlay-setting-row')
    expect(actions.children[3]).toHaveTextContent(/text size/i)
    expect(actions.children[4]).toHaveClass('controls-overlay-setting-row')
    expect(actions.children[4]).toHaveTextContent(/letter cue method/i)
    expect(actions.children[5]).toHaveClass('controls-overlay-setting-row')
    expect(actions.children[5]).toHaveTextContent(/crowd mode/i)
    expect(actions.children[6]).toHaveClass('controls-overlay-setting-row')
    expect(actions.children[6]).toHaveTextContent(/background colour/i)
  })

  it('opens request feature in a new browser tab (target blank, noopener)', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    const dialog = screen.getByRole('dialog', { name: /reading menu/i })
    const requestLink = within(dialog).getByRole('link', { name: /^request feature$/i })
    expect(requestLink).toHaveAttribute('target', '_blank')
    expect(requestLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('exposes a request feature mailto link with the configured address and subject', () => {
    expect(FEATURE_REQUEST_EMAIL).toBe('steven.walsh39@gmail.com')
    expect(FEATURE_REQUEST_SUBJECT).toBe('Request for Hidden App')
    const href = featureRequestMailtoHref()
    expect(href).toMatch(/^mailto:steven\.walsh39@gmail\.com\?/)
    const params = new URLSearchParams(href.split('?')[1] ?? '')
    expect(params.get('subject')).toBe(FEATURE_REQUEST_SUBJECT)
  })

  it('keeps the reading menu open when request feature is tapped (does not treat it as backdrop tap)', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    const dialog = screen.getByRole('dialog', { name: /reading menu/i })
    const requestLink = within(dialog).getByRole('link', { name: /^request feature$/i })
    fireEvent.click(requestLink)
    expect(screen.getByRole('dialog', { name: /reading menu/i })).toBeInTheDocument()
  })

  it('adjusts verse text size from the reading menu and persists the choice', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    expect(screen.getByText('Default')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^larger text$/i }))
    expect(screen.getByText('Large')).toBeInTheDocument()
    expect(document.documentElement.style.getPropertyValue('--verse-font-scale')).toBe('1.15')
    expect(localStorage.getItem('verseFontScale')).toBe('3')

    await user.click(screen.getByRole('button', { name: /^hide reading menu/i }))
    await user.click(screen.getByRole('blockquote'))
    expect(screen.getByText('Large')).toBeInTheDocument()
  })

  it('offers XL and XXL text sizes above Larger and persists the choice', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    const xlIndex = VERSE_FONT_SCALE_STEPS.findIndex((s) => s.label === 'XL')
    for (let i = DEFAULT_VERSE_FONT_SCALE_INDEX; i < xlIndex; i++) {
      await user.click(screen.getByRole('button', { name: /^larger text$/i }))
    }
    expect(screen.getByText('XL')).toBeInTheDocument()
    expect(document.documentElement.style.getPropertyValue('--verse-font-scale')).toBe('1.5')
    expect(localStorage.getItem('verseFontScale')).toBe(
      String(VERSE_FONT_SCALE_STEPS.findIndex((s) => s.label === 'XL')),
    )

    await user.click(screen.getByRole('button', { name: /^larger text$/i }))
    expect(screen.getByText('XXL')).toBeInTheDocument()
    expect(document.documentElement.style.getPropertyValue('--verse-font-scale')).toBe('1.7')
    expect(localStorage.getItem('verseFontScale')).toBe(
      String(VERSE_FONT_SCALE_STEPS.findIndex((s) => s.label === 'XXL')),
    )

    await user.click(screen.getByRole('button', { name: /^hide reading menu/i }))
    await user.click(screen.getByRole('blockquote'))
    expect(screen.getByText('XXL')).toBeInTheDocument()
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

  it('exports the default page background colour constant', () => {
    expect(CONTROLS_OVERLAY_BACKDROP).toBe('#082818')
  })

  it('lets you pick background colour for the main view from a dropdown and persists it', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    expect(document.documentElement).toHaveStyle({
      backgroundColor: OVERLAY_BACKDROP_OPTIONS[1].value,
    })

    await user.click(screen.getByRole('blockquote'))
    const dialog = screen.getByRole('dialog', { name: /reading menu/i })

    const slateIndex = 2
    const slateBlue = OVERLAY_BACKDROP_OPTIONS[slateIndex]
    const select = within(dialog).getByLabelText(/^background colour$/i)
    await user.selectOptions(select, String(slateIndex))

    expect(document.documentElement).toHaveStyle({ backgroundColor: slateBlue.value })
    expect(dialog).toHaveStyle({ backgroundColor: slateBlue.value })
    expect(localStorage.getItem(APP_BACKGROUND_STORAGE_KEY)).toBe('2')
    expect(select).toHaveValue('2')

    await user.click(screen.getByRole('button', { name: /^hide reading menu/i }))
    await user.click(screen.getByRole('blockquote'))
    expect(document.documentElement).toHaveStyle({ backgroundColor: slateBlue.value })
    expect(screen.getByRole('dialog', { name: /reading menu/i })).toHaveStyle({
      backgroundColor: slateBlue.value,
    })
    expect(
      within(screen.getByRole('dialog', { name: /reading menu/i })).getByLabelText(
        /^background colour$/i,
      ),
    ).toHaveValue('2')
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

  /** Turn on letter cue mode from the reading menu, then close it. */
  async function enableLetterCueModeFromMenu(user) {
    await user.click(screen.getByRole('blockquote'))
    const letterCueSwitch = screen.getByRole('switch', { name: /^letter cue method$/i })
    if (letterCueSwitch.getAttribute('aria-checked') !== 'true') {
      await user.click(letterCueSwitch)
    }
    await user.click(screen.getByRole('button', { name: /hide reading menu/i }))
  }

  it('lets you pick letter cues and shows them in a line above the verse', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await enableLetterCueModeFromMenu(user)

    const blockquote = screen.getByRole('blockquote')
    const alphaA = within(blockquote).getByRole('button', { name: 'Add letter cue A' })
    await user.click(alphaA)
    expect(alphaA).toHaveAttribute('aria-pressed', 'true')

    const betaB = within(blockquote).getByRole('button', { name: 'Add letter cue B' })
    await user.click(betaB)

    expect(screen.getByLabelText('Letter cues')).toHaveTextContent('A B')

    await user.click(
      within(blockquote).getByRole('button', { name: 'Remove letter cue A' }),
    )
    expect(screen.getByLabelText('Letter cues')).toHaveTextContent('B')
  })

  it('does not open the reading menu when tapping a letter cue button', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await enableLetterCueModeFromMenu(user)
    await user.click(
      within(screen.getByRole('blockquote')).getByRole('button', { name: 'Add letter cue A' }),
    )
    expect(screen.queryByRole('dialog', { name: /reading menu/i })).not.toBeInTheDocument()
  })

  it('clears letter cues when the verse changes', async () => {
    vi.mocked(getRandomBuiltInVerse).mockReturnValue({
      reference: 'Test 2:2',
      text: 'Delta Echo',
    })
    const user = userEvent.setup()
    await renderAppReady()

    await enableLetterCueModeFromMenu(user)
    await user.click(
      within(screen.getByRole('blockquote')).getByRole('button', { name: 'Add letter cue A' }),
    )
    expect(screen.getByLabelText('Letter cues')).toHaveTextContent('A')

    await user.click(screen.getByRole('button', { name: /show reading menu/i }))
    await user.click(screen.getByRole('button', { name: /inspire me/i }))
    await waitFor(() => expect(screen.queryByLabelText('Letter cues')).not.toBeInTheDocument())
    expect(screen.getByRole('blockquote')).toHaveTextContent(/Delta Echo/)
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

  it('shows a delete account control in the reading menu that opens a warning dialog', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    const deleteBtn = screen.getByRole('button', { name: /^delete account$/i })
    expect(deleteBtn).toBeInTheDocument()

    await user.click(deleteBtn)
    expect(screen.queryByRole('dialog', { name: /reading menu/i })).not.toBeInTheDocument()
    const confirmDialog = screen.getByRole('dialog', { name: /delete account/i })
    expect(confirmDialog).toBeInTheDocument()
    expect(within(confirmDialog).getByText(DELETE_ACCOUNT_WARNING)).toBeInTheDocument()
    expect(within(confirmDialog).getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
    expect(
      within(confirmDialog).getByRole('button', { name: /^delete my account$/i }),
    ).toBeInTheDocument()
  })

  it('closes the delete account dialog without calling the API when cancelled', async () => {
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    await user.click(screen.getByRole('button', { name: /^delete account$/i }))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(screen.queryByRole('dialog', { name: /delete account/i })).not.toBeInTheDocument()
    expect(deleteAccount).not.toHaveBeenCalled()
  })

  it('deletes the account, clears local data, and resets the verse when confirmed', async () => {
    const user = userEvent.setup()
    localStorage.setItem('verseFontScale', '4')
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    await user.click(screen.getByRole('button', { name: /^delete account$/i }))
    await user.click(screen.getByRole('button', { name: /^delete my account$/i }))

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledTimes(1))
    expect(clearLocalAppData).toHaveBeenCalled()
    expect(localStorage.getItem('verseFontScale')).toBeNull()
    expect(screen.queryByRole('dialog', { name: /delete account/i })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('blockquote')).toHaveTextContent(/hidden your word/i)
    })
  })

  it('shows an error in the delete dialog when account deletion fails', async () => {
    vi.mocked(deleteAccount).mockRejectedValueOnce(new Error('Could not delete account (503)'))
    const user = userEvent.setup()
    await renderAppReady()

    await user.click(screen.getByRole('blockquote'))
    await user.click(screen.getByRole('button', { name: /^delete account$/i }))
    await user.click(screen.getByRole('button', { name: /^delete my account$/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Could not delete account \(503\)/)
    })
    expect(screen.getByRole('dialog', { name: /delete account/i })).toBeInTheDocument()
    expect(localStorage.getItem(LAST_DISPLAYED_VERSE_KEY)).not.toBeNull()
  })
})
