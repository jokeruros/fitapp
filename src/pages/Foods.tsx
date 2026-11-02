import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Food } from '../storage/models'
import { getFoods, addFood, deleteFood, updateFood, isUsingLocalSystemCatalog } from '../storage/foods'
import { v4 as uuid } from 'uuid'
import { foodNutritionLabel, formatFoodAmount, formatFoodNutrition, formatFoodUnit, translateFoodName, type LanguageCode } from '../i18n'

const PAGE_SIZE = 50

export function Foods({ t, foodLanguage }: { t: (key: string) => string; foodLanguage: LanguageCode }) {
  const [foods, setFoods] = useState<Food[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 150)
  const [editing, setEditing] = useState<Food | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [catalogFallback, setCatalogFallback] = useState(false)

  const editorRef = useRef<HTMLDivElement | null>(null)

  const refreshFoods = useCallback(async () => {
    setFoods(await getFoods())
    setCatalogFallback(isUsingLocalSystemCatalog())
  }, [])

  useEffect(() => {
    let active = true
    getFoods().then(items => {
      if (!active) return
      setFoods(items)
      setCatalogFallback(isUsingLocalSystemCatalog())
    })
    return () => { active = false }
  }, [])

  function startAdd() {
    setIsAdding(true)
    setEditing({
      id: uuid(),
      name: '',
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
      grams: 100,
      unit: 'g',
      user: true
    })

    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  function startEdit(food: Food) {
    setIsAdding(false)
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

    const updated = { ...food, calories }
    if (isAdding) await addFood({ ...updated, user: true })
    else await updateFood({ ...updated, user: food.user })
    setEditing(null)
    setIsAdding(false)
    await refreshFoods()
  }

  async function remove(id: string) {
    await deleteFood(id)
    await refreshFoods()
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const user: Food[] = []
    const system: Food[] = []

    for (const f of foods) {
      if (q && !f.name.toLowerCase().includes(q) && !translateFoodName(f, foodLanguage).toLowerCase().includes(q)) continue
      if (f.user) user.push(f)
      else system.push(f)
    }

    return [...user, ...system]
  }, [foods, debouncedSearch, foodLanguage])

  const visibleFoods = filtered.slice(0, visibleCount)

  return (
    <div style={{ padding: 12 }}>
      <h3>{t('navFoods')}</h3>

      <input
        placeholder={t('foodsSearch')}
        value={search}
        onChange={e => {
          setSearch(e.target.value)
          setVisibleCount(PAGE_SIZE)
        }}
        style={{ width: '100%', marginBottom: 8 }}
      />

      <button onClick={startAdd}>{t('addFood')}</button>

      {catalogFallback && (
        <p role="status" style={{ fontSize: 12 }}>
          {t('fallbackCatalogNotice')}
        </p>
      )}

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
            className={`food-list-card${f.user ? ' user-food-card' : ''}`}
            style={{
              marginBottom: 8,
              padding: 8,
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}
          >
            <strong className={`food-list-name${f.user ? ' user-food-name' : ''}`}>
              {translateFoodName(f, foodLanguage)}
            </strong>

            <div className="food-nutrition-line" style={{ fontSize: 12 }}>
              {formatFoodAmount(f.grams, foodLanguage)} {formatFoodUnit(f.unit, foodLanguage)} | {formatFoodNutrition(f, foodLanguage)}
            </div>

            <div>
              <button onClick={() => startEdit(f)}>{t('edit')}</button>{' '}
              {f.user && <button onClick={() => remove(f.id)}>{t('delete')}</button>}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div ref={editorRef}>
          <FoodEditor
            food={editing}
            t={t}
            foodLanguage={foodLanguage}
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
  t,
  foodLanguage,
  onSave,
  onCancel
}: {
  food: Food
  t: (key: string) => string
  foodLanguage: LanguageCode
  onSave: (f: Food) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(food.name)
  const [grams, setGrams] = useState<string>(String(food.grams ?? ''))
  const [unit, setUnit] = useState<NonNullable<Food['unit']>>(food.unit ?? 'g')
  const [protein, setProtein] = useState<string>(String(food.protein ?? ''))
  const [carbs, setCarbs] = useState<string>(String(food.carbs ?? ''))
  const [fats, setFats] = useState<string>(String(food.fats ?? ''))

  const calories =
    Number(protein || 0) * 4 +
    Number(carbs || 0) * 4 +
    Number(fats || 0) * 9

  function save() {
    onSave({
      ...food,
      name,
      grams: Number(grams || 0),
      unit,
      protein: Number(protein || 0),
      carbs: Number(carbs || 0),
      fats: Number(fats || 0),
      calories
    })
  }

  function numericSetter(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      if (/^\d*$/.test(v)) setter(v)
    }
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        border: '1px solid #e5e7eb',
        borderRadius: 8
      }}
    >
      <h4>{food.name ? t('edit') : t('addFood')}</h4>

      <div style={{ marginBottom: 8 }}>
        <label>
          {t('foodName')}
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
      </div>

      <div className="food-editor-nutrition-row" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <label>
          {t('baseAmount')}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={grams}
            onChange={numericSetter(setGrams)}
          />
        </label>
        <label>
          {t('unit')}
          <select value={unit} onChange={e => setUnit(e.target.value as NonNullable<Food['unit']>)}>
            <option value="g">{formatFoodUnit('g', foodLanguage)}</option>
            <option value="ml">{formatFoodUnit('ml', foodLanguage)}</option>
            <option value="piece">{formatFoodUnit('piece', foodLanguage)}</option>
            <option value="serving">{formatFoodUnit('serving', foodLanguage)}</option>
          </select>
        </label>

        <label>
          {foodNutritionLabel('protein', foodLanguage)} (g)
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={protein}
            onChange={numericSetter(setProtein)}
          />
        </label>

        <label>
          {foodNutritionLabel('carbs', foodLanguage)} (g)
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={carbs}
            onChange={numericSetter(setCarbs)}
          />
        </label>

        <label>
          {foodNutritionLabel('fats', foodLanguage)} (g)
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={fats}
            onChange={numericSetter(setFats)}
          />
        </label>
      </div>

      <div style={{ fontWeight: 500 }}>
        {foodNutritionLabel('calories', foodLanguage)}: {calories} kcal
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={save}>{t('save')}</button>
        <button onClick={onCancel} style={{ marginLeft: 8 }}>
          {t('cancel')}
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
