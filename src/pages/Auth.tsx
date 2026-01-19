import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { setCurrentUser } from '../storage/session'

export function Auth({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [registerMode, setRegisterMode] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setErr('')
    setLoading(true)

    try {
      if (registerMode) {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass
        })
        if (error) throw error
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      })
      if (error) throw error

        if (!data.user) {
        throw new Error('No user returned')
      }

      // ✅ persist user
      setCurrentUser(data.user)

      // ✅ notify AuthGate
      window.dispatchEvent(new Event('auth-changed'))

      onLogin()
    } catch (e: any) {
      setErr(e.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{registerMode ? 'Register' : 'Login'}</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={pass}
        onChange={e => setPass(e.target.value)}
      />

      {err && <div style={{ color: 'red' }}>{err}</div>}

      <button onClick={submit} disabled={loading}>
        {loading
          ? 'Please wait...'
          : registerMode
          ? 'Create account'
          : 'Login'}
      </button>

      <button onClick={() => setRegisterMode(x => !x)}>
        {registerMode ? 'Have account? Login' : 'Create account'}
      </button>
    </div>
  )
}
