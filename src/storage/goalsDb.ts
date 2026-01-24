import { supabase } from '../lib/supabase'

export interface Goals {
  protein: number
  carbs: number
  fats: number
  calories: number
}

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

/* ------------------ GET GOALS ------------------ */

export async function getGoals(): Promise<Goals> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // ignore "no rows" error
    throw error
  }

  if (!data) {
    // create default row if missing
    const defaultGoals: Goals = {
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0
    }

    await supabase.from('goals').insert({
      user_id: userId,
      ...defaultGoals
    })

    return defaultGoals
  }

  return {
    protein: Number(data.protein),
    carbs: Number(data.carbs),
    fats: Number(data.fats),
    calories: Number(data.calories)
  }
}

/* ------------------ SAVE GOALS ------------------ */

export async function saveGoals(goals: Goals) {
  const userId = await getUserId()

  const { error } = await supabase
    .from('goals')
    .upsert({
      user_id: userId,
      protein: goals.protein,
      carbs: goals.carbs,
      fats: goals.fats,
      calories: goals.calories
    })

  if (error) throw error
}
