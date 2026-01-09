import { load, save } from './userData'

export interface Goals {
  protein: number
  carbs: number
  fats: number
  calories: number
}

export function getGoals() {
  return load<Goals>('goals', {
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0
  })
}

export function saveGoals(goals: Goals) {
  return save('goals', goals)
}
