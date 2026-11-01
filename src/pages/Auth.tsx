import { useState, type FormEvent } from 'react'
import { languages, translate, translateAuth, translateAuthError, type LanguageCode } from '../i18n'
import { requireSupabase } from '../lib/supabase'

export function Auth({ language, onLanguageChange }: {
  language: LanguageCode
  onLanguageChange: (language: LanguageCode) => void
}) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [registerMode, setRegisterMode] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const t = (key: string) => translate(language, key)
  const direction = languages.find(item => item.code === language)?.dir ?? 'ltr'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErr('')
    setNotice('')
    setLoading(true)

    try {
      const client = requireSupabase()
      if (registerMode) {
        const { data, error } = await client.auth.signUp({ email: email.trim(), password: pass })
        if (error) throw error
        if (!data.session) setNotice(translateAuth(language, 'confirmEmail'))
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password: pass })
        if (error) throw error
      }
    } catch (cause: unknown) {
      setErr(translateAuthError(language, cause instanceof Error ? cause.message : ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page" lang={language === 'sr' ? 'sr-Latn' : language} dir={direction}>
      <section className="auth-card">
        <div className="auth-brand"><span>🍃</span> NutriTrack</div>
        <label className="auth-language">
          <span>{t('appLanguage')}</span>
          <select value={language} onChange={event => onLanguageChange(event.target.value as LanguageCode)}>
            {languages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
        </label>
        <p className="auth-eyebrow">{t('authWelcome')}</p>
        <h1>{registerMode ? t('register') : t('login')}</h1>
        <p className="auth-description">{t('authDescription')}</p>
        <form className="auth-form" onSubmit={submit}>
          <label>{t('email')}<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
          <label>{t('password')}<input type="password" autoComplete={registerMode ? 'new-password' : 'current-password'} value={pass} onChange={event => setPass(event.target.value)} required /></label>
          {err && <div className="auth-error" role="alert">{err}</div>}
          {notice && <div className="auth-notice" role="status">{notice}</div>}
          <button className="auth-primary" type="submit" disabled={loading}>
            {loading ? t('pleaseWait') : registerMode ? t('register') : t('login')}
          </button>
          <button className="auth-secondary" type="button" disabled={loading} onClick={() => {
            setRegisterMode(mode => !mode)
            setErr('')
            setNotice('')
          }}>
            {registerMode ? t('haveAccount') : t('noAccount')}
          </button>
        </form>
      </section>
    </main>
  )
}
