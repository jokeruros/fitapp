import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import App from './App'
import { Auth } from './pages/Auth'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { migrateLocalDataToSupabase } from './storage/userData'
import { getCachedAppLanguage, setCachedAppLanguage } from './storage/preferences'
import type { LanguageCode } from './i18n'

export function AuthGate() {
  const client = supabase
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [dataReadyUserId, setDataReadyUserId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loginLanguage, setLoginLanguage] = useState<LanguageCode>(getCachedAppLanguage)

  useEffect(() => {
    if (!supabase) return

    let active = true
    const client = supabase
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) setError(sessionError.message)
      setSession(data.session)
      setAuthReady(true)
    }).catch((cause: unknown) => {
      if (!active) return
      setError(cause instanceof Error ? cause.message : 'Could not read the Supabase session.')
      setAuthReady(true)
    })

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
      setError('')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!authReady || !session) return

    let active = true
    migrateLocalDataToSupabase(session.user.id, session.user.email)
      .then(() => { if (active) setError('') })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not sync local data to Supabase.')
      })
      .finally(() => { if (active) setDataReadyUserId(session.user.id) })

    return () => { active = false }
  }, [authReady, session])

  if (!isSupabaseConfigured || !client) {
    return <main className="auth-page"><section className="auth-card">
      <div className="auth-brand"><span>🍃</span> NutriTrack</div>
      <h1>Supabase setup required</h1>
      <p className="auth-description">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart the app.</p>
    </section></main>
  }

  const dataReady = !session || dataReadyUserId === session.user.id
  if (!authReady || !dataReady) return <main className="auth-loading">Connecting to your account…</main>
  if (error) return <main className="auth-page"><section className="auth-card">
    <div className="auth-brand"><span>🍃</span> NutriTrack</div>
    <h1>Could not connect</h1>
    <p className="auth-error" role="alert">{error}</p>
  </section></main>
  if (!session) return <Auth language={loginLanguage} onLanguageChange={language => {
    setLoginLanguage(language)
    setCachedAppLanguage(language)
  }} />

  return <App onLogout={() => { void client.auth.signOut() }} />
}
