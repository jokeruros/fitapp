import { requireSupabase } from '../lib/supabase'
import type { LanguageCode } from '../i18n'

export interface DailyReminderPreferences {
  enabled: boolean
  time: string
  timeZone: string
}

export const defaultDailyReminder: DailyReminderPreferences = {
  enabled: false,
  time: '20:00',
  timeZone: 'UTC'
}

async function currentUser() {
  const client = requireSupabase()
  const { data: { session }, error } = await client.auth.getSession()
  if (error) throw error
  const user = session?.user
  if (!user) throw new Error('Not logged in')
  return { client, user }
}

export async function getDailyReminderPreferences(): Promise<DailyReminderPreferences> {
  const { client, user } = await currentUser()
  const { data, error } = await client.from('daily_reminder_preferences')
    .select('enabled,reminder_time,time_zone')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  return data ? {
    enabled: data.enabled,
    time: String(data.reminder_time).slice(0, 5),
    timeZone: data.time_zone
  } : {
    ...defaultDailyReminder,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }
}

export async function saveDailyReminderPreferences(preferences: DailyReminderPreferences, language: LanguageCode) {
  const { client, user } = await currentUser()
  const { error } = await client.from('daily_reminder_preferences').upsert({
    user_id: user.id,
    enabled: preferences.enabled,
    reminder_time: preferences.time,
    time_zone: preferences.timeZone,
    language,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function savePushSubscription(subscription: PushSubscription) {
  const { client, user } = await currentUser()
  const { error } = await client.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    subscription: subscription.toJSON(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,endpoint' })
  if (error) throw error
}

export async function removePushSubscription(subscription: PushSubscription) {
  const { client, user } = await currentUser()
  const { error } = await client.from('push_subscriptions').delete()
    .eq('user_id', user.id)
    .eq('endpoint', subscription.endpoint)
  if (error) throw error
}
