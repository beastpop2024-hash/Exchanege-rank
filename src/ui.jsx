import React from 'react'
import { theme } from './theme.js'

export function Sparkline({ points, positive, width = 96, height = 30 }) {
  if (!points || points.length < 2) return <span style={{ color: theme.textFaint }}>—</span>
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const step = width / (points.length - 1)
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(height - ((p - min) / span) * height).toFixed(1)}`)
    .join(' ')
  const stroke = positive ? theme.up : theme.down
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ src, alt, size = 28, rounded = 8 }) {
  const [failed, setFailed] = React.useState(false)
  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: rounded,
          background: theme.surfaceAlt,
          border: `1px solid ${theme.border}`,
          display: 'grid',
          placeItems: 'center',
          color: theme.textFaint,
          fontSize: size * 0.42,
          fontWeight: 700,
          flex: '0 0 auto',
        }}
      >
        {(alt || '?').slice(0, 1).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={`${alt} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        objectFit: 'contain',
        background: '#fff',
        border: `1px solid ${theme.border}`,
        flex: '0 0 auto',
      }}
    />
  )
}

export function Delta({ value, size = 14 }) {
  if (value == null || Number.isNaN(value)) return <span style={{ color: theme.textFaint }}>—</span>
  const positive = value >= 0
  return (
    <span style={{ color: positive ? theme.up : theme.down, fontSize: size, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  )
}

export function ScorePill({ score }) {
  if (score == null) return <span style={{ color: theme.textFaint }}>—</span>
  const tone = score >= 9 ? theme.up : score >= 7 ? theme.accent : theme.warn
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 999,
        background: `${tone}1a`,
        color: tone,
        fontWeight: 700,
        fontSize: 13,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {score.toFixed(1)}
      <span style={{ fontWeight: 500, opacity: 0.75, fontSize: 11 }}>/10</span>
    </span>
  )
}

export function Tag({ children, tone = theme.textMuted }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 6,
        border: `1px solid ${theme.border}`,
        background: theme.surfaceAlt,
        color: tone,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

export function SkeletonRows({ rows = 8, cols = 6 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} style={{ borderTop: `1px solid ${theme.borderSoft}` }}>
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c} style={{ padding: '14px 16px' }}>
          <div className="skeleton" style={{ height: 12, width: c === 1 ? '70%' : '45%' }} />
        </td>
      ))}
    </tr>
  ))
}
