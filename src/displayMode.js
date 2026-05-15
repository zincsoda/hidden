const STORAGE_KEY = 'displayMode'
const LARGE_MIN_LONG = 1600
const LARGE_MIN_SHORT = 800
const VIEWPORT_MEDIA = '(min-width: 1600px) and (min-height: 800px)'

/** Large physical screen but a compact layout viewport (e.g. phone mirrored to a TV). */
export function isMirroredOrExternalLargeScreen() {
  if (typeof window === 'undefined') return false

  const screenLong = Math.max(window.screen.width, window.screen.height)
  const screenShort = Math.min(window.screen.width, window.screen.height)
  const viewLong = Math.max(window.innerWidth, window.innerHeight)
  const viewShort = Math.min(window.innerWidth, window.innerHeight)

  const screenIsLarge = screenLong >= LARGE_MIN_LONG && screenShort >= LARGE_MIN_SHORT
  const viewportIsCompact = viewLong < LARGE_MIN_LONG || viewShort < LARGE_MIN_SHORT

  if (screenIsLarge && viewportIsCompact) return true

  // Viewport much smaller than reported screen (mirroring, or a small window on a big monitor).
  if (screenLong >= 1200 && viewLong <= screenLong * 0.6) return true

  return false
}

export function shouldUseLargeDisplay() {
  if (typeof window === 'undefined') return false

  const preference = localStorage.getItem(STORAGE_KEY)
  if (preference === 'large') return true
  if (preference === 'normal') return false

  if (window.matchMedia(VIEWPORT_MEDIA).matches) return true

  return isMirroredOrExternalLargeScreen()
}

/** vmin tied to the layout viewport; on a mirrored phone that stays small — use screen size instead. */
export function syncLargeDisplayMetrics() {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const mirrored = isMirroredOrExternalLargeScreen()
  if (mirrored) {
    const screenMin = Math.min(window.screen.width, window.screen.height)
    root.style.setProperty('--display-vmin', `${screenMin / 100}px`)
  } else {
    root.style.removeProperty('--display-vmin')
  }
}

export function applyLargeDisplayClass() {
  if (typeof document === 'undefined') return shouldUseLargeDisplay()
  const enabled = shouldUseLargeDisplay()
  const root = document.documentElement
  root.classList.toggle('is-large-display', enabled)
  if (enabled) {
    syncLargeDisplayMetrics()
  } else {
    root.style.removeProperty('--display-vmin')
  }
  return enabled
}

export function setDisplayModePreference(mode) {
  if (mode === 'large' || mode === 'normal') {
    localStorage.setItem(STORAGE_KEY, mode)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
  return applyLargeDisplayClass()
}

export function readDisplayModeFromUrl() {
  if (typeof window === 'undefined') return
  const value = new URLSearchParams(window.location.search).get('display')
  if (value === 'large' || value === 'normal') {
    setDisplayModePreference(value)
  }
}

export function subscribeLargeDisplay(onChange) {
  const mq = window.matchMedia(VIEWPORT_MEDIA)
  const update = () => onChange(applyLargeDisplayClass())

  mq.addEventListener('change', update)
  window.addEventListener('resize', update)
  window.addEventListener('orientationchange', update)

  return () => {
    mq.removeEventListener('change', update)
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', update)
  }
}
