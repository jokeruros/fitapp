import { useEffect, useMemo, useState } from 'react'
import { getDailyProgress, localDateKey, saveDailyProgress, type DailyProgress, type ProgressValues } from '../storage/dailyProgress'

const metrics = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: '#2563eb' },
  { key: 'protein', label: 'Protein', unit: 'g', color: '#16a34a' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: '#ca8a04' },
  { key: 'fats', label: 'Fats', unit: 'g', color: '#dc2626' }
] as const

const zeroValues: ProgressValues = { calories: 0, protein: 0, carbs: 0, fats: 0 }

export function CalendarDashboard({ t, language }: { t: (key: string) => string; language: string }) {
  const dateLocale = language === 'sr' ? 'sr-Latn' : language
  const weekdays = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(dateLocale, { weekday: 'short' }).format(new Date(2026, 0, 5 + index)))
  const [records, setRecords] = useState<DailyProgress[]>([])
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(localDateKey())
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [editValues, setEditValues] = useState<{ goals: ProgressValues; achieved: ProgressValues }>({ goals: zeroValues, achieved: zeroValues })

  useEffect(() => {
    getDailyProgress().then(setRecords).catch(() => setError(true))
  }, [])

  const recordByDate = useMemo(() => new Map(records.map(record => [record.date, record])), [records])
  const dates = useMemo(() => {
    const offset = (month.getDay() + 6) % 7
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const count = Math.ceil((offset + days) / 7) * 7
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(month.getFullYear(), month.getMonth(), index - offset + 1)
      return { date, key: localDateKey(date), currentMonth: date.getMonth() === month.getMonth() }
    })
  }, [month])
  const selected = recordByDate.get(selectedDate)

  function changeMonth(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1)
    setMonth(next)
    setSelectedDate(localDateKey(next))
  }

  function startEditing() {
    setEditValues(selected
      ? { goals: { ...selected.goals }, achieved: { ...selected.achieved } }
      : { goals: { ...zeroValues }, achieved: { ...zeroValues } })
    setEditStatus('')
    setEditing(true)
  }

  async function saveEditedDay() {
    setSavingEdit(true)
    setEditStatus('')
    const record: DailyProgress = {
      date: selectedDate,
      savedAt: new Date().toISOString(),
      goals: editValues.goals,
      achieved: editValues.achieved
    }
    try {
      await saveDailyProgress(record)
      setRecords(current => [...current.filter(item => item.date !== selectedDate), record].sort((a, b) => a.date.localeCompare(b.date)))
      setEditing(false)
      setEditStatus(t('saved'))
    } catch {
      setEditStatus(t('progressError'))
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <main className="calendar-page">
      <header className="calendar-heading">
        <div>
          <p className="calendar-eyebrow">{t('historyLabel')}</p>
          <h1>{t('calendarTitle')}</h1>
          <p>{t('calendarSubtitle')}</p>
        </div>
        <button className="calendar-today" disabled={editing} onClick={() => {
          const now = new Date()
          setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
          setSelectedDate(localDateKey(now))
        }}>{t('todayButton')}</button>
      </header>

      {error && <p className="calendar-error" role="alert">{t('progressError')}</p>}

      <section className="calendar-card" aria-label={t('calendarAria')}>
        <div className="calendar-month-bar">
          <button aria-label={t('previousMonth')} disabled={editing} onClick={() => changeMonth(-1)}>‹</button>
          <h2>{month.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}</h2>
          <button aria-label={t('nextMonth')} disabled={editing} onClick={() => changeMonth(1)}>›</button>
        </div>

        <div className="calendar-grid calendar-weekdays">
          {weekdays.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="calendar-grid">
          {dates.map(({ date, key, currentMonth }) => {
            const record = recordByDate.get(key)
            const hit = record && record.goals.calories > 0
              ? Math.min(100, Math.round(record.achieved.calories / record.goals.calories * 100))
              : 0
            return (
              <button
                key={key}
                disabled={editing}
                className={`calendar-day${currentMonth ? '' : ' outside-month'}${key === selectedDate ? ' selected' : ''}${record ? ' has-record' : ''}`}
                onClick={() => setSelectedDate(key)}
                aria-label={`${date.toLocaleDateString(dateLocale)}${record ? `, ${record.achieved.calories} of ${record.goals.calories} calories` : ', no saved progress'}`}
              >
                <span className="calendar-day-number">{date.getDate()}</span>
                {record ? <>
                  <span className="calendar-cell-calories">{Math.round(record.achieved.calories)} / {Math.round(record.goals.calories)} kcal</span>
                  <span className="calendar-cell-macros">P {Math.round(record.achieved.protein)}/{Math.round(record.goals.protein)} · C {Math.round(record.achieved.carbs)}/{Math.round(record.goals.carbs)} · F {Math.round(record.achieved.fats)}/{Math.round(record.goals.fats)}</span>
                  <span className="calendar-progress-track"><span style={{ width: `${hit}%` }} /></span>
                </> : <span className="calendar-empty">{t('noLog')}</span>}
              </button>
            )
          })}
        </div>
      </section>

      <section className="calendar-detail">
        <div className="calendar-detail-heading">
          <div>
            <p className="calendar-eyebrow">{t('daySummary')}</p>
            <h2>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
          </div>
          {selected && <span className="saved-pill">{t('saved')}</span>}
        </div>
        <button className="calendar-edit-button" onClick={startEditing}>{selected ? t('editDay') : t('addDay')}</button>
        {editing ? (
          <div className="calendar-edit-form">
            {metrics.map(metric => <div className="calendar-edit-row" key={metric.key}>
              <strong>{t(metric.key)}</strong>
              <label>{t('goal')} ({metric.unit})<input type="number" min="0" step="0.1" value={editValues.goals[metric.key]} onChange={event => setEditValues(current => ({ ...current, goals: { ...current.goals, [metric.key]: Number(event.target.value) || 0 } }))} /></label>
              <label>{t('achieved')} ({metric.unit})<input type="number" min="0" step="0.1" value={editValues.achieved[metric.key]} onChange={event => setEditValues(current => ({ ...current, achieved: { ...current.achieved, [metric.key]: Number(event.target.value) || 0 } }))} /></label>
            </div>)}
            <div className="calendar-edit-actions">
              <button className="save-progress-button" disabled={savingEdit} onClick={() => void saveEditedDay()}>{savingEdit ? t('saving') : t('saveChanges')}</button>
              <button className="calendar-today" disabled={savingEdit} onClick={() => setEditing(false)}>{t('cancel')}</button>
            </div>
            {editStatus && <p className="settings-status" role="status">{editStatus}</p>}
          </div>
        ) : selected ? (
          <div className="metric-grid">
            {metrics.map(metric => {
              const achieved = selected.achieved[metric.key]
              const goal = selected.goals[metric.key]
              const percent = goal ? Math.round(achieved / goal * 100) : 0
              return <article className="metric-card" key={metric.key}>
                <span className="metric-dot" style={{ background: metric.color }} />
                <h3>{t(metric.key)}</h3>
                <p><strong>{Math.round(achieved).toLocaleString()}</strong> / {Math.round(goal).toLocaleString()} {metric.unit}</p>
                <div className="metric-track"><span style={{ width: `${Math.min(100, percent)}%` }} /></div>
                <small>{percent}% {t('ofGoal')}</small>
              </article>
            })}
          </div>
        ) : <p className="calendar-no-day">{t('noProgress')}</p>}
      </section>
    </main>
  )
}
