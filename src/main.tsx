import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './mobile.css'
import { AuthGate } from './authGate.tsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(error => console.error('Service worker registration failed', error))
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <AuthGate />
  </StrictMode>,
)
