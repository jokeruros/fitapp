import { useEffect, useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Foods } from './pages/Foods'
import { Goals } from './pages/Goals'
import { CalendarDashboard } from './pages/CalendarDashboard'
import { Settings } from './pages/Settings'
import { getPreferences, savePreferences, defaultPreferences, type UserPreferences } from './storage/preferences'
import { languages, translate } from './i18n'
import { supabase } from './lib/supabase'

type Tab = 'dash' | 'foods' | 'goals' | 'calendar' | 'settings'

export default function App({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('dash')
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [accountOpen, setAccountOpen] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    let active = true
    void getPreferences().then(value => { if (active) setPreferences(value) }).catch(() => {})
    void supabase?.auth.getUser().then(({ data }) => { if (active) setEmail(data.user?.email ?? '') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!accountOpen) return
    const close = (event: MouseEvent) => {
      if (event.target instanceof Element && !event.target.closest('.account-menu')) setAccountOpen(false)
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setAccountOpen(false) }
    document.addEventListener('click', close)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', onKey) }
  }, [accountOpen])

  const t = (key: string) => translate(preferences.appLanguage, key)
  const direction = languages.find(language => language.code === preferences.appLanguage)?.dir ?? 'ltr'
  const pages: { id: Tab; label: string }[] = [
    { id: 'dash', label: t('navToday') },
    { id: 'foods', label: t('navFoods') },
    { id: 'goals', label: t('navGoals') },
    { id: 'calendar', label: t('navProgress') }
  ]

  return (
    <div className="app-shell" dir={direction} lang={preferences.appLanguage === 'sr' ? 'sr-Latn' : preferences.appLanguage}>
      <header className="top-bar">
        <button className="brand" onClick={() => setTab('dash')} aria-label="NutriTrack home"><span className="brand-mark">🍃</span> NutriTrack</button>
        <nav className="desktop-nav" aria-label={t('mainNavigation')}>
          {pages.map(page => <button key={page.id} className={`nav-link${tab === page.id ? ' active' : ''}`} onClick={() => setTab(page.id)}>{page.label}</button>)}
        </nav>
        <div className="account-menu">
          <button className="account-trigger" aria-label={t('account')} aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen(open => !open)}>
            <span className="account-avatar" aria-hidden="true">{email ? email[0].toUpperCase() : '👤'}</span>
            <span className="account-trigger-label">{t('account')}</span>
            <span className="account-chevron" aria-hidden="true">⌄</span>
          </button>
          {accountOpen && <div className="account-popover" role="menu">
            {email && <div className="account-identity"><strong>{t('account')}</strong><span title={email}>{email}</span></div>}
            <button role="menuitem" onClick={() => { setTab('settings'); setAccountOpen(false) }}><span aria-hidden="true">⚙</span>{t('accountSettings')}</button>
            <button role="menuitem" className="account-logout" onClick={onLogout}><span aria-hidden="true">↪</span>{t('logout')}</button>
          </div>}
        </div>
      </header>

      <div className="main-content">
        {tab === 'dash' && <Dashboard t={t} foodLanguage={preferences.foodLanguage} language={preferences.appLanguage} />}
        {tab === 'calendar' && <CalendarDashboard t={t} language={preferences.appLanguage} />}
        {tab === 'foods' && <Foods t={t} foodLanguage={preferences.foodLanguage} />}
        {tab === 'goals' && <Goals t={t} />}
        {tab === 'settings' && <Settings preferences={preferences} onChange={setPreferences} onSave={() => savePreferences(preferences)} />}
      </div>
    </div>
  )
}
