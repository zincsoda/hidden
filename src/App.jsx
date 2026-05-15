import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { getRandomVerse, findVerseByReference } from './verses'
import './App.css'

const WORD_SPLIT = /\s+/

function tokenizeVerse(text) {
  return String(text ?? '')
    .trim()
    .split(WORD_SPLIT)
    .filter(Boolean)
}

/** Pick up to `count` items from `pool` uniformly at random, without replacement. */
function pickRandomFromPool(pool, count) {
  const arr = [...pool]
  const n = Math.min(count, arr.length)
  if (n <= 0) return []
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, n)
}

function App() {
  const [verse, setVerse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hiddenWordIndices, setHiddenWordIndices] = useState(() => new Set())
  const [pickInput, setPickInput] = useState('')
  const [pickError, setPickError] = useState('')
  const pickDialogRef = useRef(null)

  const showNewVerse = () => {
    setLoading(true)
    setVerse(getRandomVerse())
    setLoading(false)
  }

  const openPickVerse = () => {
    setPickError('')
    setPickInput(verse?.reference ?? '')
    const d = pickDialogRef.current
    if (!d) return
    d.showModal()
    requestAnimationFrame(() => {
      const el = document.getElementById('pick-reference')
      el?.focus()
      el?.select()
    })
  }

  const closePickVerse = () => {
    pickDialogRef.current?.close()
    setPickError('')
  }

  const submitPickVerse = (e) => {
    e.preventDefault()
    const found = findVerseByReference(pickInput)
    if (!found) {
      setPickError('No verse matches that reference in this list.')
      return
    }
    setVerse(found)
    closePickVerse()
    setPickInput('')
  }

  useEffect(() => {
    setVerse(getRandomVerse())
    setLoading(false)
  }, [])

  useEffect(() => {
    setHiddenWordIndices(new Set())
  }, [verse?.reference, verse?.text])

  const verseWords = useMemo(() => (verse ? tokenizeVerse(verse.text) : []), [verse?.text])

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
  }, [])

  const allWordsHidden =
    verseWords.length > 0 && hiddenWordIndices.size >= verseWords.length

  return (
    <div className="app">
      <main className="verse-card">
        {loading ? (
          <p className="verse-text">...</p>
        ) : verse ? (
          <>
            <blockquote className="verse-text">
              &ldquo;
              {verseWords.map((word, i) => (
                <span key={i}>
                  {hiddenWordIndices.has(i) ? (
                    <span
                      className="memory-blank"
                      style={{ minWidth: `${Math.max(2.5, word.length * 0.55)}ch` }}
                      aria-label="Hidden word"
                    />
                  ) : (
                    word
                  )}
                  {i < verseWords.length - 1 ? ' ' : ''}
                </span>
              ))}
              &rdquo;
            </blockquote>
            <cite className="verse-reference">— {verse.reference}</cite>
            <div className="verse-actions">
              <button type="button" className="new-verse-btn" onClick={showNewVerse}>
                Another verse
              </button>
              <button type="button" className="new-verse-btn" onClick={openPickVerse}>
                Choose verse
              </button>
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
            </div>
          </>
        ) : null}
      </main>

      <dialog ref={pickDialogRef} className="pick-dialog" onClose={() => setPickError('')}>
        <form className="pick-form" onSubmit={submitPickVerse}>
          <h2 className="pick-dialog-title">Go to verse</h2>
          <p className="pick-dialog-hint">Enter a reference from the built-in list (e.g. John 3:16).</p>
          <label className="pick-label" htmlFor="pick-reference">
            Reference
          </label>
          <input
            id="pick-reference"
            type="text"
            className="pick-input"
            value={pickInput}
            onChange={(e) => {
              setPickInput(e.target.value)
              setPickError('')
            }}
            autoComplete="off"
            placeholder="John 3:16"
          />
          {pickError ? <p className="pick-error">{pickError}</p> : null}
          <div className="pick-dialog-actions">
            <button type="button" className="new-verse-btn pick-cancel" onClick={closePickVerse}>
              Cancel
            </button>
            <button type="submit" className="new-verse-btn pick-submit">
              Show verse
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}

export default App
