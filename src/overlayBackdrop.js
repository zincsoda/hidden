export const STORAGE_KEY = 'controlsOverlayBackdrop'

export const OVERLAY_BACKDROP_OPTIONS = [
  { id: 'black', label: 'Black', value: 'rgb(0, 0, 0)' },
  { id: 'page_green', label: 'Page green', value: '#082818' },
  { id: 'slate_blue', label: 'Slate blue', value: '#0f172a' },
  { id: 'deep_wine', label: 'Wine', value: '#1a0f14' },
]

export const DEFAULT_OVERLAY_BACKDROP_INDEX = 0

/** Default backdrop (opaque black); kept for callers that expect this name. */
export const CONTROLS_OVERLAY_BACKDROP = OVERLAY_BACKDROP_OPTIONS[DEFAULT_OVERLAY_BACKDROP_INDEX].value

export function overlayBackdropCssAt(index) {
  const clamped = Math.max(0, Math.min(OVERLAY_BACKDROP_OPTIONS.length - 1, index))
  return OVERLAY_BACKDROP_OPTIONS[clamped].value
}

export function readOverlayBackdropIndex() {
  if (typeof localStorage === 'undefined') return DEFAULT_OVERLAY_BACKDROP_INDEX

  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return DEFAULT_OVERLAY_BACKDROP_INDEX

  const idx = Number.parseInt(raw, 10)
  if (!Number.isFinite(idx) || idx < 0 || idx >= OVERLAY_BACKDROP_OPTIONS.length) {
    return DEFAULT_OVERLAY_BACKDROP_INDEX
  }
  return idx
}

export function persistOverlayBackdropIndex(index) {
  const clamped = Math.max(0, Math.min(OVERLAY_BACKDROP_OPTIONS.length - 1, index))
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(clamped))
  }
  return clamped
}
