import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobile.css'
import { AuthGate } from './authGate.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <AuthGate />
  </StrictMode>,
)
