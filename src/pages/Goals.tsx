import { useEffect, useState } from 'react'
import { getGoals, saveGoals, type Goals } from '../storage/goalsDb'

interface EditableGoals {
  protein: string
  carbs: string
  fats: string
  calories: number
}

function calcCalories(protein: string, carbs: string, fats: string) {
  return (Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fats) || 0) * 9
}

export function Goals({ t }: { t: (key: string) => string }) {
  const [goals, setGoals] = useState<EditableGoals>({
    protein: '',
    carbs: '',
    fats: '',
    calories: 0
  })

  const [loaded, setLoaded] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

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

  function update(key: keyof Omit<EditableGoals, 'calories'>, value: string) {
    const next = {
      ...goals,
      [key]: value
    }

    next.calories = calcCalories(next.protein, next.carbs, next.fats)

    setGoals(next)
    setDirty(true)
    setStatus('')
  }

  async function save() {
    setSaving(true)
    setStatus(t('goalsSaving'))
    try {
      await saveGoals({
        protein: Number(goals.protein) || 0,
        carbs: Number(goals.carbs) || 0,
        fats: Number(goals.fats) || 0,
        calories: goals.calories
      })
      setDirty(false)
      setStatus(t('goalsSaved'))
    } catch {
      setStatus(t('goalsError'))
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <div style={{ padding: 12 }}>
      <h3>{t('dailyGoals')}</h3>

      <GoalInput
        label={t('proteinGoal')}
        value={goals.protein}
        onChange={v => update('protein', v)}
      />

      <GoalInput
        label={t('carbsGoal')}
        value={goals.carbs}
        onChange={v => update('carbs', v)}
      />

      <GoalInput
        label={t('fatsGoal')}
        value={goals.fats}
        onChange={v => update('fats', v)}
      />

      <GoalInput
        label={t('calorieGoal')}
        value={String(goals.calories)}
        readOnly
      />

      <button
        onClick={() => void save()}
        disabled={!dirty || saving}
        style={{ marginTop: 12, width: '100%' }}
      >
        {saving ? t('saving') : t('save')}
      </button>
      {status && <p className="settings-status" role="status">{status}</p>}
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
