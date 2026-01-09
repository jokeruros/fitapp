import { useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Foods } from './pages/Foods'
import { Goals } from './pages/Goals'
import { Auth } from './pages/Auth'
import { getCurrentUser, logout } from './storage/session'

export default function App() {
  const [user, setUser] = useState(getCurrentUser())
  const [tab, setTab] = useState<'dash' | 'foods' | 'goals'>('dash')

  if (!user) return <Auth onLogin={() => setUser(getCurrentUser())} />

  return (
    <>
      <div style={{ paddingBottom: 80 }}>
        <button onClick={() => { logout(); setUser(null) }}>Logout</button>

        {tab === 'dash' && <Dashboard />}
        {tab === 'foods' && <Foods />}
        {tab === 'goals' && <Goals />}
      </div>

      <div className="bottom-nav">
        <button onClick={() => setTab('dash')}>🏠</button>
        <button onClick={() => setTab('foods')}>🍎</button>
        <button onClick={() => setTab('goals')}>🎯</button>
      </div>
    </>
  )
}
