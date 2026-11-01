import { load, save } from './userData'
import type { Food } from './models'
import { requireSupabase } from '../lib/supabase'
import { calculateFoodForGrams } from './meals'

let usingLocalSystemCatalog = false

export function isUsingLocalSystemCatalog() {
  return usingLocalSystemCatalog
}

export async function getFoods(): Promise<Food[]> {
  const [user, overrides] = await Promise.all([
    load<Food[]>('foods', []),
    load<Food[]>('food_overrides', [])
  ])
  const { data, error } = await requireSupabase()
    .from('system_foods')
    .select('id,name,protein,carbs,fats,calories,grams,unit')
    .order('name')
  // Keep the built-in catalog visible while the SQL seed is being applied or
  // if the app is temporarily offline. Supabase remains the primary source.
  usingLocalSystemCatalog = Boolean(error) || !data?.length

  const overridden = new Map(overrides.map(food => [food.id, food]))
  const system = (usingLocalSystemCatalog
    ? (await import('./systemFoods')).systemFoods
    : (data ?? []).map(row => ({
      ...row,
      protein: Number(row.protein),
      carbs: Number(row.carbs),
      fats: Number(row.fats),
      calories: Number(row.calories),
      grams: Number(row.grams),
      baseGrams: Number(row.grams),
      user: false
    } as Food)))
    .map(food => overridden.get(food.id) ?? food)
  return [...user, ...system]
}

export async function addFood(food: Food) {
  const foods = await load<Food[]>('foods', [])
  await save('foods', [...foods.filter(f => f.id !== food.id), food])
}

export async function deleteFood(id: string) {
  const foods = await load<Food[]>('foods', [])
  await save('foods', foods.filter(f => f.id !== id))
}

export async function updateFood(food: Food) {
  const key = food.id.startsWith('sys-') ? 'food_overrides' : 'foods'
  const current = await load<Food[]>(key, [])
  await save(key, [...current.filter(item => item.id !== food.id), food])

  // Meals store nutrition snapshots. Refresh matching entries so existing meal
  // totals use the edited food while preserving each entry's selected amount.
  const meals = await load<Array<{ id: string; foods: Food[]; [key: string]: unknown }>>('meals', [])
  let changed = false
  const updatedMeals = meals.map(meal => ({
    ...meal,
    foods: meal.foods.map(item => {
      if (item.id !== food.id) return item
      changed = true
      const amount = item.grams
      const base = { ...food, baseGrams: food.grams }
      const calculated = calculateFoodForGrams(base, amount)
      return { ...calculated, grams: amount, mealItemId: (item as Food & { mealItemId?: string }).mealItemId } as Food
    })
  }))
  if (changed) await save('meals', updatedMeals)
}
