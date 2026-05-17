import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/source-sans-3/500.css'
import '@fontsource/source-sans-3/600.css'
import './index.css'
import App from './App.jsx'
import {
  applyLargeDisplayClass,
  readDisplayModeFromUrl,
  subscribeLargeDisplay,
} from './displayMode.js'
import { applyVerseFontScale } from './verseFontSize.js'
import { initAnalytics } from './analytics.js'
import { initPwaInstallTracking } from './pwaInstallTracking.js'

initAnalytics()
initPwaInstallTracking()
readDisplayModeFromUrl()
applyLargeDisplayClass()
applyVerseFontScale()
subscribeLargeDisplay(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
