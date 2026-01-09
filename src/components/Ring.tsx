export function Ring({
  value,
  goal,
  label,
  color
}: {
  value: number
  goal: number
  label: string
  color: string
}) {
  const percent = (value / goal) * 100
  const display = Math.round(percent)
  const ringFill = Math.min(100, percent)
  const stroke = 8
  const r = 42
  const c = 2 * Math.PI * r
  const offset = c - (ringFill / 100) * c

  return (
    <div style={{ width: 100, textAlign: 'center' }}>
      <svg width="100" height="100">
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div style={{ marginTop: -72, textAlign: 'center' }}>
  <div style={{ fontWeight: 700, fontSize: 18 }}>
    {display}%
  </div>
  <div style={{ fontSize: 11, color: '#6b7280' }}>
    {Math.round(value)} / {Math.round(goal)}
  </div>
</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>
        {label}
      </div>
    </div>
  )
}
