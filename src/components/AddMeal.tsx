import { useEffect, useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import type { Meal, Food } from '../storage/models'
import { getFoods } from '../storage/foods'
import { calculateFoodForGrams } from '../storage/meals'

const PAGE_SIZE = 3

export function AddMeal({
  onSave,
  onClose
}: {
  onSave: (meal: Meal) => void
  onClose: () => void
}) {
  const [name, setName] = useState('New Meal')
  const [foods, setFoods] = useState<Food[]>([])
  const [items, setItems] = useState<Food[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    getFoods().then(setFoods)
  }, [])

  // reset paging on search change
  useEffect(() => {
    setPage(0)
  }, [search])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const user: Food[] = []
    const system: Food[] = []

    for (const f of foods) {
      if (q && !f.name.toLowerCase().includes(q)) continue
      f.user ? user.push(f) : system.push(f)
    }

    return [...user, ...system]
  }, [foods, search])

  const paged = filtered.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  )

  function addFood(base: Food, grams: number) {
    setItems(i => [...i, calculateFoodForGrams(base, grams)])
  }

  function save() {
    if (!items.length) return

    onSave({
      id: uuid(),
      name,
      foods: items,
      eaten: 0
    })
  }

  return (
    <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <h3>Create Meal</h3>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Meal name"
        style={{ marginBottom: 8 }}
      />

      <input
        placeholder="Search food..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 8, display: 'block' }}
      />

      {/* FOOD LIST */}
      {paged.map(f => (
        <FoodPickRow key={f.id} food={f} onAdd={addFood} />
      ))}

      {/* PAGING */}
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button
          disabled={page === 0}
          onClick={() => setPage(p => Math.max(0, p - 1))}
        >
          Prev
        </button>

        <span style={{ fontSize: 12 }}>
          Page {page + 1} / {Math.ceil(filtered.length / PAGE_SIZE) || 1}
        </span>

        <button
          disabled={(page + 1) * PAGE_SIZE >= filtered.length}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>

      <hr />

      <button onClick={save}>Save Meal</button>
      <button onClick={onClose} style={{ marginLeft: 8 }}>
        Cancel
      </button>
    </div>
  )
}

/* ---------- ROW ---------- */

function FoodPickRow({
  food,
  onAdd
}: {
  food: Food
  onAdd: (food: Food, grams: number) => void
}) {
  const [grams, setGrams] = useState(food.grams)

  return (
    <div style={{ fontSize: 13, marginBottom: 6 }}>
      <strong style={{ color: food.user ? 'green' : 'black' }}>
        {food.name}
      </strong>

      <div>
        100g → Cal {food.calories} | P {food.protein} | C {food.carbs} | F {food.fats}
      </div>

      <input
        type="number"
        value={grams}
        onChange={e => setGrams(+e.target.value)}
        style={{ width: 70 }}
      />
      <button onClick={() => onAdd(food, grams)}>Add</button>
    </div>
  )
}
