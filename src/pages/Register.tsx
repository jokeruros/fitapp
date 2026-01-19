import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Register({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function register() {
    const { error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) setError(error.message)
    else onSuccess()
  }

  return (
    <div className="auth">
      <h2>Create account</h2>

      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />

      {error && <div className="error">{error}</div>}

      <button onClick={register}>Register</button>
    </div>
  )
}
