import { load, save } from './userData'
import type { Food } from './models'
import { systemFoods } from './systemFoods'

export async function getFoods(): Promise<Food[]> {
  const user = await load<Food[]>('foods', [])
  return [...user, ...systemFoods]
}

export async function addFood(food: Food) {
  const foods = await load<Food[]>('foods', [])
  await save('foods', [...foods.filter(f => f.id !== food.id), food])
}

export async function deleteFood(id: string) {
  const foods = await load<Food[]>('foods', [])
  await save('foods', foods.filter(f => f.id !== id))
}
