/** Legacy key when only the reading menu backdrop was persisted (not the page). */
export const STORAGE_KEY = 'controlsOverlayBackdrop'

/** Current key: one index drives the main view background and the reading menu overlay. */
export const APP_BACKGROUND_STORAGE_KEY = 'appBackground'

export const OVERLAY_BACKDROP_OPTIONS = [
  { id: 'black', label: 'Black', value: 'rgb(0, 0, 0)' },
  { id: 'page_green', label: 'Page green', value: '#082818' },
  { id: 'slate_blue', label: 'Slate blue', value: '#0f172a' },
  { id: 'deep_wine', label: 'Wine', value: '#1a0f14' },
]

/** Matches the built-in page chrome colour in index.css (first paint before React runs). */
export const DEFAULT_APP_BACKGROUND_INDEX = 1

export const DEFAULT_OVERLAY_BACKDROP_INDEX = DEFAULT_APP_BACKGROUND_INDEX

/** Default solid background; kept for tests and callers that expect this export name. */
export const CONTROLS_OVERLAY_BACKDROP =
  OVERLAY_BACKDROP_OPTIONS[DEFAULT_APP_BACKGROUND_INDEX].value

export function overlayBackdropCssAt(index) {
  const clamped = Math.max(0, Math.min(OVERLAY_BACKDROP_OPTIONS.length - 1, index))
  return OVERLAY_BACKDROP_OPTIONS[clamped].value
}

function clampBackgroundIndex(index) {
  return Math.max(0, Math.min(OVERLAY_BACKDROP_OPTIONS.length - 1, index))
}

function parseStoredIndex(raw) {
  const idx = Number.parseInt(raw, 10)
  if (!Number.isFinite(idx) || idx < 0 || idx >= OVERLAY_BACKDROP_OPTIONS.length) {
    return null
  }
  return idx
}

/**
 * Reads the persisted main/menu background index. Prefers `appBackground`; otherwise
 * migrates from legacy `controlsOverlayBackdrop` except when that was the old default
 * black (0), so the main view stays page-green for those users.
 */
export function readAppBackgroundIndex() {
  if (typeof localStorage === 'undefined') return DEFAULT_APP_BACKGROUND_INDEX

  const rawNew = localStorage.getItem(APP_BACKGROUND_STORAGE_KEY)
  if (rawNew !== null) {
    const parsed = parseStoredIndex(rawNew)
    return parsed === null ? DEFAULT_APP_BACKGROUND_INDEX : parsed
  }

  const rawLegacy = localStorage.getItem(STORAGE_KEY)
  if (rawLegacy !== null && rawLegacy !== '0') {
    const parsed = parseStoredIndex(rawLegacy)
    if (parsed !== null) return parsed
  }

  return DEFAULT_APP_BACKGROUND_INDEX
}

export function persistAppBackgroundIndex(index) {
  const clamped = clampBackgroundIndex(index)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(APP_BACKGROUND_STORAGE_KEY, String(clamped))
    localStorage.removeItem(STORAGE_KEY)
  }
  return clamped
}

export function readOverlayBackdropIndex() {
  return readAppBackgroundIndex()
}

export function persistOverlayBackdropIndex(index) {
  return persistAppBackgroundIndex(index)
}
