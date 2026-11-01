import { useEffect, useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import type { Meal, Food } from '../storage/models'
import { getFoods } from '../storage/foods'
import { calculateFoodForGrams } from '../storage/meals'
import { formatFoodAmount, formatFoodNutrition, formatFoodUnit, translateFoodName, type LanguageCode } from '../i18n'

type MealFood = Food & { mealItemId: string }

const PAGE_SIZE = 3

export function AddMeal({
  onSave,
  onClose,
  t,
  foodLanguage
}: {
  onSave: (meal: Meal) => void
  onClose: () => void
  t: (key: string) => string
  foodLanguage: LanguageCode
}) {
  const [name, setName] = useState('')
  const [foods, setFoods] = useState<Food[]>([])
  const [items, setItems] = useState<MealFood[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [justAdded, setJustAdded] = useState<string | null>(null)

  useEffect(() => {
    getFoods().then(setFoods)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const user: Food[] = []
    const system: Food[] = []

    for (const f of foods) {
      if (q && !f.name.toLowerCase().includes(q) && !translateFoodName(f, foodLanguage).toLowerCase().includes(q)) continue
      if (f.user) user.push(f)
      else system.push(f)
    }

    return [...user, ...system]
  }, [foods, search, foodLanguage])

  const paged = filtered.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  )

  function addFood(base: Food, grams: number) {
    const calculated = calculateFoodForGrams(base, grams)

    const withId: MealFood = {
      ...calculated,
      mealItemId: uuid()
    }

    setItems(i => [...i, withId])
    setJustAdded(base.id)
    navigator.vibrate?.(40)

    setTimeout(() => setJustAdded(null), 600)
  }

  function removeFood(mealItemId: string) {
    setItems(i => i.filter(f => f.mealItemId !== mealItemId))
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
    <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 12 }}>
      <h3>{t('createMeal')}</h3>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t('mealName')}
        style={{ width: '100%', marginBottom: 8 }}
      />

      <input
        placeholder={t('searchFood')}
        value={search}
        onChange={e => {
          setSearch(e.target.value)
          setPage(0)
        }}
        style={{ width: '100%', marginBottom: 8 }}
      />

      {/* FOOD PICK LIST */}
      {paged.map(f => (
        <FoodPickRow
          key={f.id}
          food={f}
          onAdd={addFood}
          active={f.id === justAdded}
          t={t}
          foodLanguage={foodLanguage}
        />
      ))}

      {/* PAGING */}
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <button
          disabled={page === 0}
          onClick={() => setPage(p => Math.max(0, p - 1))}
        >
          {t('previous')}
        </button>

        <span style={{ fontSize: 12 }}>
          {page + 1} / {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
        </span>

        <button
          disabled={(page + 1) * PAGE_SIZE >= filtered.length}
          onClick={() => setPage(p => p + 1)}
        >
          {t('next')}
        </button>
      </div>

      {/* SELECTED FOODS */}
      {items.length > 0 && (
        <>
          <hr />
          {items.map(item => (
            <div
              key={item.mealItemId}
              style={{
                fontSize: 12,
                padding: 6,
                borderRadius: 6,
                background: '#f9fafb',
                marginBottom: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>
                {translateFoodName(item, foodLanguage)} — {formatFoodAmount(item.grams, foodLanguage)} {formatFoodUnit(item.unit, foodLanguage)}
              </span>
              <button onClick={() => removeFood(item.mealItemId)}>✕</button>
            </div>
          ))}
        </>
      )}

      <hr />

      <button onClick={save} style={{ marginTop: 8 }}>
        {t('saveMeal')}
      </button>

      <button onClick={onClose} style={{ marginLeft: 8 }}>
        {t('cancel')}
      </button>
    </div>
  )
}

/* ---------- FOOD PICK ROW ---------- */

function FoodPickRow({
  food,
  onAdd,
  active,
  t,
  foodLanguage
}: {
  food: Food
  onAdd: (food: Food, grams: number) => void
  active: boolean
  t: (key: string) => string
  foodLanguage: LanguageCode
}) {
  const [grams, setGrams] = useState(String(food.grams))

  return (
    <div
      style={{
        fontSize: 13,
        marginBottom: 8,
        padding: 8,
        borderRadius: 8,
        background: active ? '#d1fae5' : '#f9fafb',
        border: '1px solid #e5e7eb',
        transition: 'background 0.4s'
      }}
    >
      <strong style={{ color: food.user ? 'green' : '#111827' }}>
        {translateFoodName(food, foodLanguage)}
      </strong>

      <div style={{ fontSize: 12, color: '#374151' }}>
        {formatFoodAmount(food.grams, foodLanguage)} {formatFoodUnit(food.unit, foodLanguage)} → {formatFoodNutrition(food, foodLanguage)}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <input
          value={grams}
          inputMode="numeric"
          onChange={e => /^\d*$/.test(e.target.value) && setGrams(e.target.value)}
          style={{ width: 70 }}
        />
        <span>{formatFoodUnit(food.unit, foodLanguage)}</span>

        <button onClick={() => onAdd(food, Number(grams || 0))}>
          {t('add')}
        </button>
      </div>
    </div>
  )
}
