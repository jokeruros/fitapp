import { requireSupabase } from '../lib/supabase'
import { dbPromise } from './db'

const legacyKeys = ['foods', 'goals', 'meals'] as const

export async function load<T>(name: string, def: T): Promise<T> {
  const client = requireSupabase()
  const { data: { session }, error: userError } = await client.auth.getSession()
  if (userError) throw userError
  const user = session?.user
  if (!user) throw new Error('Not logged in')

  const { data, error } = await client
    .from('user_data')
    .select('value')
    .eq('user_id', user.id)
    .eq('data_key', name)
    .maybeSingle()
  if (error) throw error
  return data ? (data.value as T) : def
}

export async function save<T>(name: string, value: T) {
  const client = requireSupabase()
  const { data: { session }, error: userError } = await client.auth.getSession()
  if (userError) throw userError
  const user = session?.user
  if (!user) throw new Error('Not logged in')

  const { error } = await client.from('user_data').upsert({
    user_id: user.id,
    data_key: name,
    value,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,data_key' })
  if (error) throw error
}

export async function migrateLocalDataToSupabase(userId: string, email?: string) {
  if (!email) return

  const marker = `supabase-local-data-migrated:${userId}`
  if (localStorage.getItem(marker)) return

  const client = requireSupabase()
  const db = await dbPromise
  const legacyEntries = (await Promise.all(legacyKeys.map(async dataKey => ({
    dataKey,
    value: await db.get('data', `${dataKey}:${email}`)
  })))).filter(entry => entry.value !== undefined)

  if (legacyEntries.length) {
    const { data, error: lookupError } = await client
      .from('user_data')
      .select('data_key')
      .eq('user_id', userId)
      .in('data_key', legacyEntries.map(entry => entry.dataKey))
    if (lookupError) throw lookupError
    const existing = new Set((data ?? []).map(entry => entry.data_key))
    const missing = legacyEntries.filter(entry => !existing.has(entry.dataKey))
    const writes = await Promise.all(missing.map(entry => client.from('user_data').upsert({
      user_id: userId,
      data_key: entry.dataKey,
      value: entry.value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,data_key', ignoreDuplicates: true })))
    const writeError = writes.find(result => result.error)?.error
    if (writeError) throw writeError
  }

  localStorage.setItem(marker, '1')
}
