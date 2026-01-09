import { useEffect, useState } from 'react'
import { getCurrentUser } from './storage/session'
import App from './App'
import { Auth } from './pages/Auth'

export function AuthGate() {
  const [user, setUser] = useState(getCurrentUser())

  useEffect(() => {
    const refresh = () => setUser(getCurrentUser())
    window.addEventListener('auth-changed', refresh)
    return () => window.removeEventListener('auth-changed', refresh)
  }, [])

  if (!user) return <Auth onLogin={function (): void {
      throw new Error('Function not implemented.')
  } } />

  return <App />
}
