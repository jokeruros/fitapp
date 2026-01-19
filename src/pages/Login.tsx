import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) setError(error.message)
    else onSuccess()
  }

  return (
    <div className="auth">
      <h2>Sign in</h2>

      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />

      {error && <div className="error">{error}</div>}

      <button onClick={login}>Login</button>
    </div>
  )
}
