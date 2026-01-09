import { useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Foods } from './pages/Foods'
import { GoalsPage } from './pages/Goals'

export default function App() {
  const [tab, setTab] = useState<'dashboard' | 'foods' | 'goals'>('dashboard')

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <h2>Fitness Tracker</h2>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setTab('dashboard')}>Dashboard</button>
        <button onClick={() => setTab('foods')}>Foods</button>
        <button onClick={() => setTab('goals')}>Goals</button>
      </div>

      <hr />

      {tab === 'dashboard' && <Dashboard />}
      {tab === 'foods' && <Foods />}
      {tab === 'goals' && <GoalsPage />}
    </div>
  )
}
