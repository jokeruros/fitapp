import { supabase } from '../lib/supabase'
import type { Meal } from './models'
import { v4 as uuid } from 'uuid'

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

/* ---------------- GET MEALS ---------------- */

export async function getMeals(): Promise<Meal[]> {
  const userId = await getUserId()

  const { data: mealsData, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!mealsData) return []

  const mealIds = mealsData.map(m => m.id)
  if (mealIds.length === 0) return []

  const { data: itemsData, error: itemsError } = await supabase
    .from('meal_items')
    .select('id, meal_id, food_id, grams')
    .in('meal_id', mealIds)

  if (itemsError) throw itemsError

  const meals: Meal[] = mealsData.map(meal => ({
    id: meal.id,
    name: meal.name,
    eaten: meal.eaten,
    foods:
      itemsData
        ?.filter(i => i.meal_id === meal.id)
        .map(i => ({
          id: i.id,
          food_id: i.food_id,
          grams: Number(i.grams)
        })) || []
  }))

  return meals
}

/* ---------------- SAVE MEALS ---------------- */

export async function saveMeals(meals: Meal[]) {
  const userId = await getUserId()

  // Get existing meals
  const { data: existingMeals } = await supabase
    .from('meals')
    .select('id')
    .eq('user_id', userId)

  const existingIds = existingMeals?.map(m => m.id) || []
  const incomingIds = meals.map(m => m.id)

  // Delete removed meals (meal_items should cascade delete)
  const toDelete = existingIds.filter(id => !incomingIds.includes(id))
  if (toDelete.length) {
    await supabase.from('meals').delete().in('id', toDelete)
  }

  for (const meal of meals) {
    // Upsert meal
    await supabase.from('meals').upsert({
      id: meal.id,
      user_id: userId,
      name: meal.name,
      eaten: meal.eaten
    })

    // Get existing meal_items
    const { data: existingItems } = await supabase
      .from('meal_items')
      .select('id')
      .eq('meal_id', meal.id)

    const existingItemIds = existingItems?.map(i => i.id) || []
    const incomingItemIds = meal.foods.map(f => f.id)

    // Delete removed items
    const itemsToDelete = existingItemIds.filter(
      id => !incomingItemIds.includes(id)
    )

    if (itemsToDelete.length) {
      await supabase.from('meal_items').delete().in('id', itemsToDelete)
    }

    // Upsert meal items
    for (const food of meal.foods) {
      await supabase.from('meal_items').upsert({
        id: food.id || uuid(),
        meal_id: meal.id,
        food_id: food.food_id,
        grams: food.grams
      })
    }
  }
}
