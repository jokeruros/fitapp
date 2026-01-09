export function ProgressBar({
  label,
  value,
  goal,
  color
}: {
  label: string
  value: number
  goal: number
  color: string
}) {
  const percent = goal > 0 ? Math.min((value / goal) * 100, 100) : 0

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12 }}>
        {label}: {Math.round(value)} / {goal}
      </div>
      <div
        style={{
          background: '#e5e7eb',
          height: 10,
          borderRadius: 6
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: color,
            borderRadius: 6
          }}
        />
      </div>
    </div>
  )
}
