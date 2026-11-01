export interface Food {
  id: string
  name: string
  protein: number
  carbs: number
  fats: number
  calories: number
  grams: number
  unit?: 'g' | 'ml' | 'piece' | 'serving'
  user: boolean
  baseGrams?: number
}

export interface MealFood extends Food {
  mealItemId: string
}

export interface Meal {
  id: string
  name: string
  foods: MealFood[]
  eaten: number
}
