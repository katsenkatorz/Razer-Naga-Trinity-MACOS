import { useTranslation } from 'react-i18next'
import type { LedZone, NagaProfile, RgbSettings } from '../../electron/types'

interface Props {
  profile: NagaProfile
}

const effectAnimation = (rgb: RgbSettings) => {
  switch (rgb.effect) {
    case 'off':
      return 'none'
    case 'breathing':
      return 'breathing'
    case 'spectrum':
      return 'spectrum'
    case 'wave':
      return 'wave'
    case 'reactive':
      return 'reactive'
    default:
      return 'static'
  }
}

// Top view of the mouse, front at the top. Only the two physical RGB zones (scroll wheel
// and logo) take the configured colour; everything else is plain line art.
const BODY_PATH =
  'M100 20C136 20 158 38 162 78C166 120 172 170 170 214C168 268 140 300 100 300' +
  'C62 300 34 274 32 222C30 176 34 120 38 78C42 38 64 20 100 20Z'

const WHEEL = { x: 91, y: 44, w: 18, h: 50 }
const LOGO = { cx: 100, cy: 218, r: 15 }
const LABEL_X = 204

export function MouseVisualizer({ profile }: Props) {
  const { t } = useTranslation()
  const { rgb } = profile
  const lit = rgb.effect !== 'off'
  const intensity = lit ? rgb.brightness / 100 : 0

  const zoneColor = (zone: LedZone): string | null => {
    const config = rgb.zones[zone]
    if (!lit || !config.enabled) return null
    return rgb.syncZones ? rgb.color : config.color
  }

  const zoneCaption = (zone: LedZone) => {
    const color = zoneColor(zone)
    if (!color) return t('effects.off.label')
    if (rgb.effect === 'spectrum' || rgb.effect === 'wave') return t(`effects.${rgb.effect}.label`)
    return color.toUpperCase()
  }

  const scrollColor = zoneColor('scroll')
  const logoColor = zoneColor('logo')
  const wheelMidY = WHEEL.y + WHEEL.h / 2

  return (
    <div className="mouse-visualizer" data-animation={effectAnimation(rgb)}>
      <svg viewBox="0 0 300 320" role="img" aria-label="Razer Naga Trinity">
        <path className="mv-outline" d={BODY_PATH} />

        {/* Primary button split and the rear edge of the button shells. */}
        <path className="mv-detail" d={`M100 20V${WHEEL.y - 2}`} />
        <path className="mv-detail" d={`M100 ${WHEEL.y + WHEEL.h + 2}V100`} />
        <path className="mv-detail" d="M36 124Q100 142 164 124" />

        {/* DPI buttons behind the wheel. */}
        <rect className="mv-detail" x={95} y={104} width={10} height={6} rx={2} />
        <rect className="mv-detail" x={95} y={113} width={10} height={6} rx={2} />

        {/* Thumb side: seam of the interchangeable side plate. */}
        <path className="mv-detail faint" d="M42 146C37 176 37 206 42 244" />

        <g className="zone scroll-zone">
          {scrollColor && (
            <rect
              x={WHEEL.x}
              y={WHEEL.y}
              width={WHEEL.w}
              height={WHEEL.h}
              rx={WHEEL.w / 2}
              fill={scrollColor}
              opacity={intensity}
            />
          )}
        </g>
        <rect
          className="mv-outline"
          x={WHEEL.x}
          y={WHEEL.y}
          width={WHEEL.w}
          height={WHEEL.h}
          rx={WHEEL.w / 2}
        />

        <circle className="mv-detail" cx={LOGO.cx} cy={LOGO.cy} r={LOGO.r + 7} />
        <g className="zone logo-zone">
          {logoColor && (
            <circle
              cx={LOGO.cx}
              cy={LOGO.cy}
              r={LOGO.r}
              fill={logoColor}
              opacity={intensity}
            />
          )}
        </g>
        <circle className="mv-outline" cx={LOGO.cx} cy={LOGO.cy} r={LOGO.r} />

        {/* Callouts, datasheet style. */}
        <g className="mv-callout">
          <circle cx={WHEEL.x + WHEEL.w + 3} cy={wheelMidY} r={1.6} />
          <path d={`M${WHEEL.x + WHEEL.w + 3} ${wheelMidY}H${LABEL_X - 6}`} />
          <text className="mv-label" x={LABEL_X} y={wheelMidY - 2}>
            {t('zones.scroll.label')}
          </text>
          <text className="mv-value" x={LABEL_X} y={wheelMidY + 12}>
            {zoneCaption('scroll')}
          </text>
        </g>
        <g className="mv-callout">
          <circle cx={LOGO.cx + LOGO.r + 3} cy={LOGO.cy} r={1.6} />
          <path d={`M${LOGO.cx + LOGO.r + 3} ${LOGO.cy}H${LABEL_X - 6}`} />
          <text className="mv-label" x={LABEL_X} y={LOGO.cy - 2}>
            {t('zones.logo.label')}
          </text>
          <text className="mv-value" x={LABEL_X} y={LOGO.cy + 12}>
            {zoneCaption('logo')}
          </text>
        </g>
      </svg>
    </div>
  )
}
