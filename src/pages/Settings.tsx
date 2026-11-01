import { useEffect, useState } from 'react'
import { languages, translate, translateReminder, type LanguageCode } from '../i18n'
import type { UserPreferences } from '../storage/preferences'
import { defaultDailyReminder, getDailyReminderPreferences, removePushSubscription, saveDailyReminderPreferences, savePushSubscription, type DailyReminderPreferences } from '../storage/reminders'

const publicPushKey = (import.meta.env as unknown as Record<string, string | undefined>).VITE_WEB_PUSH_PUBLIC_KEY

function decodePublicKey(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  return Uint8Array.from(atob(padded), character => character.charCodeAt(0))
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandaloneApp() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

export function Settings({
  preferences,
  onChange,
  onSave
}: {
  preferences: UserPreferences
  onChange: (preferences: UserPreferences) => void
  onSave: () => Promise<void>
}) {
  const t = (key: string) => translate(preferences.appLanguage, key)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [reminder, setReminder] = useState<DailyReminderPreferences>(defaultDailyReminder)
  const [reminderLoading, setReminderLoading] = useState(true)
  const [reminderSaving, setReminderSaving] = useState(false)
  const [reminderStatus, setReminderStatus] = useState('')

  useEffect(() => {
    let active = true
    void getDailyReminderPreferences().then(value => {
      if (active) setReminder(value)
    }).catch(() => {
      if (active) setReminderStatus(translateReminder(preferences.appLanguage, 'loadError'))
    }).finally(() => {
      if (active) setReminderLoading(false)
    })
    return () => { active = false }
  }, [preferences.appLanguage])

  async function save() {
    setSaving(true)
    setStatus('')
    try {
      await onSave()
      setStatus(t('settingsSaved'))
    } catch {
      setStatus(t('settingsError'))
    } finally {
      setSaving(false)
    }
  }

  async function saveReminder() {
    setReminderSaving(true)
    setReminderStatus('')
    try {
      const next = {
        ...reminder,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || reminder.timeZone || 'UTC'
      }

      if (next.enabled) {
        if (!window.isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
          setReminderStatus(translateReminder(preferences.appLanguage, 'unsupported'))
          return
        }
        if (isIosDevice() && !isStandaloneApp()) {
          setReminderStatus(translateReminder(preferences.appLanguage, 'iosInstall'))
          return
        }
        if (!publicPushKey) throw new Error('Push notifications are not configured in the web app')

        const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
        if (permission !== 'granted') {
          setReminderStatus(translateReminder(preferences.appLanguage, 'permissionDenied'))
          return
        }

        const registration = await navigator.serviceWorker.register('/sw.js')
        const readyRegistration = await navigator.serviceWorker.ready
        const pushManager = readyRegistration.pushManager ?? registration.pushManager
        let subscription = await pushManager.getSubscription()
        if (!subscription) {
          subscription = await pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodePublicKey(publicPushKey)
          })
        }
        await savePushSubscription(subscription)
      }

      await saveDailyReminderPreferences(next, preferences.appLanguage)
      if (!next.enabled && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        const subscription = await registration?.pushManager.getSubscription()
        if (subscription) {
          await removePushSubscription(subscription)
          await subscription.unsubscribe()
        }
      }
      setReminder(next)
      setReminderStatus(translateReminder(preferences.appLanguage, 'saved'))
    } catch (error) {
      console.error('Unable to save daily reminder', error)
      setReminderStatus(translateReminder(preferences.appLanguage, 'error'))
    } finally {
      setReminderSaving(false)
    }
  }

  return (
    <main className="settings-page">
      <p className="calendar-eyebrow">{t('preferencesLabel')}</p>
      <h1>{t('navSettings')}</h1>
      <p className="settings-description">{t('settingsDescription')}</p>

      <section className="settings-card">
        <label className="settings-field">
          <span>{t('appLanguageQuestion')}</span>
          <select
            value={preferences.appLanguage}
            onChange={event => onChange({ ...preferences, appLanguage: event.target.value as LanguageCode })}
          >
            {languages.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}
          </select>
        </label>

        <label className="settings-field">
          <span>{t('foodLanguageQuestion')}</span>
          <select
            value={preferences.foodLanguage}
            onChange={event => onChange({ ...preferences, foodLanguage: event.target.value as LanguageCode })}
          >
            {languages.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}
          </select>
        </label>

        <p className="settings-hint">{t('foodLanguageNote')}</p>
        <button className="save-progress-button" disabled={saving} onClick={() => void save()}>
          {saving ? t('saving') : t('saveSettings')}
        </button>
        {status && <p className="settings-status" role="status" aria-live="polite">{status}</p>}
      </section>

      <section className="settings-card reminder-settings-card">
        <h2>{translateReminder(preferences.appLanguage, 'title')}</h2>
        <p className="settings-hint">{translateReminder(preferences.appLanguage, 'description')}</p>
        <label className="reminder-toggle">
          <input
            type="checkbox"
            checked={reminder.enabled}
            disabled={reminderLoading || reminderSaving}
            onChange={event => setReminder(current => ({ ...current, enabled: event.target.checked }))}
          />
          <span>{translateReminder(preferences.appLanguage, 'enabled')}</span>
        </label>
        <label className="settings-field reminder-time-field">
          <span>{translateReminder(preferences.appLanguage, 'time')}</span>
          <input type="time" value={reminder.time} disabled={reminderLoading || reminderSaving} onChange={event => setReminder(current => ({ ...current, time: event.target.value }))} />
        </label>
        <p className="settings-hint">{translateReminder(preferences.appLanguage, 'iosInstall')}</p>
        <button className="save-progress-button" disabled={reminderLoading || reminderSaving} onClick={() => void saveReminder()}>
          {reminderSaving ? translateReminder(preferences.appLanguage, 'saving') : translateReminder(preferences.appLanguage, 'save')}
        </button>
        {reminderStatus && <p className="settings-status" role="status" aria-live="polite">{reminderStatus}</p>}
      </section>
    </main>
  )
}
