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
  const percent = goal ? Math.round((value / goal) * 100) : 0
 
 return (
  <div style={{ textAlign: 'center', width: '100%' }}>
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1'
      }}
    >
      <svg viewBox="0 0 120 120" style={{ width: '100%' }}>
        <circle
          cx="60"
          cy="60"
          r="52"
          stroke="#e5e7eb"
          strokeWidth="10"
          fill="none"
        />

        <circle
          cx="60"
          cy="60"
          r="52"
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={`${percent * 3.26} 326`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </svg>

      {/* CENTER TEXT */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700
        }}
      >
        <div style={{ fontSize: 20 }}>{percent}%</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {value.toFixed(0)} / {goal.toFixed(0)}
        </div>
      </div>
    </div>

    {/* LABEL BELOW */}
    <div style={{ marginTop: 6, fontSize: 14, color: '#374151' }}>
      {label}
    </div>
  </div>
)
}
