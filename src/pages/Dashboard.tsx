import { useEffect, useState } from 'react'
import type { Meal } from '../storage/models'
import { MealCard } from '../components/MealCard'
import { AddMeal } from '../components/AddMeal'
import { getMeals, saveMeals } from '../storage/mealsDb'
import { getGoals, type Goals } from '../storage/goalsDb'
import { Ring } from '../components/Ring'

export function Dashboard() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [adding, setAdding] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const [goals, setGoals] = useState<Goals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  })

  const calorieGoal =
    goals.protein * 4 +
    goals.carbs * 4 +
    goals.fats * 9

  useEffect(() => {
    getGoals().then(setGoals)
  }, [])

  useEffect(() => {
    getMeals().then(ms => {
      setMeals(ms)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    saveMeals(meals)
  }, [meals, loaded])

  const totals = meals.reduce(
    (acc, m) => {
      const factor = m.eaten
      acc.calories += m.foods.reduce((s, f) => s + f.calories, 0) * factor
      acc.protein += m.foods.reduce((s, f) => s + f.protein, 0) * factor
      acc.carbs += m.foods.reduce((s, f) => s + f.carbs, 0) * factor
      acc.fats += m.foods.reduce((s, f) => s + f.fats, 0) * factor
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

 return (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      zIndex: 50,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end'
    }}
  >
    <div
      style={{
        background: '#fff',
        width: '100%',
        maxHeight: '90vh',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 12,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >

    {/* ===== PROGRESS RINGS ===== */}
    <div style={{ padding: 12, flexShrink: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12
        }}
      >
        <Ring label="Calories" value={totals.calories} goal={calorieGoal} color="#2563eb" />
        <Ring label="Protein" value={totals.protein} goal={goals.protein} color="#16a34a" />
        <Ring label="Carbs" value={totals.carbs} goal={goals.carbs} color="#ca8a04" />
        <Ring label="Fats" value={totals.fats} goal={goals.fats} color="#dc2626" />
      </div>
    </div>

    {/* ===== ADD MEAL BUTTON ===== */}
    <div
      style={{
        padding: 12,
        borderBottom: '1px solid #e5e7eb',
        flexShrink: 0
      }}
    >
      <button
        style={{ width: '100%', padding: 12, fontSize: 16 }}
        onClick={() => setAdding(true)}
      >
        ➕ Add Meal
      </button>
    </div>

    {/* ===== MEALS LIST ===== */}
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {meals.map(meal => (
        <MealCard key={meal.id} meal={meal} update={setMeals} />
      ))}
    </div>

    {/* ===== ADD MEAL MODAL ===== */}
    {adding && (
      <AddMeal
        onSave={meal => {
          setMeals(m => [...m, meal])
          setAdding(false)
        }}
        onClose={() => setAdding(false)}
      />
    )}
  </div>
  </div>
)
}