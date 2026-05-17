import { trackEvent } from './analytics.js'

const STANDALONE_SESSION_KEY = 'ga_standalone_session_tracked'

/** True when the app is running as an installed PWA (home screen / standalone). */
export function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') return false
  if (window.navigator.standalone === true) return true
  return window.matchMedia('(display-mode: standalone)').matches
}

/**
 * Track PWA install / standalone usage where the platform allows it.
 *
 * - `pwa_install`: Chromium when the user completes Add to Home Screen / Install (appinstalled).
 * - `pwa_standalone_session`: once per browser tab session when opened in standalone mode
 *   (includes iOS after manual install; not the install moment itself).
 */
export function initPwaInstallTracking() {
  if (typeof window === 'undefined') return

  window.addEventListener('appinstalled', () => {
    trackEvent('pwa_install', { method: 'appinstalled' })
  })

  if (isStandaloneDisplayMode() && !sessionStorage.getItem(STANDALONE_SESSION_KEY)) {
    sessionStorage.setItem(STANDALONE_SESSION_KEY, '1')
    trackEvent('pwa_standalone_session')
  }
}
