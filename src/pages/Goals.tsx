import { useEffect, useState } from 'react'
import { getGoals, saveGoals, type Goals } from '../storage/goalsDb'

interface EditableGoals {
  protein: string
  carbs: string
  fats: string
  calories: number
}

export function Goals() {
  const [goals, setGoals] = useState<EditableGoals>({
    protein: '',
    carbs: '',
    fats: '',
    calories: 0
  })

  const [loaded, setLoaded] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    getGoals().then(g => {
      const protein = String(g.protein || '')
      const carbs = String(g.carbs || '')
      const fats = String(g.fats || '')

      setGoals({
        protein,
        carbs,
        fats,
        calories: calcCalories(protein, carbs, fats)
      })

      setLoaded(true)
    })
  }, [])

  function calcCalories(p: string, c: string, f: string) {
    const protein = Number(p) || 0
    const carbs = Number(c) || 0
    const fats = Number(f) || 0
    return protein * 4 + carbs * 4 + fats * 9
  }

  function update(key: keyof Omit<EditableGoals, 'calories'>, value: string) {
    const next = {
      ...goals,
      [key]: value
    }

    next.calories = calcCalories(next.protein, next.carbs, next.fats)

    setGoals(next)
    setDirty(true)
  }

  function save() {
    saveGoals({
      protein: Number(goals.protein) || 0,
      carbs: Number(goals.carbs) || 0,
      fats: Number(goals.fats) || 0,
      calories: goals.calories
    })

    setDirty(false)
  }

  if (!loaded) return null

  return (
    <div style={{ padding: 12 }}>
      <h3>Daily Goals</h3>

      <GoalInput
        label="Protein (g)"
        value={goals.protein}
        onChange={v => update('protein', v)}
      />

      <GoalInput
        label="Carbs (g)"
        value={goals.carbs}
        onChange={v => update('carbs', v)}
      />

      <GoalInput
        label="Fats (g)"
        value={goals.fats}
        onChange={v => update('fats', v)}
      />

      <GoalInput
        label="Calories (kcal)"
        value={String(goals.calories)}
        readOnly
      />

      <button
        onClick={save}
        disabled={!dirty}
        style={{ marginTop: 12, width: '100%' }}
      >
        Save
      </button>
    </div>
  )
}

/* ---------- INPUT ---------- */

function GoalInput({
  label,
  value,
  onChange,
  readOnly = false
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  readOnly?: boolean
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12 }}>{label}</label>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        readOnly={readOnly}
        onChange={e => {
          const v = e.target.value
          if (/^\d*$/.test(v)) onChange?.(v)
        }}
        style={{
          width: '100%',
          background: readOnly ? '#f3f4f6' : undefined
        }}
      />
    </div>
  )
}
