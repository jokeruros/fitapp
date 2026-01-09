import { useEffect, useState } from 'react'
import { getGoals, saveGoals, type Goals as GoalsType } from '../storage/goalsDb'

interface EditableGoals extends GoalsType {
  calories: number
}

export function Goals() {
  const [goals, setGoals] = useState<EditableGoals>({
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0
  })

  const [loaded, setLoaded] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    getGoals().then(g => {
      const calories = g.protein * 4 + g.carbs * 4 + g.fats * 9
      setGoals({ ...g, calories })
      setLoaded(true)
    })
  }, [])

  function recalc(next: Omit<EditableGoals, 'calories'>) {
    return {
      ...next,
      calories: next.protein * 4 + next.carbs * 4 + next.fats * 9
    }
  }

  function update<K extends keyof GoalsType>(key: K, value: number) {
    const updated = recalc({ ...goals, [key]: value })
    setGoals(updated)
    setDirty(true)
  }

  function save() {
    saveGoals({
      protein: goals.protein,
      carbs: goals.carbs,
      fats: goals.fats,
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
        value={goals.calories}
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

function GoalInput({
  label,
  value,
  onChange,
  readOnly = false
}: {
  label: string
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12 }}>{label}</label>
      <input
        type="number"
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(+e.target.value)}
        style={{
          width: '100%',
          background: readOnly ? '#f3f4f6' : undefined
        }}
      />
    </div>
  )
}
