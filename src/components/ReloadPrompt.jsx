import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './ReloadPrompt.css'

// Re-check for a new service worker while the app is open (installed PWA may otherwise wait for the browser's own schedule).
const UPDATE_CHECK_MS = 2 * 60 * 1000

export default function ReloadPrompt() {
  const updateIntervalRef = useRef(null)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegistered(registration) {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
      if (registration && import.meta.env.PROD) {
        updateIntervalRef.current = setInterval(
          () => registration.update(),
          UPDATE_CHECK_MS,
        )
      }
    },
  })

  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [])

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
