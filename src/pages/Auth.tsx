import { useState } from 'react'
import { login, register } from '../storage/usersDb'
import { setCurrentUser } from '../storage/session'

export function Auth({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [registerMode, setRegisterMode] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    try {
      if (registerMode) await register(email, pass)
      const user = await login(email, pass)
      setCurrentUser(user)
      onLogin()
    } catch (e: any) {
      setErr(e.message)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{registerMode ? 'Register' : 'Login'}</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} />
      {err && <div style={{ color: 'red' }}>{err}</div>}
      <button onClick={submit}>{registerMode ? 'Create account' : 'Login'}</button>
      <button onClick={() => setRegisterMode(x => !x)}>
        {registerMode ? 'Have account? Login' : 'Create account'}
      </button>
    </div>
  )
}
