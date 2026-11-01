import { requireSupabase } from '../lib/supabase'
import { dbPromise } from './db'

const legacyKeys = ['foods', 'goals', 'meals'] as const

export async function load<T>(name: string, def: T): Promise<T> {
  const client = requireSupabase()
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError) throw userError
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
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError) throw userError
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
  for (const dataKey of legacyKeys) {
    const value = await db.get('data', `${dataKey}:${email}`)
    if (value === undefined) continue

    const { data, error: lookupError } = await client
      .from('user_data')
      .select('data_key')
      .eq('user_id', userId)
      .eq('data_key', dataKey)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (data) continue

    const { error: writeError } = await client.from('user_data').upsert({
      user_id: userId,
      data_key: dataKey,
      value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,data_key', ignoreDuplicates: true })
    if (writeError) throw writeError
  }

  localStorage.setItem(marker, '1')
}
