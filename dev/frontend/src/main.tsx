import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Appliquer les préférences d'accessibilité sauvegardées dès le démarrage
;(() => {
  try {
    const prefs = JSON.parse(localStorage.getItem('biblitech_accessibility') ?? '{}')
    const root = document.documentElement
    if (prefs.fontSize) {
      root.style.setProperty('--font-size-base',
        prefs.fontSize === 'xlarge' ? '18px' : prefs.fontSize === 'large' ? '16px' : '14px'
      )
    }
    if (prefs.contrast === 'high') root.classList.add('high-contrast')
  } catch {}
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
