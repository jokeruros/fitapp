import { useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Foods } from './pages/Foods'
import { Goals } from './pages/Goals'

export default function App() {
  const [tab, setTab] = useState<'dash' | 'foods' | 'goals'>('dash')

  return (
    <>
      <div
  style={{
    paddingBottom: 80,
    height: '100vh',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch'
  }}
>
        {tab === 'dash' && <Dashboard />}
        {tab === 'foods' && <Foods />}
        {tab === 'goals' && <Goals />}
      </div>

      <div className="bottom-nav">
        <button onClick={() => setTab('dash')}>🏠<div>Today</div></button>
        <button onClick={() => setTab('foods')}>🍎<div>Foods</div></button>
        <button onClick={() => setTab('goals')}>🎯<div>Goals</div></button>
      </div>
    </>
  )
}
