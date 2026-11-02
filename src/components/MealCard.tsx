import { useEffect, useState } from 'react'
import type { Meal, MealFood, Food } from '../storage/models'
import { calculateFoodForGrams } from '../storage/meals'
import { getFoods } from '../storage/foods'
import { v4 as uuid } from 'uuid'
import { formatCompactFoodNutrition, formatFoodAmount, formatFoodNutrition, formatFoodUnit, translateFoodName, type LanguageCode } from '../i18n'

export function MealCard({
  meal,
  update,
  t,
  foodLanguage
}: {
  meal: Meal
  update: React.Dispatch<React.SetStateAction<Meal[]>>
  t: (key: string) => string
  foodLanguage: LanguageCode
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

  function updateFood(mealItemId: string, grams: number) {
    update(ms =>
      ms.map(m =>
        m.id !== meal.id
          ? m
          : {
              ...m,
              foods: m.foods.map(f =>
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
              foods: m.foods.filter(f => f.mealItemId !== mealItemId)
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
    <div className="meal-card" style={{ marginTop: 12 }}>
      {/* HEADER */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={event => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setOpen(value => !value)
          }
        }}
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 12,
          color: '#0f172a',
          boxShadow: '0 4px 16px rgba(15,23,42,.05)'
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
                className="meal-name-input"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #3b82f6',
                  fontWeight: 600
                }}
              />
            ) : (
              <div style={{ fontWeight: 600 }}>
                {meal.name || t('navMeals')}
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
            flexWrap: 'wrap',
            gap: '4px 12px',
            justifyContent: 'space-between',
            fontSize: 12,
            marginTop: 6,
              color: '#64748b'
          }}
        >
          {formatCompactFoodNutrition(totals, foodLanguage).map((summary, index) => <span key={index}>{summary}</span>)}
        </div>
      </div>

      {/* EXPANDED */}
      {open && (
        <div style={{ marginTop: 8 }}>
          {meal.foods.map((food: MealFood) => (
            <FoodRow
              key={food.mealItemId}
              food={food}
              foodLanguage={foodLanguage}
              onChange={g => updateFood(food.mealItemId, g)}
              onRemove={() => removeFood(food.mealItemId)}
            />
          ))}

          <button onClick={() => setAddingFood(a => !a)}>{t('addFood')}</button>

          {addingFood && (
            <div style={{ marginTop: 8 }}>
              <input
                placeholder={t('searchFood')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              {allFoods
                .filter(f =>
                  f.name.toLowerCase().includes(search.toLowerCase()) || translateFoodName(f, foodLanguage).toLowerCase().includes(search.toLowerCase())
                )
                .slice(0, 5)
                .map(f => (
                  <AddFoodRow key={f.id} food={f} onAdd={addFood} t={t} foodLanguage={foodLanguage} />
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
  onRemove,
  foodLanguage
}: {
  food: MealFood
  onChange: (g: number) => void
  onRemove: () => void
  foodLanguage: LanguageCode
}) {
  const [grams, setGrams] = useState(String(food.grams))

  function handleChange(v: string) {
    if (/^\d*$/.test(v)) setGrams(v)
  }

  return (
    <div className="meal-food-row" style={{ padding: 10, borderRadius: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong className={`meal-food-name${food.user ? ' user-food-name' : ''}`} style={{ flex: 1 }}>{translateFoodName(food, foodLanguage)}</strong>
        <input
          value={grams}
          inputMode="numeric"
          onChange={e => handleChange(e.target.value)}
          onBlur={() => onChange(Number(grams || 0))}
          style={{ width: 72, textAlign: 'center' }}
        />
        <span>{formatFoodUnit(food.unit, foodLanguage)}</span>

        <button onClick={onRemove}>✕</button>
      </div>

      <div className="meal-food-nutrition" style={{ fontSize: 12, marginTop: 4 }}>
        {formatFoodAmount(food.grams, foodLanguage)} {formatFoodUnit(food.unit, foodLanguage)} | {formatFoodNutrition(food, foodLanguage)}
      </div>
    </div>
  )
}

function AddFoodRow({
  food,
  onAdd,
  t,
  foodLanguage
}: {
  food: Food
  onAdd: (f: Food, g: number) => void
  t: (key: string) => string
  foodLanguage: LanguageCode
}) {
  const [grams, setGrams] = useState(String(food.grams))

  return (
    <div className="meal-add-food-row" style={{ padding: 6, borderRadius: 6, marginBottom: 6 }}>
       <strong className={`meal-food-name${food.user ? ' user-food-name' : ''}`} style={{ flex: 1 }}>{translateFoodName(food, foodLanguage)}</strong>
      <div className="meal-food-nutrition" style={{ fontSize: 12 }}>
        {formatFoodAmount(food.grams, foodLanguage)} {formatFoodUnit(food.unit, foodLanguage)} | {formatFoodNutrition(food, foodLanguage)}
      </div>

      <input
        value={grams}
        inputMode="numeric"
        onChange={e => /^\d*$/.test(e.target.value) && setGrams(e.target.value)}
        style={{ width: 72 }}
      />

      <span>{formatFoodUnit(food.unit, foodLanguage)}</span>
      <button onClick={() => onAdd(food, Number(grams || 0))}>
        {t('add')}
      </button>
    </div>
  )
}
