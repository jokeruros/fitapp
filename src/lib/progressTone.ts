export type ProgressTone = 'low' | 'on-target' | 'high' | 'unset'

export function getProgressTone(achieved: number, goal: number): ProgressTone {
  if (goal <= 0) return 'unset'
  const ratio = achieved / goal
  if (ratio < 0.75) return 'low'
  if (ratio > 1.1) return 'high'
  return 'on-target'
}

export function getProgressColor(achieved: number, goal: number) {
  switch (getProgressTone(achieved, goal)) {
    case 'low': return '#f59e0b'
    case 'on-target': return '#22c55e'
    case 'high': return '#ef4444'
    default: return '#94a3b8'
  }
}
