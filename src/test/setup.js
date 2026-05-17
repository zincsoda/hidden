import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom does not implement mailto navigation; the deferred failure can surface during later tests.
document.addEventListener(
  'click',
  (e) => {
    const el = e.target
    if (!(el instanceof Element)) return
    const mail = el.closest('a[href^="mailto:"]')
    if (mail) e.preventDefault()
  },
  true,
)

// Node can inject a partial global `localStorage` (e.g. invalid --localstorage-file) that lacks `clear`.
if (
  typeof globalThis.localStorage !== 'undefined' &&
  typeof globalThis.localStorage.clear !== 'function'
) {
  const memory = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      get length() {
        return memory.size
      },
      clear() {
        memory.clear()
      },
      getItem(key) {
        return memory.get(String(key)) ?? null
      },
      setItem(key, value) {
        memory.set(String(key), String(value))
      },
      removeItem(key) {
        memory.delete(String(key))
      },
      key(index) {
        return [...memory.keys()][Number(index)] ?? null
      },
    },
    configurable: true,
    writable: true,
  })
}

// jsdom exposes <dialog> but not showModal()/close(); App relies on modal dialog behaviour for pick-a-verse UX.
const proto = typeof HTMLDialogElement !== 'undefined' ? HTMLDialogElement.prototype : undefined
if (proto && typeof proto.showModal !== 'function') {
  proto.showModal = function showModalPolyfill() {
    this.setAttribute('open', '')
  }
}
if (proto && typeof proto.close !== 'function') {
  proto.close = function closePolyfill() {
    const wasOpen = this.hasAttribute('open')
    this.removeAttribute('open')
    if (wasOpen) {
      this.dispatchEvent(new Event('close'))
    }
  }
}

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))
