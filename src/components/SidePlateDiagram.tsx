import type { SidePlate } from '../../electron/types'

// Physical layout of the three interchangeable Naga Trinity side plates, viewed from the
// left of the mouse. Sources: Razer Naga Trinity Master Guide (device layout L/M/N) and
// reviews of the 7-button plate, which describe a round thumb rest in the centre with the
// buttons numbered 3, 7, 6, 5, 4, 1, 2 going clockwise from the top.

export interface PlateSlot {
  /** 1-based physical button number. Matches the `side-${n}` binding id. */
  index: number
  cx: number
  cy: number
  w: number
  h: number
  rx: number
}

const VIEW_W = 120
const VIEW_H = 160

const buildTwo = (): PlateSlot[] => [
  { index: 1, cx: 60, cy: 52, w: 68, h: 50, rx: 13 },
  { index: 2, cx: 60, cy: 110, w: 68, h: 50, rx: 13 },
]

/** Clockwise from 12 o'clock, matching the numbering printed on the plate. */
const SEVEN_CLOCKWISE_ORDER = [3, 7, 6, 5, 4, 1, 2]
const SEVEN_CENTER = { x: 60, y: 80 }
const SEVEN_RADIUS = 44

const buildSeven = (): PlateSlot[] =>
  SEVEN_CLOCKWISE_ORDER.map((index, slot) => {
    const angle = (-90 + slot * (360 / SEVEN_CLOCKWISE_ORDER.length)) * (Math.PI / 180)
    return {
      index,
      cx: SEVEN_CENTER.x + SEVEN_RADIUS * Math.cos(angle),
      cy: SEVEN_CENTER.y + SEVEN_RADIUS * Math.sin(angle),
      w: 30,
      h: 30,
      rx: 15,
    }
  })

/** Numpad-style thumb grid: 3 columns by 4 rows, numbered left to right, top to bottom. */
const buildTwelve = (): PlateSlot[] =>
  Array.from({ length: 12 }, (_, i) => ({
    index: i + 1,
    cx: 24 + (i % 3) * 36,
    cy: 26 + Math.floor(i / 3) * 36,
    w: 30,
    h: 30,
    rx: 8,
  }))

const PLATE_SLOTS: Record<SidePlate, PlateSlot[]> = {
  two: buildTwo(),
  seven: buildSeven(),
  twelve: buildTwelve(),
}

export type SlotTone = 'key' | 'macro' | 'off' | 'invalid'

export interface SlotState {
  text?: string
  tone?: SlotTone
}

interface Props {
  plate: SidePlate
  variant?: 'mini' | 'full'
  /** Per-button summary keyed by physical button number. */
  slots?: Record<number, SlotState>
  selectedIndex?: number | null
  onSelect?(index: number): void
  ariaLabel?: string
}

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value

export function SidePlateDiagram({
  plate,
  variant = 'mini',
  slots,
  selectedIndex,
  onSelect,
  ariaLabel,
}: Props) {
  const layout = PLATE_SLOTS[plate]
  const interactive = variant === 'full' && Boolean(onSelect)

  return (
    <svg
      className={`plate-diagram ${variant} ${plate}`}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={ariaLabel ?? `Side plate ${plate}`}
    >
      <rect
        className="plate-body"
        x={1}
        y={1}
        width={VIEW_W - 2}
        height={VIEW_H - 2}
        rx={22}
      />

      {plate === 'seven' && (
        <circle
          className="plate-thumbrest"
          cx={SEVEN_CENTER.x}
          cy={SEVEN_CENTER.y}
          r={20}
        />
      )}

      {layout.map((slot) => {
        const state = slots?.[slot.index]
        const selected = selectedIndex === slot.index
        const unit = Math.min(slot.w, slot.h)
        const showText = variant === 'full' && Boolean(state?.text)
        const numberSize = showText ? unit * 0.3 : unit * 0.4
        const numberY = showText ? slot.cy - unit * 0.06 : slot.cy + unit * 0.14

        const classes = [
          'plate-slot',
          state?.tone ? `tone-${state.tone}` : '',
          selected ? 'selected' : '',
          interactive ? 'interactive' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <g
            key={slot.index}
            className={classes}
            onClick={interactive ? () => onSelect?.(slot.index) : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={
              interactive
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect?.(slot.index)
                    }
                  }
                : undefined
            }
          >
            <rect
              className="plate-slot-shape"
              x={slot.cx - slot.w / 2}
              y={slot.cy - slot.h / 2}
              width={slot.w}
              height={slot.h}
              rx={slot.rx}
            />
            <text
              className="plate-slot-number"
              x={slot.cx}
              y={numberY}
              textAnchor="middle"
              fontSize={numberSize}
            >
              {slot.index}
            </text>
            {showText && (
              <text
                className="plate-slot-value"
                x={slot.cx}
                y={slot.cy + unit * 0.3}
                textAnchor="middle"
                fontSize={unit * 0.22}
              >
                {truncate(state?.text ?? '', plate === 'two' ? 12 : 6)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
