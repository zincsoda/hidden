import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { getRandomBuiltInVerse } from './verses'
import { fetchMemoryVerses } from './memoryVersesApi'
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
  buildLetterCueLine,
  getWordCharRanges,
  isSelectableLetter,
  toggleLetterIndex,
} from './letterCue.js'
import './App.css'

const WORD_SPLIT = /\s+/

/** Fully opaque backdrop behind the reading menu. */
export const CONTROLS_OVERLAY_BACKDROP = 'rgb(0, 0, 0)'

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
  const [selectedLetterIndices, setSelectedLetterIndices] = useState(() => new Set())
  const pickDialogRef = useRef(null)

  const closeControlsOverlay = useCallback(() => {
    setControlsOverlayOpen(false)
  }, [])

  const adjustVerseFontScale = useCallback((delta) => {
    const next = bumpVerseFontScale(delta)
    setVerseFontScaleIndexState(next)
  }, [])

  const showNewVerse = () => {
    const picked = getRandomBuiltInVerse(verse)
    if (picked) setVerse(picked)
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

  const selectVerseFromList = (picked) => {
    setVerse({ ...picked })
    closePickVerse()
  }

  useEffect(() => {
    writeLastDisplayedVerse(verse)
  }, [verse.reference, verse.text])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setMemoryVersesLoading(true)
      setMemoryVersesError('')
      try {
        const list = await fetchMemoryVerses()
        if (cancelled) return
        setMemoryVerses(list)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Could not load verses.'
        setMemoryVersesError(message)
        setMemoryVerses([])
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

  const hideMoreWords = useCallback(() => {
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
    setHiddenWordIndices(new Set())
    setRevealHiddenWords(false)
  }, [])

  const allWordsHidden =
    verseWords.length > 0 && hiddenWordIndices.size >= verseWords.length

  const handleVerseCardClick = (e) => {
    const el = e.target instanceof Element ? e.target : null
    if (el?.closest('button')) return
    if (el?.closest('.verse-actions')) return
    if (el?.closest('.verse-letter-btn')) return
    if (!verse) return
    setControlsOverlayOpen(true)
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
    if (letterCueModeEnabled) return renderWordLetters(word, wordIndex)
    return word
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
                    onClick={() => setRevealHiddenWords((v) => !v)}
                    disabled={hiddenWordIndices.size === 0}
                    aria-pressed={revealHiddenWords}
                  >
                    {revealHiddenWords ? 'Hide word text' : 'Show hidden words'}
                  </button>
                </div>
              </div>
            ) : null}
        </>
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

      <button
          type="button"
          className="controls-overlay-toggle"
          onClick={() => setControlsOverlayOpen((open) => !open)}
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
          style={{ backgroundColor: CONTROLS_OVERLAY_BACKDROP }}
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
                    onClick={() => setLetterCueModeEnabled((v) => !v)}
                  >
                    <span className="ios-switch-thumb" aria-hidden="true" />
                  </button>
                </div>
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
                    onClick={() => setCrowdModeVisible((v) => !v)}
                  >
                    <span className="ios-switch-thumb" aria-hidden="true" />
                  </button>
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
                  setIosInstallOpen((open) => !open)
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
