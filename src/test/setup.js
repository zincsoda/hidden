import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

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
