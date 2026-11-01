import { useEffect, useState } from 'react'
import type { Meal } from '../storage/models'
import { MealCard } from '../components/MealCard'
import { AddMeal } from '../components/AddMeal'
import { getMeals, saveMeals } from '../storage/mealsDb'
import { getGoals, type Goals } from '../storage/goalsDb'
import { Ring } from '../components/Ring'
import { localDateKey, getDailyProgress, saveDailyProgress } from '../storage/dailyProgress'
import type { LanguageCode } from '../i18n'

export function Dashboard({ t, foodLanguage, language }: { t: (key: string) => string; foodLanguage: LanguageCode; language: string }) {
  const dateLocale = language === 'sr' ? 'sr-Latn' : language
  const [meals, setMeals] = useState<Meal[]>([])
  const [adding, setAdding] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [todaySaved, setTodaySaved] = useState(false)
  const [progressStatus, setProgressStatus] = useState('')

  const [goals, setGoals] = useState<Goals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  })

  const calorieGoal =
    goals.protein * 4 +
    goals.carbs * 4 +
    goals.fats * 9

  useEffect(() => {
    getGoals().then(setGoals)
  }, [])

  useEffect(() => {
    getDailyProgress().then(records => setTodaySaved(records.some(record => record.date === localDateKey())))
  }, [])

  useEffect(() => {
    getMeals().then(ms => {
      setMeals(ms)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    saveMeals(meals)
  }, [meals, loaded])

  const totals = meals.reduce(
    (acc, m) => {
      const factor = m.eaten
      acc.calories += m.foods.reduce((s, f) => s + f.calories, 0) * factor
      acc.protein += m.foods.reduce((s, f) => s + f.protein, 0) * factor
      acc.carbs += m.foods.reduce((s, f) => s + f.carbs, 0) * factor
      acc.fats += m.foods.reduce((s, f) => s + f.fats, 0) * factor
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

  async function saveToday() {
    setProgressStatus(t('saving'))
    try {
      await saveDailyProgress({
        date: localDateKey(),
        savedAt: new Date().toISOString(),
        goals: {
          calories: calorieGoal,
          protein: goals.protein,
          carbs: goals.carbs,
          fats: goals.fats
        },
        achieved: totals
      })
      setTodaySaved(true)
      setProgressStatus(t('progressSaved'))
    } catch {
      setProgressStatus(t('progressError'))
    }
  }

 return (
  <main className="today-page">
    <header className="today-heading">
      <div>
        <p className="calendar-eyebrow">{t('dailyOverview')}</p>
        <h1>{t('navToday')}</h1>
        <p>{new Date().toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>
      <div className="save-progress-area">
        <button className={`save-progress-button${todaySaved ? ' saved' : ''}`} onClick={saveToday}>
          {todaySaved ? `✓ ${t('updateToday')}` : `✓ ${t('saveToday')}`}
        </button>
        {progressStatus && <p role="status" className="progress-status">{progressStatus}</p>}
      </div>
    </header>

    <section className="progress-overview" aria-label={t('progressAria')}>
      <div className="progress-grid">
        <div className="progress-ring-card"><Ring label={t('calories')} value={totals.calories} goal={calorieGoal} color="#22c55e" /></div>
        <div className="progress-ring-card"><Ring label={t('protein')} value={totals.protein} goal={goals.protein} color="#16a34a" /></div>
        <div className="progress-ring-card"><Ring label={t('carbs')} value={totals.carbs} goal={goals.carbs} color="#2563eb" /></div>
        <div className="progress-ring-card"><Ring label={t('fats')} value={totals.fats} goal={goals.fats} color="#f59e0b" /></div>
      </div>
    </section>

    <section className="meals-section" id="meals">
      <div className="section-heading">
        <h2>{t('navMeals')}</h2>
        <button className="add-meal-button" onClick={() => setAdding(v => !v)}>
          {adding ? t('closeMealForm') : t('addMeal')}
        </button>
      </div>

    {adding && (
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 12,
          marginBottom: 16
        }}
      >
        <AddMeal
          t={t}
          foodLanguage={foodLanguage}
          onSave={meal => {
            setMeals(m => [...m, meal])
            setAdding(false)
          }}
          onClose={() => setAdding(false)}
        />
      </div>
    )}

    <div className="meal-list">
      {meals.map(meal => (
        <MealCard key={meal.id} meal={meal} update={setMeals} t={t} foodLanguage={foodLanguage} />
      ))}
      {!meals.length && <p className="empty-meals">{t('noMeals')}</p>}
    </div>
    </section>
  </main>
)
}
