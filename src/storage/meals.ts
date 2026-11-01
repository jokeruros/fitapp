import type { Food } from './models'

export function calculateFoodForGrams<T extends Food>(food: T, grams: number): T {
  const factor = grams / food.grams

  return {
    ...food,
    grams,
    baseGrams: food.baseGrams ?? food.grams,
    calories: food.calories * factor,
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fats: food.fats * factor
  } as T
}

export function calculateMealTotals(foods: Food[]) {
  return foods.reduce(
    (acc, f) => {
      acc.calories += f.calories
      acc.protein += f.protein
      acc.carbs += f.carbs
      acc.fats += f.fats
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )
}
