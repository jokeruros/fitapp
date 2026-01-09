import { useEffect, useMemo, useRef, useState } from 'react'
import type { Food } from '../storage/models'
import { getFoods, addFood, deleteFood } from '../storage/foods'
import { v4 as uuid } from 'uuid'

const PAGE_SIZE = 50

export function Foods() {
  const [foods, setFoods] = useState<Food[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 150)
  const [editing, setEditing] = useState<Food | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setFoods(await getFoods())
  }

  function startAdd() {
    setEditing({
      id: uuid(),
      name: '',
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
      grams: 100,
      user: true
    })

    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  function startEdit(food: Food) {
    if (!food.user) return
    setEditing({ ...food })

    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  async function save(food: Food) {
    const calories =
      food.protein * 4 +
      food.carbs * 4 +
      food.fats * 9

    await addFood({ ...food, calories, user: true })
    setEditing(null)
    load()
  }

  async function remove(id: string) {
    await deleteFood(id)
    load()
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const user: Food[] = []
    const system: Food[] = []

    for (const f of foods) {
      if (q && !f.name.toLowerCase().includes(q)) continue
      f.user ? user.push(f) : system.push(f)
    }

    return [...user, ...system]
  }, [foods, debouncedSearch])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [debouncedSearch])

  const visibleFoods = filtered.slice(0, visibleCount)

  return (
    <div style={{ padding: 12 }}>
      <h3>Foods</h3>

      <input
        placeholder="Search food..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', marginBottom: 8 }}
      />

      <button onClick={startAdd}>➕ Add Food</button>

      <div
        style={{ marginTop: 12, maxHeight: 500, overflowY: 'auto' }}
        onScroll={e => {
          const el = e.currentTarget
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
            setVisibleCount(v =>
              Math.min(v + PAGE_SIZE, filtered.length)
            )
          }
        }}
      >
        {visibleFoods.map(f => (
          <div
            key={f.id}
            style={{
              marginBottom: 8,
              padding: 8,
              borderRadius: 8,
              background: f.user ? '#ecfdf5' : '#f9fafb',
              border: '1px solid #e5e7eb'
            }}
          >
            <strong style={{ color: f.user ? 'green' : '#111827' }}>
              {f.name}
            </strong>

            <div style={{ fontSize: 12 }}>
              {f.grams}
              {f.grams === 1 ? '' : 'g'} | Cal {f.calories} | P {f.protein} | C{' '}
              {f.carbs} | F {f.fats}
            </div>

            {f.user && (
              <div>
                <button onClick={() => startEdit(f)}>Edit</button>{' '}
                <button onClick={() => remove(f.id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div ref={editorRef}>
          <FoodEditor
            food={editing}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
    </div>
  )
}

/* ---------- FOOD EDITOR ---------- */

function FoodEditor({
  food,
  onSave,
  onCancel
}: {
  food: Food
  onSave: (f: Food) => void
  onCancel: () => void
}) {
  const [f, setF] = useState(food)

  function update<K extends keyof Food>(key: K, value: number | string) {
    const next = { ...f, [key]: value }
    next.calories = next.protein * 4 + next.carbs * 4 + next.fats * 9
    setF(next)
  }

  return (
    <div style={{ marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <h4>{food.name ? 'Edit Food' : 'Add Food'}</h4>

      <div style={{ marginBottom: 8 }}>
        <label>
          Name
          <input
            value={f.name}
            onChange={e => update('name', e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <label>
          Amount (g)
          <input
            type="number"
            value={f.grams}
            onChange={e => update('grams', +e.target.value)}
          />
        </label>

        <label>
          Protein (g)
          <input
            type="number"
            value={f.protein}
            onChange={e => update('protein', +e.target.value)}
          />
        </label>

        <label>
          Carbs (g)
          <input
            type="number"
            value={f.carbs}
            onChange={e => update('carbs', +e.target.value)}
          />
        </label>

        <label>
          Fats (g)
          <input
            type="number"
            value={f.fats}
            onChange={e => update('fats', +e.target.value)}
          />
        </label>
      </div>

      <div style={{ fontWeight: 500 }}>
        Calories: {f.calories} kcal
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => onSave(f)}>Save</button>
        <button onClick={onCancel} style={{ marginLeft: 8 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function useDebounce<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}
