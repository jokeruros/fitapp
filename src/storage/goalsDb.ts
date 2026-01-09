import { dbPromise } from './db'

export interface Goals {
  calories: number
  protein: number
  carbs: number
  fats: number
}

const DEFAULT_GOALS: Goals = {
  calories: 2500,
  protein: 150,
  carbs: 300,
  fats: 70
}

export async function getGoals(): Promise<Goals> {
  const db = await dbPromise
  const g = await db.get('settings', 'goals')
  return g ?? DEFAULT_GOALS
}

export async function saveGoals(goals: Goals) {
  const db = await dbPromise
  await db.put('settings', goals, 'goals')
}
