import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveProfile, useNagaStore } from '../store/useNagaStore'
import { MouseVisualizer } from './MouseVisualizer'
import { Switch } from './Switch'
import { COLOR_SWATCHES, REACTIVE_SPEEDS, RGB_EFFECT_IDS } from '../lib/constants'
import { rangeFill } from '../lib/rangeFill'
import type {
  LedZone,
  ReactiveSpeed,
  RgbEffect,
  WaveDirection,
} from '../../electron/types'

const ZONE_IDS: readonly LedZone[] = ['logo', 'scroll', 'side']

interface ColorRowProps {
  label: string
  value: string
  swatchAria: string
  disabled?: boolean
  onChange(color: string): void
}

function ColorRow({ label, value, swatchAria, disabled, onChange }: ColorRowProps) {
  return (
    <div className="row color-row">
      <span className="row-label">{label}</span>
      <div className="row-control">
        <div className="swatches">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={`swatch ${value === swatch ? 'selected' : ''}`}
              style={{ background: swatch }}
              aria-label={`${swatchAria} ${swatch}`}
              aria-pressed={value === swatch}
              onClick={() => onChange(swatch)}
            />
          ))}
        </div>
        <input
          type="color"
          value={value}
          aria-label={label}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="hex-value">{value.toUpperCase()}</span>
      </div>
    </div>
  )
}

export function LightingPanel() {
  const { t } = useTranslation()
  const profile = useActiveProfile()
  const updateRgb = useNagaStore((state) => state.updateRgb)
  const { rgb } = profile
  const brightnessId = useId()

  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!window.naga?.previewRgb) return
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(() => {
      void window.naga.previewRgb(rgb)
    }, 240)
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
  }, [rgb])

  const usesSecondary = rgb.effect === 'breathing'
  const usesWaveDirection = rgb.effect === 'wave'
  const usesReactiveSpeed = rgb.effect === 'reactive'
  const supportsColor =
    rgb.effect === 'static' || rgb.effect === 'breathing' || rgb.effect === 'reactive'

  return (
    <div className="section lighting-section">
      <section className="group lighting-preview">
        <h3 className="group-title">{t('lighting.previewTitle')}</h3>
        <div className="group-box preview-box">
          <MouseVisualizer profile={profile} />
          <div className="preview-caption">
            <strong>{t(`effects.${rgb.effect}.label`)}</strong>
            <span>{t(`effects.${rgb.effect}.description`)}</span>
          </div>
        </div>
      </section>

      <div className="lighting-settings">
        <section className="group">
          <h3 className="group-title">{t('lighting.effectTitle')}</h3>
          <div className="effect-grid" role="group" aria-label={t('lighting.effectTitle')}>
            {RGB_EFFECT_IDS.map((effectId) => (
              <button
                key={effectId}
                type="button"
                className={`effect-tile ${rgb.effect === effectId ? 'active' : ''}`}
                aria-pressed={rgb.effect === effectId}
                onClick={() =>
                  updateRgb((current) => ({ ...current, effect: effectId as RgbEffect }))
                }
              >
                <span className="effect-label">{t(`effects.${effectId}.label`)}</span>
                <span className="effect-description">{t(`effects.${effectId}.description`)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="group">
          <h3 className="group-title">{t('lighting.colorTitle')}</h3>
          <div className="group-box">
            <ColorRow
              label={t('lighting.primaryColor')}
              value={rgb.color}
              swatchAria={t('lighting.colorAria')}
              disabled={!supportsColor && rgb.effect !== 'spectrum'}
              onChange={(color) => updateRgb((current) => ({ ...current, color }))}
            />

            {usesSecondary && (
              <ColorRow
                label={t('lighting.secondaryColor')}
                value={rgb.secondaryColor}
                swatchAria={t('lighting.secondaryColorAria')}
                onChange={(color) =>
                  updateRgb((current) => ({ ...current, secondaryColor: color }))
                }
              />
            )}

            <div className="row">
              <label className="row-label" htmlFor={brightnessId}>
                {t('lighting.brightness')}
              </label>
              <div className="row-control slider-control">
                <input
                  id={brightnessId}
                  type="range"
                  min={0}
                  max={100}
                  value={rgb.brightness}
                  style={rangeFill(rgb.brightness, 0, 100)}
                  onChange={(event) =>
                    updateRgb((current) => ({
                      ...current,
                      brightness: Number(event.target.value),
                    }))
                  }
                />
                <output htmlFor={brightnessId} className="numeric">
                  {rgb.brightness}
                  <span className="unit">%</span>
                </output>
              </div>
            </div>

            {usesWaveDirection && (
              <div className="row">
                <span className="row-label">{t('lighting.waveDirection')}</span>
                <div className="segmented" role="group" aria-label={t('lighting.waveDirection')}>
                  {(['left', 'right'] as WaveDirection[]).map((direction) => (
                    <button
                      key={direction}
                      type="button"
                      className={rgb.waveDirection === direction ? 'active' : ''}
                      aria-pressed={rgb.waveDirection === direction}
                      onClick={() =>
                        updateRgb((current) => ({ ...current, waveDirection: direction }))
                      }
                    >
                      {direction === 'left' ? t('lighting.waveLeft') : t('lighting.waveRight')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {usesReactiveSpeed && (
              <div className="row">
                <span className="row-label">{t('lighting.reactiveSpeed')}</span>
                <div className="segmented" role="group" aria-label={t('lighting.reactiveSpeed')}>
                  {REACTIVE_SPEEDS.map((speed) => (
                    <button
                      key={speed.value}
                      type="button"
                      className={rgb.reactiveSpeed === speed.value ? 'active' : ''}
                      aria-pressed={rgb.reactiveSpeed === speed.value}
                      onClick={() =>
                        updateRgb((current) => ({
                          ...current,
                          reactiveSpeed: speed.value as ReactiveSpeed,
                        }))
                      }
                    >
                      {t(speed.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="group">
          <h3 className="group-title">{t('lighting.zonesTitle')}</h3>
          <div className="group-box">
            <div className="row">
              <div className="row-text">
                <span className="row-label">{t('lighting.zonesSyncLabel')}</span>
                <span className="row-caption">{t('lighting.zonesSyncHint')}</span>
              </div>
              <Switch
                checked={rgb.syncZones}
                label={t('lighting.zonesSyncLabel')}
                onChange={(syncZones) => updateRgb((current) => ({ ...current, syncZones }))}
              />
            </div>

            {ZONE_IDS.map((zoneId) => {
              const zoneConfig = rgb.zones[zoneId]
              const zoneLabel = t(`zones.${zoneId}.label`)
              return (
                <div className={`row zone-row ${zoneConfig.enabled ? '' : 'disabled'}`} key={zoneId}>
                  <div className="row-text">
                    <span className="row-label">{zoneLabel}</span>
                    <span className="row-caption">{t(`zones.${zoneId}.description`)}</span>
                  </div>
                  <div className="row-control">
                    <input
                      type="color"
                      aria-label={`${zoneLabel} ${t('lighting.colorAria')}`}
                      value={rgb.syncZones ? rgb.color : zoneConfig.color}
                      disabled={rgb.syncZones || !zoneConfig.enabled}
                      onChange={(event) =>
                        updateRgb((current) => ({
                          ...current,
                          zones: {
                            ...current.zones,
                            [zoneId]: { ...current.zones[zoneId], color: event.target.value },
                          },
                        }))
                      }
                    />
                    <Switch
                      checked={zoneConfig.enabled}
                      label={zoneLabel}
                      onChange={(enabled) =>
                        updateRgb((current) => ({
                          ...current,
                          zones: {
                            ...current.zones,
                            [zoneId]: { ...current.zones[zoneId], enabled },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
