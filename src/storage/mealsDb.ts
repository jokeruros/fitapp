import { dbPromise } from './db'
import type { Meal } from './models'

export async function getMeals(): Promise<Meal[]> {
  const db = await dbPromise
  return await db.getAll('meals')
}

export async function saveMeal(meal: Meal) {
  const db = await dbPromise
  await db.put('meals', meal)
}

export async function saveMeals(meals: Meal[]) {
  const db = await dbPromise
  const tx = db.transaction('meals', 'readwrite')
  await tx.store.clear()
  for (const meal of meals) {
    tx.store.put(meal)
  }
  await tx.done
}

export async function deleteMeal(id: string) {
  const db = await dbPromise
  await db.delete('meals', id)
}
