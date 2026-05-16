/**
 * True when the app is likely running in Safari (or a WebView) on iPhone / iPad.
 * iPadOS 13+ may report a desktop user agent; we treat Mac + touch as iPad.
 */
export function isIosDevice(nav = typeof navigator !== 'undefined' ? navigator : undefined) {
  if (!nav) return false
  const ua = nav.userAgent ?? ''
  if (/iPad|iPhone|iPod/i.test(ua)) return true
  const platform = nav.platform ?? ''
  if (platform === 'MacIntel' && nav.maxTouchPoints > 1) return true
  return false
}
