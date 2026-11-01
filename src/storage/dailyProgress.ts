import { requireSupabase } from '../lib/supabase'

export interface ProgressValues {
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface DailyProgress {
  date: string
  savedAt: string
  goals: ProgressValues
  achieved: ProgressValues
}

export function getDailyProgress() {
  return listDailyProgress()
}

async function currentUserId() {
  const client = requireSupabase()
  const { data: { user }, error } = await client.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Not logged in')
  return { client, userId: user.id }
}

export async function listDailyProgress(): Promise<DailyProgress[]> {
  const { client, userId } = await currentUserId()
  const { data, error } = await client
    .from('daily_progress')
    .select('date,saved_at,goals,achieved')
    .eq('user_id', userId)
    .order('date', { ascending: true })
  if (error) throw error
  return (data ?? []).map(row => ({
    date: row.date,
    savedAt: row.saved_at,
    goals: row.goals as ProgressValues,
    achieved: row.achieved as ProgressValues
  }))
}

export async function saveDailyProgress(snapshot: DailyProgress) {
  const { client, userId } = await currentUserId()
  const { error } = await client.from('daily_progress').upsert({
    user_id: userId,
    date: snapshot.date,
    saved_at: snapshot.savedAt,
    goals: snapshot.goals,
    achieved: snapshot.achieved
  }, { onConflict: 'user_id,date' })
  if (error) throw error
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
