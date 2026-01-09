import { useEffect, useState } from 'react'
import type { Meal, Food } from '../storage/models'
import { calculateFoodForGrams } from '../storage/meals'
import { getFoods } from '../storage/foods'
import { useRef } from 'react'

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

  const touchStartX = useRef(0)
const touchEndX = useRef(0)

function onTouchStart(e: React.TouchEvent) {
  touchStartX.current = e.touches[0].clientX
}

function onTouchMove(e: React.TouchEvent) {
  touchEndX.current = e.touches[0].clientX
}

function onTouchEnd() {
  const dx = touchEndX.current - touchStartX.current

  if (dx > 80) inc()        // swipe right
  if (dx < -80) removeMeal() // swipe left
}

  useEffect(() => {
    if (addingFood) {
      getFoods().then(setAllFoods)
    }
  }, [addingFood])

  const totals = meal.foods.reduce(
    (acc, f) => {
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

  function updateFood(food: Food, grams: number) {
    update(ms =>
      ms.map(m =>
        m.id !== meal.id
          ? m
          : {
              ...m,
              foods: m.foods.map(f =>
                f.id === food.id
                  ? calculateFoodForGrams(food, grams)
                  : f
              )
            }
      )
    )
  }

  function removeFood(foodId: string) {
    update(ms =>
      ms.map(m =>
        m.id !== meal.id
          ? m
          : { ...m, foods: m.foods.filter(f => f.id !== foodId) }
      )
    )
  }

  function addFood(base: Food, grams: number) {
    update(ms =>
      ms.map(m =>
        m.id !== meal.id
          ? m
          : { ...m, foods: [...m.foods, calculateFoodForGrams(base, grams)] }
      )
    )
    setAddingFood(false)
    setSearch('')
  }

  return (
   <div
  onTouchStart={onTouchStart}
  onTouchMove={onTouchMove}
  onTouchEnd={onTouchEnd}
  style={{
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: '#f3f4f6',
    touchAction: 'pan-y'
  }}
>

      {/* HEADER */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {editingName ? (
          <>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: 120 }}
            />
            <button onClick={saveName}>Save</button>
          </>
        ) : (
          <strong onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
           <div style={{ flex: 1 }}>
  <strong>{meal.name}</strong>
  <div style={{ fontSize: 12, marginBottom: 6, color: '#374151' }}>
  Cal {totals.calories.toFixed(0)} ·
  P {totals.protein.toFixed(1)} ·
  C {totals.carbs.toFixed(1)} ·
  F {totals.fats.toFixed(1)}
</div>
</div>
          </strong>
        )}

  

        <button onClick={inc}>+</button>
        <button onClick={dec}>-</button>
        <button onClick={() => setEditingName(true)}>✎</button>
        <button onClick={removeMeal}>🗑️</button>
      </div>

      {/* EXPANDED */}
      {open && (
        <div style={{ marginTop: 8 }}>
          {meal.foods.map(food => (
            <FoodRow
              key={food.id}
              food={food}
              onChange={g => updateFood(food, g)}
              onRemove={() => removeFood(food.id)}
            />
          ))}

          <button onClick={() => setAddingFood(a => !a)}>
            ➕ Add Food
          </button>

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

          {meal.foods.length === 0 && (
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              No foods in this meal
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- SUB COMPONENTS ---------- */

function FoodRow({
  food,
  onChange,
  onRemove
}: {
  food: Food
  onChange: (grams: number) => void
  onRemove: () => void
}) {
  const [grams, setGrams] = useState(food.grams)

  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 12, marginBottom: 4 }}>
      <strong style={{ width: 100 }}>{food.name}</strong>
      <input
        type="number"
        value={grams}
        onChange={e => setGrams(+e.target.value)}
        style={{ width: 60 }}
      />
      g
      <span>
        Cal {food.calories.toFixed(0)} |
        P {food.protein.toFixed(1)} |
        C {food.carbs.toFixed(1)} |
        F {food.fats.toFixed(1)}
      </span>
      <button onClick={() => onChange(grams)}>Save</button>
      <button onClick={onRemove}>✕</button>
    </div>
  )
}

function AddFoodRow({
  food,
  onAdd
}: {
  food: Food
  onAdd: (food: Food, grams: number) => void
}) {
  const [grams, setGrams] = useState(food.grams)

  return (
    <div
      style={{
        fontSize: 12,
        marginBottom: 8,
        padding: 6,
        borderRadius: 6,
        background: '#ffffff'
      }}
    >
      <strong style={{ color: food.user ? 'green' : 'black' }}>
        {food.name}
      </strong>

      <div style={{ marginTop: 2 }}>
        <span style={{ marginRight: 8 }}>
          <b>Cal:</b> {food.calories}
        </span>
        <span style={{ marginRight: 8 }}>
          <b>P:</b> {food.protein}
        </span>
        <span style={{ marginRight: 8 }}>
          <b>C:</b> {food.carbs}
        </span>
        <span>
          <b>F:</b> {food.fats}
        </span>
        <span style={{ marginLeft: 6, opacity: 0.6 }}>
          (per 100g)
        </span>
      </div>

      <div style={{ marginTop: 4 }}>
        <input
          type="number"
          value={grams}
          onChange={e => setGrams(+e.target.value)}
          style={{ width: 70 }}
        />
        <span style={{ marginLeft: 4 }}>g</span>
        <button
          style={{ marginLeft: 8 }}
          onClick={() => onAdd(food, grams)}
        >
          Add
        </button>
      </div>
    </div>
  )
}
