import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useActiveProfile, useNagaStore } from '../store/useNagaStore'
import type { MacroRepeatMode, MacroStep, MacroStepType } from '../../electron/types'

const REPEAT_MODE_IDS: readonly MacroRepeatMode[] = ['once', 'count', 'while-held', 'toggle']
const STEP_TYPE_IDS: readonly MacroStepType[] = ['key', 'text', 'mouse', 'delay']

const stepPreview = (step: MacroStep) => {
  if (step.type === 'delay') return `${step.delayMs} ms`
  if (step.type === 'text') return `"${step.value}"`
  return step.value || step.type
}

export function MacrosPanel() {
  const { t } = useTranslation()
  const profile = useActiveProfile()
  const addMacro = useNagaStore((state) => state.addMacro)
  const updateMacro = useNagaStore((state) => state.updateMacro)
  const removeMacro = useNagaStore((state) => state.removeMacro)
  const addMacroStep = useNagaStore((state) => state.addMacroStep)
  const updateMacroStep = useNagaStore((state) => state.updateMacroStep)
  const removeMacroStep = useNagaStore((state) => state.removeMacroStep)

  return (
    <div className="section macros-section">
      <section className="group">
        <header className="group-head">
          <h3 className="group-title">
            {t('macros.title')}
            <span className="group-count numeric">{profile.macros.length}</span>
          </h3>
          <button type="button" className="btn-secondary" onClick={addMacro}>
            <Plus size={14} />
            {t('macros.newMacro')}
          </button>
        </header>

        {profile.macros.length === 0 ? (
          <div className="group-box empty">
            <strong>{t('macros.emptyTitle')}</strong>
            <p>{t('macros.emptyBody')}</p>
          </div>
        ) : (
          <div className="group-box macro-list">
            {profile.macros.map((macro) => (
              <article className="macro" key={macro.id}>
                <header className="macro-head">
                  <input
                    className="macro-name"
                    value={macro.name}
                    aria-label={t('macros.nameAria')}
                    onChange={(event) => updateMacro({ ...macro, name: event.target.value })}
                  />
                  <div className="macro-controls">
                    <select
                      value={macro.repeatMode}
                      aria-label={t('macros.repeatAria')}
                      onChange={(event) =>
                        updateMacro({
                          ...macro,
                          repeatMode: event.target.value as MacroRepeatMode,
                        })
                      }
                    >
                      {REPEAT_MODE_IDS.map((mode) => (
                        <option key={mode} value={mode}>
                          {t(`macros.repeatModes.${mode}`)}
                        </option>
                      ))}
                    </select>
                    {macro.repeatMode === 'count' && (
                      <input
                        className="macro-count"
                        type="number"
                        min={1}
                        max={999}
                        aria-label={t('macros.repeatCountAria')}
                        value={macro.repeatCount}
                        onChange={(event) =>
                          updateMacro({
                            ...macro,
                            repeatCount: Math.max(1, Number(event.target.value)),
                          })
                        }
                      />
                    )}
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeMacro(macro.id)}
                      aria-label={t('macros.deleteMacro')}
                      title={t('macros.deleteMacro')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </header>

                {macro.steps.length > 0 && (
                  <ol className="macro-preview" aria-label={t('macros.sequenceAria')}>
                    {macro.steps.map((step) => (
                      <li key={step.id} className="token">
                        {stepPreview(step)}
                      </li>
                    ))}
                  </ol>
                )}

                <div className="step-list">
                  {macro.steps.map((step, index) => (
                    <StepRow
                      key={step.id}
                      index={index + 1}
                      step={step}
                      onChange={(next) => updateMacroStep(macro.id, next)}
                      onRemove={() => removeMacroStep(macro.id, step.id)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-plain add-step"
                  onClick={() => addMacroStep(macro.id)}
                >
                  <Plus size={13} />
                  {t('macros.addStep')}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

interface StepRowProps {
  index: number
  step: MacroStep
  onChange(step: MacroStep): void
  onRemove(): void
}

function StepRow({ index, step, onChange, onRemove }: StepRowProps) {
  const { t } = useTranslation()

  const placeholder =
    step.type === 'text'
      ? t('macros.stepPlaceholderText')
      : step.type === 'mouse'
        ? t('macros.stepPlaceholderMouse')
        : t('macros.stepPlaceholderKey')

  return (
    <div className="step-row">
      <span className="step-index numeric">{index}</span>
      <select
        value={step.type}
        aria-label={t('macros.stepTypeAria', { n: index })}
        onChange={(event) =>
          onChange({ ...step, type: event.target.value as MacroStepType })
        }
      >
        {STEP_TYPE_IDS.map((type) => (
          <option key={type} value={type}>
            {t(`macros.stepTypes.${type}`)}
          </option>
        ))}
      </select>
      {step.type === 'delay' ? (
        <label className="input-with-unit">
          <input
            type="number"
            min={0}
            max={5000}
            value={step.delayMs}
            onChange={(event) =>
              onChange({ ...step, delayMs: Math.max(0, Number(event.target.value)) })
            }
          />
          <span className="unit">ms</span>
        </label>
      ) : (
        <input
          value={step.value}
          placeholder={placeholder}
          onChange={(event) => onChange({ ...step, value: event.target.value })}
        />
      )}
      <button
        type="button"
        className="icon-btn"
        onClick={onRemove}
        aria-label={t('macros.removeStep')}
        title={t('macros.removeStep')}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
