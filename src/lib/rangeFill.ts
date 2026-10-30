import type { CSSProperties } from 'react'

/** Custom property that sizes the accent-filled part of a styled range track. */
export const rangeFill = (value: number, min: number, max: number): CSSProperties => {
  const ratio = max > min ? (value - min) / (max - min) : 0
  const percent = Math.min(100, Math.max(0, ratio * 100))
  return { '--fill': `${percent}%` } as CSSProperties
}
