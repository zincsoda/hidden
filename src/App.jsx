import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { getRandomBuiltInVerse } from './verses'
import {
  fetchMemoryVerses,
  getMostRecentMemoryVerse,
  shouldUpdateToLatestMemoryVerse,
} from './memoryVersesApi'
import {
  readLastDisplayedVerse,
  writeLastDisplayedVerse,
  FALLBACK_DISPLAY_VERSE,
} from './lastDisplayedVerse'
import { pickRandomFromPool } from './memoryHelpers'
import ReloadPrompt from './components/ReloadPrompt.jsx'
import { formatBuildLabel } from './buildInfo.js'
import { isIosDevice } from './iosDevice.js'
import {
  readVerseFontScaleIndex,
  bumpVerseFontScale,
  VERSE_FONT_SCALE_STEPS,
} from './verseFontSize.js'
import {
  OVERLAY_BACKDROP_OPTIONS,
  overlayBackdropCssAt,
  readAppBackgroundIndex,
  persistAppBackgroundIndex,
} from './overlayBackdrop.js'
import {
  buildLetterCueLine,
  getWordCharRanges,
  isSelectableLetter,
  toggleLetterIndex,
  toggleWordCueIndex,
} from './letterCue.js'
import { trackEvent } from './analytics.js'
import {
  clearLocalAppData,
  deleteAccount,
  DELETE_ACCOUNT_WARNING,
} from './accountApi.js'
import './App.css'

const WORD_SPLIT = /\s+/

export { CONTROLS_OVERLAY_BACKDROP } from './overlayBackdrop.js'

export const FEATURE_REQUEST_EMAIL = 'steven.walsh39@gmail.com'
export const FEATURE_REQUEST_SUBJECT = 'Request for Hidden App'

export function featureRequestMailtoHref() {
  return `mailto:${FEATURE_REQUEST_EMAIL}?${new URLSearchParams({
    subject: FEATURE_REQUEST_SUBJECT,
  })}`
}

function tokenizeVerse(text) {
  return String(text ?? '')
    .trim()
    .split(WORD_SPLIT)
    .filter(Boolean)
}

function App() {
  const [memoryVerses, setMemoryVerses] = useState([])
  const [memoryVersesLoading, setMemoryVersesLoading] = useState(true)
  const [memoryVersesError, setMemoryVersesError] = useState('')
  const [awaitingInitialMemoryVerse, setAwaitingInitialMemoryVerse] = useState(
    () => readLastDisplayedVerse() === null,
  )
  const [verse, setVerse] = useState(
    () => readLastDisplayedVerse() ?? FALLBACK_DISPLAY_VERSE,
  )
  const [controlsOverlayOpen, setControlsOverlayOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [iosInstallOpen, setIosInstallOpen] = useState(false)
  const iosUser = useMemo(() => isIosDevice(), [])
  /** When false, the three crowd / memory-practice buttons are hidden from the verse card. */
  const [crowdModeVisible, setCrowdModeVisible] = useState(false)
  const [verseFontScaleIndex, setVerseFontScaleIndexState] = useState(() =>
    readVerseFontScaleIndex(),
  )
  const [hiddenWordIndices, setHiddenWordIndices] = useState(() => new Set())
  const [revealHiddenWords, setRevealHiddenWords] = useState(false)
  const [letterCueModeEnabled, setLetterCueModeEnabled] = useState(false)
  const [letterCuePickMode, setLetterCuePickMode] = useState('words')
  const [selectedLetterIndices, setSelectedLetterIndices] = useState(() => new Set())
  const [appBackgroundIndex, setAppBackgroundIndexState] = useState(() =>
    readAppBackgroundIndex(),
  )
  const pickDialogRef = useRef(null)
  const deleteAccountDialogRef = useRef(null)
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState('')

  const closeControlsOverlay = useCallback(() => {
    setControlsOverlayOpen(false)
  }, [])

  const adjustVerseFontScale = useCallback((delta) => {
    const next = bumpVerseFontScale(delta)
    setVerseFontScaleIndexState(next)
    trackEvent('setting_change', {
      setting: 'text_size',
      value: VERSE_FONT_SCALE_STEPS[next].label,
    })
  }, [])

  const selectAppBackgroundIndex = useCallback((index) => {
    setAppBackgroundIndexState(persistAppBackgroundIndex(index))
    const option = OVERLAY_BACKDROP_OPTIONS[index]
    trackEvent('setting_change', {
      setting: 'background',
      value: option?.id ?? String(index),
    })
  }, [])

  useEffect(() => {
    const colour = overlayBackdropCssAt(appBackgroundIndex)
    document.documentElement.style.backgroundColor = colour
    return () => {
      document.documentElement.style.backgroundColor = ''
    }
  }, [appBackgroundIndex])

  const showNewVerse = () => {
    const picked = getRandomBuiltInVerse(verse)
    if (picked) {
      setVerse(picked)
      trackEvent('verse_inspire', { reference: picked.reference })
    }
  }

  const openPickVerse = () => {
    closeControlsOverlay()
    const d = pickDialogRef.current
    if (!d) return
    d.showModal()
  }

  const closePickVerse = () => {
    pickDialogRef.current?.close()
  }

  const openDeleteAccountDialog = () => {
    closeControlsOverlay()
    setDeleteAccountError('')
    const d = deleteAccountDialogRef.current
    if (!d) return
    d.showModal()
  }

  const closeDeleteAccountDialog = () => {
    if (deleteAccountBusy) return
    deleteAccountDialogRef.current?.close()
  }

  const confirmDeleteAccount = async () => {
    setDeleteAccountBusy(true)
    setDeleteAccountError('')
    try {
      await deleteAccount()
      clearLocalAppData()
      trackEvent('account_deleted')
      deleteAccountDialogRef.current?.close()
      setMemoryVerses([])
      setMemoryVersesError('')
      setVerse(FALLBACK_DISPLAY_VERSE)
      setAwaitingInitialMemoryVerse(false)
      setVerseFontScaleIndexState(readVerseFontScaleIndex())
      setAppBackgroundIndexState(readAppBackgroundIndex())
      setControlsOverlayOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete account.'
      setDeleteAccountError(message)
    } finally {
      setDeleteAccountBusy(false)
    }
  }

  const selectVerseFromList = (picked) => {
    setVerse({ ...picked })
    trackEvent('verse_pick', { reference: picked.reference })
    closePickVerse()
  }

  useEffect(() => {
    if (awaitingInitialMemoryVerse) return
    writeLastDisplayedVerse(verse)
  }, [awaitingInitialMemoryVerse, verse.reference, verse.text, verse.date])

  useEffect(() => {
    let cancelled = false
    const firstOpen = readLastDisplayedVerse() === null
    ;(async () => {
      setMemoryVersesLoading(true)
      setMemoryVersesError('')
      try {
        const list = await fetchMemoryVerses()
        if (cancelled) return
        setMemoryVerses(list)
        const latest = getMostRecentMemoryVerse(list)
        if (firstOpen) {
          setVerse(latest ?? FALLBACK_DISPLAY_VERSE)
          setAwaitingInitialMemoryVerse(false)
        } else {
          setVerse((prev) =>
            latest && shouldUpdateToLatestMemoryVerse(prev, latest) ? latest : prev,
          )
        }
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Could not load verses.'
        setMemoryVersesError(message)
        setMemoryVerses([])
        if (firstOpen) {
          setVerse(FALLBACK_DISPLAY_VERSE)
          setAwaitingInitialMemoryVerse(false)
        }
      } finally {
        if (!cancelled) setMemoryVersesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setHiddenWordIndices(new Set())
    setRevealHiddenWords(false)
    setSelectedLetterIndices(new Set())
  }, [verse?.reference, verse?.text])

  useEffect(() => {
    if (!controlsOverlayOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeControlsOverlay()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [controlsOverlayOpen, closeControlsOverlay])

  useEffect(() => {
    if (!controlsOverlayOpen) {
      setAboutOpen(false)
      setIosInstallOpen(false)
    }
  }, [controlsOverlayOpen])

  const verseWords = useMemo(() => (verse ? tokenizeVerse(verse.text) : []), [verse?.text])
  const verseText = verse?.text ?? ''
  const wordCharRanges = useMemo(
    () => getWordCharRanges(verseText, verseWords),
    [verseText, verseWords],
  )
  const letterCueLine = useMemo(
    () => buildLetterCueLine(verseText, selectedLetterIndices),
    [verseText, selectedLetterIndices],
  )

  const toggleLetterCue = useCallback((charIndex) => {
    setSelectedLetterIndices((prev) => toggleLetterIndex(prev, charIndex))
  }, [])

  const toggleWordCue = useCallback(
    (wordIndex) => {
      const range = wordCharRanges[wordIndex]
      if (!range) return
      setSelectedLetterIndices((prev) => toggleWordCueIndex(prev, verseText, range))
    },
    [verseText, wordCharRanges],
  )

  const selectLetterCuePickMode = useCallback((mode) => {
    setLetterCuePickMode(mode)
    setSelectedLetterIndices(new Set())
    trackEvent('setting_change', {
      setting: 'letter_cue_pick',
      value: mode,
    })
  }, [])

  const hideMoreWords = useCallback(() => {
    trackEvent('memory_practice', { action: 'hide_words' })
    setHiddenWordIndices((prev) => {
      if (verseWords.length === 0) return prev
      const available = verseWords.map((_, i) => i).filter((i) => !prev.has(i))
      const batch = 2 + Math.floor(Math.random() * 2)
      const picked = pickRandomFromPool(available, batch)
      if (picked.length === 0) return prev
      const next = new Set(prev)
      for (const i of picked) next.add(i)
      return next
    })
  }, [verseWords])

  const showAllWords = useCallback(() => {
    trackEvent('memory_practice', { action: 'show_all' })
    setHiddenWordIndices(new Set())
    setRevealHiddenWords(false)
  }, [])

  const allWordsHidden =
    verseWords.length > 0 && hiddenWordIndices.size >= verseWords.length

  const handleVerseCardClick = (e) => {
    if (awaitingInitialMemoryVerse) return
    const el = e.target instanceof Element ? e.target : null
    if (el?.closest('button')) return
    if (el?.closest('.verse-actions')) return
    if (el?.closest('.verse-letter-btn')) return
    if (!verse) return
    setControlsOverlayOpen(true)
    trackEvent('controls_open')
  }

  const renderWordFirstLetterCue = (word, wordIndex) => {
    const range = wordCharRanges[wordIndex]
    if (!range) return word
    const chars = [...word]
    const firstLetterCi = chars.findIndex((ch) => isSelectableLetter(ch))
    if (firstLetterCi === -1) return word
    const charIndex = range.start + firstLetterCi
    const selected = selectedLetterIndices.has(charIndex)
    const firstLetter = chars[firstLetterCi]
    return (
      <span
        role="button"
        tabIndex={0}
        className={`verse-letter-btn${selected ? ' verse-letter-btn--selected' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          toggleWordCue(wordIndex)
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          e.stopPropagation()
          toggleWordCue(wordIndex)
        }}
        aria-pressed={selected}
        aria-label={`${selected ? 'Remove' : 'Add'} letter cue ${firstLetter} for word ${word}`}
      >
        {word}
      </span>
    )
  }

  const renderWordLetters = (word, wordIndex) => {
    const range = wordCharRanges[wordIndex]
    if (!range) return word
    return [...word].map((ch, ci) => {
      const charIndex = range.start + ci
      if (!isSelectableLetter(ch)) {
        return <span key={charIndex}>{ch}</span>
      }
      const selected = selectedLetterIndices.has(charIndex)
      return (
        <span
          key={charIndex}
          role="button"
          tabIndex={0}
          className={`verse-letter-btn${selected ? ' verse-letter-btn--selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            toggleLetterCue(charIndex)
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            e.preventDefault()
            e.stopPropagation()
            toggleLetterCue(charIndex)
          }}
          aria-pressed={selected}
          aria-label={`${selected ? 'Remove' : 'Add'} letter cue ${ch}`}
        >
          {ch}
        </span>
      )
    })
  }

  const renderWordContent = (word, wordIndex) => {
    if (!letterCueModeEnabled) return word
    if (letterCuePickMode === 'words') return renderWordFirstLetterCue(word, wordIndex)
    return renderWordLetters(word, wordIndex)
  }

  const handleOverlayAnotherVerseClick = (e) => {
    e.stopPropagation()
    closeControlsOverlay()
    showNewVerse()
  }

  const handleOverlayPickVerseClick = (e) => {
    e.stopPropagation()
    openPickVerse()
  }

  return (
    <div className="app">
      <main className="verse-card verse-card-interactive" onClick={handleVerseCardClick}>
        {awaitingInitialMemoryVerse ? (
          <p className="verse-loading" aria-live="polite">
            Loading memory verse …
          </p>
        ) : (
          <>
            {letterCueModeEnabled && letterCueLine ? (
              <p className="letter-cue-line" aria-live="polite" aria-label="Letter cues">
                {letterCueLine}
              </p>
            ) : null}
            <blockquote
              className={`verse-text${letterCueModeEnabled ? ' verse-text--letter-cue' : ''}`}
            >
              &ldquo;
              {verseWords.map((word, i) => (
                <span key={i} className="verse-word">
                  {hiddenWordIndices.has(i) ? (
                    <span
                      className="memory-word-slot"
                      aria-label={revealHiddenWords ? undefined : 'Hidden word'}
                    >
                      <span
                        className={
                          revealHiddenWords ? 'memory-word-visible memory-word-revealed' : undefined
                        }
                        style={{ visibility: revealHiddenWords ? 'visible' : 'hidden' }}
                        aria-hidden={revealHiddenWords ? undefined : true}
                      >
                        {word}
                      </span>
                    </span>
                  ) : (
                    renderWordContent(word, i)
                  )}
                  {i < verseWords.length - 1 ? ' ' : ''}
                </span>
              ))}
              &rdquo;
            </blockquote>
            <cite className="verse-reference">— {verse.reference}</cite>
            {crowdModeVisible ? (
              <div className="verse-actions">
                <div className="verse-actions-group verse-actions-memory">
                  <button
                    type="button"
                    className="new-verse-btn"
                    onClick={hideMoreWords}
                    disabled={verseWords.length === 0 || allWordsHidden}
                  >
                    Hide 2–3 words
                  </button>
                  <button
                    type="button"
                    className="new-verse-btn"
                    onClick={showAllWords}
                    disabled={hiddenWordIndices.size === 0}
                  >
                    Show all
                  </button>
                  <button
                    type="button"
                    className="new-verse-btn verse-actions-memory-wide"
                    onClick={() => {
                      setRevealHiddenWords((v) => {
                        trackEvent('memory_practice', {
                          action: v ? 'hide_revealed_text' : 'show_hidden_words',
                        })
                        return !v
                      })
                    }}
                    disabled={hiddenWordIndices.size === 0}
                    aria-pressed={revealHiddenWords}
                  >
                    {revealHiddenWords ? 'Hide word text' : 'Show hidden words'}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>

      <dialog ref={pickDialogRef} className="pick-dialog" onClose={() => {}}>
        <div className="pick-form pick-form-list">
          <h2 className="pick-dialog-title" id="pick-dialog-heading">
            Memory Verses
          </h2>
          <p className="pick-dialog-hint">Pick a verse from your memory list (loaded from the sheet).</p>
          {memoryVersesLoading ? (
            <p className="pick-dialog-status">Loading memory list…</p>
          ) : memoryVersesError ? (
            <p className="pick-dialog-status pick-dialog-status-error">{memoryVersesError}</p>
          ) : memoryVerses.length === 0 ? (
            <p className="pick-dialog-status">No verses on the memory list.</p>
          ) : (
            <ul className="pick-verse-list" aria-labelledby="pick-dialog-heading">
              {memoryVerses.map((v, i) => (
                <li key={`${v.reference}-${v.date ?? ''}-${i}`}>
                  <button
                    type="button"
                    className="pick-verse-option"
                    onClick={() => selectVerseFromList(v)}
                  >
                    <span className="pick-verse-option-ref">{v.reference}</span>
                    {v.date ? <span className="pick-verse-option-date">{v.date}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="pick-dialog-actions pick-dialog-actions-single">
            <button type="button" className="new-verse-btn pick-cancel" onClick={closePickVerse}>
              Cancel
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={deleteAccountDialogRef}
        className="pick-dialog delete-account-dialog"
        aria-labelledby="delete-account-dialog-heading"
        onClose={() => {
          if (!deleteAccountBusy) setDeleteAccountError('')
        }}
      >
        <div className="pick-form">
          <h2 className="pick-dialog-title" id="delete-account-dialog-heading">
            Delete account?
          </h2>
          <p className="pick-dialog-hint delete-account-warning">{DELETE_ACCOUNT_WARNING}</p>
          {deleteAccountError ? (
            <p className="pick-dialog-status pick-dialog-status-error" role="alert">
              {deleteAccountError}
            </p>
          ) : null}
          <div className="pick-dialog-actions delete-account-dialog-actions">
            <button
              type="button"
              className="new-verse-btn pick-cancel"
              disabled={deleteAccountBusy}
              onClick={closeDeleteAccountDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              className="new-verse-btn delete-account-confirm-btn"
              disabled={deleteAccountBusy}
              aria-describedby="delete-account-dialog-heading"
              onClick={() => void confirmDeleteAccount()}
            >
              {deleteAccountBusy ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </div>
      </dialog>

      <button
          type="button"
          className="controls-overlay-toggle"
          onClick={() =>
            setControlsOverlayOpen((open) => {
              if (!open) trackEvent('controls_open')
              return !open
            })
          }
          aria-expanded={controlsOverlayOpen}
          aria-label={controlsOverlayOpen ? 'Hide reading menu' : 'Show reading menu'}
        >
          ⋯
        </button>

      {controlsOverlayOpen ? (
        <div
          id="controls-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="controls-overlay-heading"
          className="controls-overlay"
          style={{
            backgroundColor: overlayBackdropCssAt(appBackgroundIndex),
          }}
          onClick={closeControlsOverlay}
        >
          <div className="controls-overlay-body">
            <div className="controls-overlay-inner">
              <h2 id="controls-overlay-heading" className="controls-overlay-visually-hidden">
                Reading menu
              </h2>
              <div className="controls-overlay-actions">
                <button type="button" className="new-verse-btn" onClick={handleOverlayPickVerseClick}>
                  Memory Verses
                </button>
                <button type="button" className="new-verse-btn" onClick={handleOverlayAnotherVerseClick}>
                  Inspire me
                </button>
                <a
                  className="new-verse-btn"
                  href={featureRequestMailtoHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation()
                    trackEvent('feature_request')
                  }}
                >
                  request feature
                </a>
                <div
                  className="controls-overlay-setting-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="controls-overlay-setting-label" id="font-size-label">
                    Text size
                  </span>
                  <div
                    className="controls-overlay-font-stepper"
                    role="group"
                    aria-labelledby="font-size-label"
                  >
                    <button
                      type="button"
                      className="controls-overlay-font-step-btn"
                      aria-label="Smaller text"
                      disabled={verseFontScaleIndex <= 0}
                      onClick={() => adjustVerseFontScale(-1)}
                    >
                      −
                    </button>
                    <span className="controls-overlay-font-step-value" aria-live="polite">
                      {VERSE_FONT_SCALE_STEPS[verseFontScaleIndex].label}
                    </span>
                    <button
                      type="button"
                      className="controls-overlay-font-step-btn"
                      aria-label="Larger text"
                      disabled={verseFontScaleIndex >= VERSE_FONT_SCALE_STEPS.length - 1}
                      onClick={() => adjustVerseFontScale(1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div
                  className="controls-overlay-setting-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="controls-overlay-setting-label" id="letter-cue-label">
                    Letter cue method
                  </span>
                  <button
                    type="button"
                    className="ios-switch"
                    role="switch"
                    aria-checked={letterCueModeEnabled}
                    aria-labelledby="letter-cue-label"
                    onClick={() =>
                      setLetterCueModeEnabled((v) => {
                        trackEvent('setting_change', {
                          setting: 'letter_cue',
                          value: !v ? 'on' : 'off',
                        })
                        return !v
                      })
                    }
                  >
                    <span className="ios-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                {letterCueModeEnabled ? (
                  <div
                    className="controls-overlay-setting-row"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className="controls-overlay-setting-label"
                      id="letter-cue-pick-label"
                    >
                      Letter cue pick
                    </span>
                    <div
                      className="letter-cue-pick-group"
                      role="group"
                      aria-labelledby="letter-cue-pick-label"
                    >
                      <button
                        type="button"
                        className={`letter-cue-pick-btn${letterCuePickMode === 'words' ? ' letter-cue-pick-btn--active' : ''}`}
                        aria-pressed={letterCuePickMode === 'words'}
                        onClick={() => selectLetterCuePickMode('words')}
                      >
                        Words
                      </button>
                      <button
                        type="button"
                        className={`letter-cue-pick-btn${letterCuePickMode === 'letters' ? ' letter-cue-pick-btn--active' : ''}`}
                        aria-pressed={letterCuePickMode === 'letters'}
                        onClick={() => selectLetterCuePickMode('letters')}
                      >
                        Letters
                      </button>
                    </div>
                  </div>
                ) : null}
                <div
                  className="controls-overlay-setting-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="controls-overlay-setting-label" id="crowd-mode-label">
                    Crowd mode
                  </span>
                  <button
                    type="button"
                    className="ios-switch"
                    role="switch"
                    aria-checked={crowdModeVisible}
                    aria-labelledby="crowd-mode-label"
                    onClick={() =>
                      setCrowdModeVisible((v) => {
                        trackEvent('setting_change', {
                          setting: 'crowd_mode',
                          value: !v ? 'on' : 'off',
                        })
                        return !v
                      })
                    }
                  >
                    <span className="ios-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
                <div
                  className="controls-overlay-setting-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <label
                    className="controls-overlay-setting-label"
                    htmlFor="app-background-select"
                    id="app-background-label"
                  >
                    Background colour
                  </label>
                  <select
                    id="app-background-select"
                    className="controls-overlay-background-select"
                    value={appBackgroundIndex}
                    onChange={(e) => selectAppBackgroundIndex(Number(e.target.value))}
                  >
                    {OVERLAY_BACKDROP_OPTIONS.map((opt, i) => (
                      <option key={opt.id} value={i}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="controls-overlay-about-btn"
            onClick={(e) => {
              e.stopPropagation()
              setAboutOpen((open) => !open)
            }}
            aria-expanded={aboutOpen}
          >
            About
          </button>
          {aboutOpen ? (
            <p
              className="controls-overlay-about-text"
              onClick={(e) => e.stopPropagation()}
            >
              Psalm 119:11 says I have hidden your word in my heart that I might not sin against you.
              The app is called &ldquo;hidden&rdquo; representing what we have hidden in our hearts.
            </p>
          ) : null}
          {iosUser ? (
            <>
              <button
                type="button"
                className="controls-overlay-install-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setIosInstallOpen((open) => {
                    if (!open) trackEvent('ios_install_help_opened')
                    return !open
                  })
                }}
                aria-expanded={iosInstallOpen}
                aria-controls={iosInstallOpen ? 'ios-install-instructions' : undefined}
              >
                Install on iOS
              </button>
              {iosInstallOpen ? (
                <ol
                  id="ios-install-instructions"
                  className="controls-overlay-install-steps"
                  onClick={(e) => e.stopPropagation()}
                >
                  <li>
                    In Safari, tap the Share button in the toolbar (square with an arrow pointing up).
                  </li>
                  <li>
                    Scroll the share sheet and tap <strong>Add to Home Screen</strong>.
                  </li>
                  <li>
                    Tap <strong>Add</strong> to finish.
                  </li>
                </ol>
              ) : null}
            </>
          ) : null}
          <button
            type="button"
            className="controls-overlay-delete-account-btn"
            onClick={(e) => {
              e.stopPropagation()
              openDeleteAccountDialog()
            }}
          >
            Delete account
          </button>
          <p className="controls-overlay-dedication">Made with ❤️ for KSR</p>
          <p className="controls-overlay-build" aria-label="Build version">
            {formatBuildLabel()}
          </p>
        </div>
      ) : null}

      <ReloadPrompt />
    </div>
  )
}

export default App
