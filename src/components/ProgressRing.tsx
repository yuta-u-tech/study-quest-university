interface ProgressRingProps {
  /** 0..1 */
  ratio: number
  size?: number
  label?: string
}

export default function ProgressRing({ ratio, size = 52, label }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, ratio))
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const percent = Math.round(clamped * 100)

  return (
    <svg
      className="progress-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label ?? `習得率 ${percent}%`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--ring-track)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--ring-fill)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - clamped)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="52%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="progress-ring-text"
      >
        {percent}%
      </text>
    </svg>
  )
}
