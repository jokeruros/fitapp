import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import App from './App'
import { Auth } from './pages/Auth'

export function AuthGate() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) return null

  if (!session) {
    return <Auth onLogin={() => {}} />
  }

  return <App />
}
