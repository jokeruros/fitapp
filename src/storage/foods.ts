import { dbPromise } from './db'
import type { Food } from './models'
import { systemFoods } from './systemFoods'

export async function getFoods(): Promise<Food[]> {
  const db = await dbPromise
  const userFoods = await db.getAll('foods')

  // User foods FIRST, system foods AFTER
  return [...userFoods, ...systemFoods]
}

export async function addFood(food: Food) {
  const db = await dbPromise
  await db.put('foods', food)
}

export async function deleteFood(id: string) {
  const db = await dbPromise
  await db.delete('foods', id)
}
