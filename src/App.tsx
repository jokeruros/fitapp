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
      {/* TOP BAR */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 52,
          background: '#0f172a',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          zIndex: 50
        }}
      >
        <div style={{ fontWeight: 700 }}>Fit Tracker</div>

        <button
          onClick={logout}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: 8
          }}
        >
          Log out
        </button>
      </div>

      

      <div style={{ paddingTop: 52, paddingBottom: 80 }}>
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
