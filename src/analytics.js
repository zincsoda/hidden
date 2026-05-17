/** @type {string | undefined} */
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export function isAnalyticsEnabled() {
  return Boolean(MEASUREMENT_ID)
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }
  }
}

/**
 * Load GA4 gtag.js and send the initial page_view. No-op when VITE_GA_MEASUREMENT_ID is unset.
 */
export function initAnalytics() {
  if (!isAnalyticsEnabled()) return

  ensureGtag()
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: true,
    anonymize_ip: true,
  })

  if (document.querySelector(`script[data-ga-id="${MEASUREMENT_ID}"]`)) return

  const script = document.createElement('script')
  script.async = true
  script.dataset.gaId = MEASUREMENT_ID
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`
  document.head.appendChild(script)
}

/**
 * @param {string} name
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export function trackEvent(name, params = {}) {
  if (!isAnalyticsEnabled()) return
  ensureGtag()
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined),
  )
  window.gtag('event', name, cleaned)
}
