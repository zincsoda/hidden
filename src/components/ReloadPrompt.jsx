import { useCallback, useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './ReloadPrompt.css'

// Re-check for a new service worker while the app is open (installed PWA may otherwise wait for the browser's own schedule).
const UPDATE_CHECK_MS = 2 * 60 * 1000
// Workbox "controlling" reload is unreliable in standalone iOS PWAs; force reload if nothing takes over.
const RELOAD_FALLBACK_MS = 2500

export default function ReloadPrompt() {
  const updateIntervalRef = useRef(null)
  const applyingUpdateRef = useRef(false)
  const [reloading, setReloading] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onNeedReload() {
      applyingUpdateRef.current = false
      setNeedRefresh(false)
      window.location.reload()
    },
    onNeedRefresh() {
      if (applyingUpdateRef.current) {
        setNeedRefresh(false)
      }
    },
    onRegistered(registration) {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
      if (registration && import.meta.env.PROD && !applyingUpdateRef.current) {
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

  const applyUpdate = useCallback(async () => {
    if (applyingUpdateRef.current) return
    applyingUpdateRef.current = true
    setReloading(true)
    setNeedRefresh(false)

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    const fallbackTimer = window.setTimeout(() => {
      window.location.reload()
    }, RELOAD_FALLBACK_MS)

    const onControllerChange = () => {
      window.clearTimeout(fallbackTimer)
      window.location.reload()
    }
    navigator.serviceWorker?.addEventListener(
      'controllerchange',
      onControllerChange,
      { once: true },
    )

    try {
      await updateServiceWorker(true)
    } catch {
      applyingUpdateRef.current = false
      setReloading(false)
      setNeedRefresh(true)
      window.clearTimeout(fallbackTimer)
      navigator.serviceWorker?.removeEventListener(
        'controllerchange',
        onControllerChange,
      )
    }
  }, [setNeedRefresh, updateServiceWorker])

  if (!needRefresh && !reloading) {
    return null
  }

  return (
    <div className="reload-prompt" role="status" aria-live="polite">
      <span className="reload-prompt__message">
        {reloading ? 'Updating…' : 'New update available!'}
      </span>
      <button
        type="button"
        className="reload-prompt__btn"
        disabled={reloading}
        onClick={() => void applyUpdate()}
      >
        Reload
      </button>
    </div>
  )
}
