export interface Food {
  id: string
  name: string
  protein: number
  carbs: number
  fats: number
  calories: number
  grams: number
  user: boolean
}

export interface Meal {
  id: string
  name: string
  foods: Food[]
  eaten: number
}
