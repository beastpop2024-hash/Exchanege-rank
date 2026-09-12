export const fmtUsd = (value, opts = {}) => {
  if (value == null || Number.isNaN(value)) return '—'
  const { compact = false, maxFrac } = opts
  if (compact) {
    return (
      '$' +
      new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
    )
  }
  const digits =
    maxFrac != null ? maxFrac : value >= 1000 ? 0 : value >= 1 ? 2 : value >= 0.01 ? 4 : 8
  return (
    '$' +
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(
      value,
    )
  )
}

export const fmtNum = (value, opts = {}) => {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    notation: opts.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts.maximumFractionDigits ?? (opts.compact ? 2 : 0),
  }).format(value)
}

export const fmtPct = (value) => {
  if (value == null || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export const fmtTime = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return '—'
  }
}
