export interface Food {
  id: string
  name: string
  protein: number     // per 100g
  carbs: number       // per 100g
  fats: number        // per 100g
  calories: number    // per 100g
  grams: number       // default display amount (100)
  user: boolean
}

export interface MealFood {
  id: string        // meal_item row id
  food_id: string   // reference to foods table
  grams: number     // how many grams eaten
}

export interface Meal {
  id: string
  name: string
  eaten: number
  foods: MealFood[]
}
