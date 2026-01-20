import { useEffect, useState } from 'react'
import type { Meal, Food } from '../storage/models'
import { calculateFoodForGrams } from '../storage/meals'
import { getFoods } from '../storage/foods'
import { v4 as uuid } from 'uuid'

type MealFood = Food & { mealItemId: string }

export function MealCard({
  meal,
  update
}: {
  meal: Meal
  update: React.Dispatch<React.SetStateAction<Meal[]>>
}) {
  const [open, setOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(meal.name)
  const [addingFood, setAddingFood] = useState(false)
  const [allFoods, setAllFoods] = useState<Food[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (addingFood) getFoods().then(setAllFoods)
  }, [addingFood])

  const totals = meal.foods.reduce(
    (acc, f: any) => {
      acc.calories += f.calories
      acc.protein += f.protein
      acc.carbs += f.carbs
      acc.fats += f.fats
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

  function inc() {
    update(ms =>
      ms.map(m =>
        m.id === meal.id ? { ...m, eaten: m.eaten + 1 } : m
      )
    )
  }

  function dec() {
    update(ms =>
      ms.map(m =>
        m.id === meal.id && m.eaten > 0
          ? { ...m, eaten: m.eaten - 1 }
          : m
      )
    )
  }

  function removeMeal() {
    update(ms => ms.filter(m => m.id !== meal.id))
  }

  function saveName() {
    update(ms =>
      ms.map(m =>
        m.id === meal.id ? { ...m, name } : m
      )
    )
    setEditingName(false)
  }

  function updateFood(mealItemId: string, grams: number) {
    update(ms =>
      ms.map(m =>
        m.id !== meal.id
          ? m
          : {
              ...m,
              foods: m.foods.map((f: any) =>
                f.mealItemId === mealItemId
                  ? calculateFoodForGrams(f, grams)
                  : f
              )
            }
      )
    )
  }

  function removeFood(mealItemId: string) {
    update(ms =>
      ms.map(m =>
        m.id !== meal.id
          ? m
          : {
              ...m,
              foods: m.foods.filter(
                (f: any) => f.mealItemId !== mealItemId
              )
            }
      )
    )
  }

  function addFood(base: Food, grams: number) {
    const item = calculateFoodForGrams(base, grams)
    const withId: MealFood = {
      ...item,
      mealItemId: uuid()
    }

    update(ms =>
      ms.map(m =>
        m.id !== meal.id
          ? m
          : { ...m, foods: [...m.foods, withId] }
      )
    )

    setAddingFood(false)
    setSearch('')
  }

  return (
    <div style={{ marginTop: 12 }}>
      {/* HEADER */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background: '#1f2937',
          borderRadius: 12,
          padding: 10,
          color: 'white'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
          <div>
            {editingName ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={saveName}
                autoFocus
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #3b82f6',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            ) : (
              <div style={{ fontWeight: 600 }}>
                {meal.name || 'Meal'}
                {meal.eaten ? ` (x${meal.eaten})` : ''}
              </div>
            )}
          </div>

          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}
            onClick={e => e.stopPropagation()}
          >
            <button className="meal-btn" onClick={inc}>+</button>
            <button className="meal-btn" onClick={dec}>-</button>
            <button className="meal-btn" onClick={() => setEditingName(true)}>✎</button>
            <button className="meal-btn" onClick={removeMeal}>🗑️</button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            marginTop: 6,
            color: '#9ca3af'
          }}
        >
          <span>Cal {totals.calories.toFixed(0)}</span>
          <span>P {totals.protein.toFixed(1)}</span>
          <span>C {totals.carbs.toFixed(1)}</span>
          <span>F {totals.fats.toFixed(1)}</span>
        </div>
      </div>

      {/* EXPANDED */}
      {open && (
        <div style={{ marginTop: 8 }}>
          {meal.foods.map((food: any) => (
            <FoodRow
              key={food.mealItemId}
              food={food}
              onChange={g => updateFood(food.mealItemId, g)}
              onRemove={() => removeFood(food.mealItemId)}
            />
          ))}

          <button onClick={() => setAddingFood(a => !a)}>➕ Add Food</button>

          {addingFood && (
            <div style={{ marginTop: 8 }}>
              <input
                placeholder="Search food..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              {allFoods
                .filter(f =>
                  f.name.toLowerCase().includes(search.toLowerCase())
                )
                .slice(0, 5)
                .map(f => (
                  <AddFoodRow key={f.id} food={f} onAdd={addFood} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- FOOD ROW ---------- */

function FoodRow({
  food,
  onChange,
  onRemove
}: {
  food: any
  onChange: (g: number) => void
  onRemove: () => void
}) {
  const [grams, setGrams] = useState(String(food.grams))

  function handleChange(v: string) {
    if (/^\d*$/.test(v)) setGrams(v)
  }

  return (
    <div style={{ background: '#f9fafb', padding: 10, borderRadius: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong style={{ color: food.user ? 'green' : '#111827', flex: 1 }}>{food.name}</strong>
        <input
          value={grams}
          inputMode="numeric"
          onChange={e => handleChange(e.target.value)}
          onBlur={() => onChange(Number(grams || 0))}
          style={{ width: 72, textAlign: 'center' }}
        />

        <button onClick={onRemove}>✕</button>
      </div>

      <div style={{ fontSize: 12, marginTop: 4 }}>
        Cal {food.calories.toFixed(0)} ·
        P {food.protein.toFixed(1)} ·
        C {food.carbs.toFixed(1)} ·
        F {food.fats.toFixed(1)}
      </div>
    </div>
  )
}

function AddFoodRow({
  food,
  onAdd
}: {
  food: Food
  onAdd: (f: Food, g: number) => void
}) {
  const [grams, setGrams] = useState('100')

  return (
    <div style={{ background: '#fff', padding: 6, borderRadius: 6, marginBottom: 6 }}>
       <strong style={{ color: food.user ? 'green' : '#111827', flex: 1 }}>{food.name}</strong>
      <div style={{ fontSize: 12 }}>
        Cal {food.calories} · P {food.protein} · C {food.carbs} · F {food.fats}
      </div>

      <input
        value={grams}
        inputMode="numeric"
        onChange={e => /^\d*$/.test(e.target.value) && setGrams(e.target.value)}
        style={{ width: 72 }}
      />

      <button onClick={() => onAdd(food, Number(grams || 0))}>
        Add
      </button>
    </div>
  )
}
