import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useActiveProfile, useNagaStore } from '../store/useNagaStore'
import { DPI_PRESETS, POLLING_RATES } from '../lib/constants'
import { rangeFill } from '../lib/rangeFill'
import type { PollingRate } from '../../electron/types'

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 11)}`

export function PerformancePanel() {
  const { t } = useTranslation()
  const profile = useActiveProfile()
  const updateActive = useNagaStore((state) => state.updateActive)
  const { dpi, pollingRate } = profile

  const activeStage = dpi.stages[dpi.activeStage - 1] ?? dpi.stages[0]

  const setStageValue = (stageIndex: number, axis: 'x' | 'y', value: number, link = true) => {
    updateActive((current) => ({
      ...current,
      dpi: {
        ...current.dpi,
        stages: current.dpi.stages.map((stage, index) => {
          if (index !== stageIndex) return stage
          if (link) return { ...stage, x: value, y: value }
          return { ...stage, [axis]: value }
        }),
      },
    }))
  }

  const addStage = () => {
    if (dpi.stages.length >= 5) return
    updateActive((current) => ({
      ...current,
      dpi: {
        ...current.dpi,
        stages: [...current.dpi.stages, { id: newId(), x: 3200, y: 3200 }],
      },
    }))
  }

  const removeStage = (id: string) => {
    if (dpi.stages.length <= 1) return
    updateActive((current) => {
      const stages = current.dpi.stages.filter((stage) => stage.id !== id)
      const active = Math.min(current.dpi.activeStage, stages.length)
      return { ...current, dpi: { stages, activeStage: active || 1 } }
    })
  }

  const setActiveStage = (index: number) => {
    updateActive((current) => ({
      ...current,
      dpi: { ...current.dpi, activeStage: index + 1 },
    }))
  }

  const activeRate = POLLING_RATES.find((rate) => rate.value === pollingRate)

  return (
    <div className="section performance-section">
      <section className="group">
        <header className="group-head">
          <h3 className="group-title">{t('performance.dpiStagesTitle')}</h3>
          <button
            type="button"
            className="btn-plain"
            onClick={addStage}
            disabled={dpi.stages.length >= 5}
          >
            <Plus size={14} />
            {t('performance.addStage')}
          </button>
        </header>

        <div className="group-box">
          <div className="dpi-hero">
            <div className="dpi-value">
              <span className="dpi-figure numeric">{activeStage?.x ?? 1800}</span>
              <span className="unit">DPI</span>
            </div>
            <div className="dpi-meta">
              <span>{t('performance.activeDpiCaption', { n: dpi.activeStage })}</span>
              <span className="numeric">
                X {activeStage?.x ?? 0}, Y {activeStage?.y ?? 0}
              </span>
            </div>
          </div>

          <div className="stage-list">
            {dpi.stages.map((stage, index) => {
              const isActive = index + 1 === dpi.activeStage
              const inputId = `dpi-stage-${stage.id}`
              return (
                <div className={`row stage-row ${isActive ? 'active' : ''}`} key={stage.id}>
                  <button
                    type="button"
                    className="stage-marker"
                    onClick={() => setActiveStage(index)}
                    aria-pressed={isActive}
                    aria-label={t('performance.stageActivateAria', { n: index + 1 })}
                  >
                    {index + 1}
                  </button>
                  <label className="stage-input" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="number"
                      min={100}
                      max={16000}
                      step={50}
                      value={stage.x}
                      onChange={(event) =>
                        setStageValue(index, 'x', Number(event.target.value), true)
                      }
                    />
                    <span className="unit">DPI</span>
                  </label>
                  <input
                    type="range"
                    min={100}
                    max={16000}
                    step={50}
                    value={stage.x}
                    style={rangeFill(stage.x, 100, 16000)}
                    aria-label={t('performance.stageSliderAria', { n: index + 1 })}
                    onChange={(event) =>
                      setStageValue(index, 'x', Number(event.target.value), true)
                    }
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => removeStage(stage.id)}
                    disabled={dpi.stages.length <= 1}
                    aria-label={t('performance.removeStageAria')}
                    title={t('performance.removeStageAria')}
                  >
                    <Minus size={14} />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="row preset-row">
            <span className="row-label">{t('performance.quickSelect')}</span>
            <div className="segmented presets" role="group" aria-label={t('performance.quickSelect')}>
              {DPI_PRESETS.map((dpiValue) => (
                <button
                  key={dpiValue}
                  type="button"
                  className={activeStage?.x === dpiValue ? 'active' : ''}
                  aria-pressed={activeStage?.x === dpiValue}
                  onClick={() =>
                    updateActive((current) => ({
                      ...current,
                      dpi: {
                        ...current.dpi,
                        stages: current.dpi.stages.map((stage, index) =>
                          index === current.dpi.activeStage - 1
                            ? { ...stage, x: dpiValue, y: dpiValue }
                            : stage,
                        ),
                      },
                    }))
                  }
                >
                  {dpiValue}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="group-caption">{t('performance.stagesNote')}</p>
      </section>

      <section className="group">
        <h3 className="group-title">{t('performance.pollingTitle')}</h3>
        <div className="group-box">
          <div className="row">
            <div className="row-text">
              <span className="row-label">{t('performance.pollingLabel')}</span>
              {activeRate && <span className="row-caption">{t(activeRate.sublabelKey)}</span>}
            </div>
            <div className="segmented" role="group" aria-label={t('performance.pollingTitle')}>
              {POLLING_RATES.map((rate) => (
                <button
                  key={rate.value}
                  type="button"
                  className={pollingRate === rate.value ? 'active' : ''}
                  aria-pressed={pollingRate === rate.value}
                  title={t(rate.sublabelKey)}
                  onClick={() =>
                    updateActive((current) => ({
                      ...current,
                      pollingRate: rate.value as PollingRate,
                    }))
                  }
                >
                  <span className="numeric">{rate.value}</span>
                  <span className="unit">Hz</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="group-caption">{t('performance.pollingNote')}</p>
      </section>
    </div>
  )
}
