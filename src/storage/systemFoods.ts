import raw from './systemFoods.json'
import type { Food } from './models'

export const systemFoods: Food[] = raw.namirnice.map(n => {
  const baseAmount = n.kolicina ?? 100

  return {
    id: `sys-${n.id}`,
    name: n.naziv.trim(),

    // Macros per BASE amount
    protein: n.proteini,
    carbs: n.hidrati,
    fats: n.masti,
    calories: n.kalorije,

    // This is the base serving size
    grams: baseAmount,

    // Mark as system food
    user: false
  }
})
