export const LAST_DISPLAYED_VERSE_KEY = 'random-bible-verse:lastDisplayedVerse'

/** Used only when localStorage has no valid saved verse. */
export const FALLBACK_DISPLAY_VERSE = {
  reference: 'Psalm 119:11',
  text: 'I have hidden your word in my heart that I might not sin against you.',
}

export function readLastDisplayedVerse() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(LAST_DISPLAYED_VERSE_KEY)
    if (!raw) return null
    const o = JSON.parse(raw)
    const reference = String(o?.reference ?? '').trim()
    const text = String(o?.text ?? '').trim()
    if (!reference || !text) return null
    const dateRaw = o?.date
    const date =
      dateRaw != null && String(dateRaw).trim() !== '' ? String(dateRaw).trim() : ''
    const verse = { reference, text }
    if (date) verse.date = date
    return verse
  } catch {
    return null
  }
}

export function writeLastDisplayedVerse(verse) {
  if (typeof localStorage === 'undefined') return
  try {
    const reference = String(verse?.reference ?? '').trim()
    const text = String(verse?.text ?? '').trim()
    if (!reference || !text) return
    const payload = { reference, text }
    const dateRaw = verse?.date
    if (dateRaw != null && String(dateRaw).trim() !== '') {
      payload.date = String(dateRaw).trim()
    }
    localStorage.setItem(LAST_DISPLAYED_VERSE_KEY, JSON.stringify(payload))
  } catch {
    // quota / private mode
  }
}
