import raw from './systemFoods.json'
import type { Food } from './models'

export const systemFoods: Food[] = raw.namirnice.map(n => {
  const baseAmount = n.kolicina ?? 100
  const sourceUnit = (n.jedinica ?? '').trim().toLowerCase()
  const unit: Food['unit'] = sourceUnit.includes('ml')
    ? 'ml'
    : /kom|kapsula|kesica|kugla|merica/.test(sourceUnit)
      ? 'piece'
      : /porcija|pakovanje|serv|doza|kašika/.test(sourceUnit) || n.id === 22
        ? 'serving'
        : /gram|\bgr\b|^g$|^kcl$/.test(sourceUnit)
          ? 'g'
          : 'serving'

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
    unit,
    baseGrams: baseAmount,

    // Mark as system food
    user: false
  }
})
