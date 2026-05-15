import { useRegisterSW } from 'virtual:pwa-register/react'
import './ReloadPrompt.css'

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) {
    return null
  }

  return (
    <div className="reload-prompt" role="status" aria-live="polite">
      <span className="reload-prompt__message">New update available!</span>
      <button
        type="button"
        className="reload-prompt__btn"
        onClick={() => updateServiceWorker(true)}
      >
        Reload
      </button>
    </div>
  )
}
