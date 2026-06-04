import { LAST_DISPLAYED_VERSE_KEY } from './lastDisplayedVerse.js'
import {
  APP_BACKGROUND_STORAGE_KEY,
  STORAGE_KEY as LEGACY_OVERLAY_BACKDROP_KEY,
} from './overlayBackdrop.js'

/** Sheet account slug (same as memory verses list). */
export const ACCOUNT_SLUG = 'ksr'

const API_ORIGIN = 'https://5ecvq3d6ri.execute-api.eu-west-2.amazonaws.com'

export const DELETE_ACCOUNT_URL = import.meta.env.DEV
  ? `/api/account/${ACCOUNT_SLUG}/`
  : `${API_ORIGIN}/api/sheet/account/${ACCOUNT_SLUG}/`

export const DELETE_ACCOUNT_WARNING =
  'This permanently deletes your account and every memory verse stored for it. ' +
  'Saved preferences on this device (text size, background colour, last verse, and similar settings) ' +
  'will also be removed. This cannot be undone.'

const VERSE_FONT_SCALE_KEY = 'verseFontScale'
const DISPLAY_MODE_KEY = 'displayMode'
const PWA_STANDALONE_SESSION_KEY = 'ga_standalone_session_tracked'

/**
 * Remove all app-specific data persisted in the browser for this install.
 */
export function clearLocalAppData() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(LAST_DISPLAYED_VERSE_KEY)
    localStorage.removeItem(VERSE_FONT_SCALE_KEY)
    localStorage.removeItem(APP_BACKGROUND_STORAGE_KEY)
    localStorage.removeItem(LEGACY_OVERLAY_BACKDROP_KEY)
    localStorage.removeItem(DISPLAY_MODE_KEY)
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(PWA_STANDALONE_SESSION_KEY)
  }
}

/**
 * Permanently delete the sheet account and all server-side content.
 * @returns {Promise<void>}
 */
export async function deleteAccount() {
  const res = await fetch(DELETE_ACCOUNT_URL, { method: 'DELETE' })
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = String(body?.Message ?? body?.message ?? '').trim()
    } catch {
      // ignore parse errors
    }
    const suffix = detail ? `: ${detail}` : ''
    throw new Error(`Could not delete account (${res.status})${suffix}`)
  }
}
