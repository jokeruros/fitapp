import type { Meal } from './models'
import { load, save } from './userData'

export function getMeals() {
  return load<Meal[]>('meals', [])
}

export function saveMeals(meals: Meal[]) {
  return save('meals', meals)
}
