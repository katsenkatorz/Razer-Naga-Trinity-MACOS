import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Layers, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useActiveProfile, useNagaStore } from '../store/useNagaStore'
import { BUTTON_ACTION_IDS, MOUSE_BUTTONS } from '../lib/constants'
import { SidePlateDiagram, type SlotState } from './SidePlateDiagram'
import { SIDE_PLATE_BUTTON_COUNT, SIDE_PLATE_IDS } from '../../electron/buttonLayout'
import { HID_KEY_SUGGESTIONS, resolveHidCode } from '../../electron/hidKeys'
import type { ButtonActionKind, ButtonBinding, Macro } from '../../electron/types'

const KEY_DATALIST_ID = 'naga-hid-keys'

const needsValue = (action: ButtonActionKind) =>
  action === 'key' || action === 'mouse-button' || action === 'macro'

/** A key binding only reaches the hardware if the typed name maps to a HID Usage ID. */
const isUnresolvedKey = (binding: ButtonBinding) =>
  binding.action === 'key' && resolveHidCode(binding.value) === undefined

export function ButtonsPanel() {
  const { t } = useTranslation()
  const profile = useActiveProfile()
  const updateActive = useNagaStore((state) => state.updateActive)
  const setSidePlate = useNagaStore((state) => state.setSidePlate)

  // Selection is scoped to the profile + plate it was made on, so switching either one
  // drops it without an extra render pass.
  const selectionScope = `${profile.id}:${profile.sidePlate}`
  const [selection, setSelection] = useState<{ scope: string; index: number } | null>(null)
  const selectedIndex = selection?.scope === selectionScope ? selection.index : null
  const selectSlot = (index: number) => setSelection({ scope: selectionScope, index })

  const updateButton = (next: ButtonBinding) =>
    updateActive((current) => ({
      ...current,
      buttons: current.buttons.map((button) => (button.id === next.id ? next : button)),
    }))

  const baseButtons = profile.buttons.filter((button) => button.id.startsWith('base-'))
  const sideButtons = profile.buttons.filter((button) => button.id.startsWith('side-'))

  const slotStates = useMemo(() => {
    const map: Record<number, SlotState> = {}
    sideButtons.forEach((binding, index) => {
      const number = index + 1
      if (binding.action === 'macro') {
        const macro = profile.macros.find((entry) => entry.id === binding.macroId)
        map[number] = macro
          ? { text: macro.name, tone: 'macro' }
          : { text: t('buttons.slotNoMacro'), tone: 'invalid' }
        return
      }
      if (binding.action === 'disabled') {
        map[number] = { text: t('actions.disabled'), tone: 'off' }
        return
      }
      if (binding.action === 'key') {
        map[number] = {
          text: binding.value || t('buttons.slotEmpty'),
          tone: isUnresolvedKey(binding) ? 'invalid' : 'key',
        }
        return
      }
      map[number] = { text: t(`actions.${binding.action}`), tone: 'off' }
    })
    return map
  }, [sideButtons, profile.macros, t])

  const unresolvedCount = sideButtons.filter(isUnresolvedKey).length

  return (
    <div className="section buttons-section">
      <div className="card plate-picker-card">
        <header className="card-head">
          <div>
            <p className="eyebrow">
              <Layers size={12} /> {t('buttons.plateEyebrow')}
            </p>
            <h3>{t('buttons.plateTitle')}</h3>
          </div>
          <span className="badge muted">{t('buttons.plateFitted')}</span>
        </header>

        <div className="plate-picker">
          {SIDE_PLATE_IDS.map((plate) => {
            const active = profile.sidePlate === plate
            return (
              <button
                key={plate}
                type="button"
                className={`plate-option ${active ? 'active' : ''}`}
                onClick={() => setSidePlate(plate)}
                aria-pressed={active}
              >
                <span className="plate-option-check">{active && <Check size={13} />}</span>
                <SidePlateDiagram
                  plate={plate}
                  ariaLabel={t(`sidePlates.${plate}.label`)}
                />
                <strong>{t(`sidePlates.${plate}.label`)}</strong>
                <span>{t(`sidePlates.${plate}.subtitle`)}</span>
                <small>
                  {SIDE_PLATE_BUTTON_COUNT[plate]} {t('performance.plateButtons')}
                </small>
              </button>
            )
          })}
        </div>
        <p className="muted small">{t('buttons.plateNote')}</p>
      </div>

      <div className="card buttons-card side-buttons-card">
        <header className="card-head">
          <div>
            <p className="eyebrow">
              {t('buttons.sidePlateEyebrow')} {t(`sidePlates.${profile.sidePlate}.label`)}
            </p>
            <h3>{t('buttons.sideTitle', { count: sideButtons.length })}</h3>
          </div>
          {unresolvedCount > 0 && (
            <span className="badge warn">
              <TriangleAlert size={12} />
              {t('buttons.unresolvedBadge', { count: unresolvedCount })}
            </span>
          )}
        </header>

        <div className="side-layout">
          <div className="side-diagram">
            <SidePlateDiagram
              plate={profile.sidePlate}
              variant="full"
              slots={slotStates}
              selectedIndex={selectedIndex}
              onSelect={selectSlot}
              ariaLabel={t('buttons.diagramAria')}
            />
            <p className="diagram-hint">{t('buttons.diagramHint')}</p>
          </div>

          <div className="button-grid side">
            {sideButtons.map((button, index) => (
              <BindingRow
                key={button.id}
                binding={button}
                macros={profile.macros}
                onChange={updateButton}
                selected={selectedIndex === index + 1}
                onFocus={() => selectSlot(index + 1)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="card buttons-card">
        <header className="card-head">
          <div>
            <p className="eyebrow">{t('buttons.baseEyebrow')}</p>
            <h3>{t('buttons.baseTitle')}</h3>
          </div>
          <span className="badge muted">
            {baseButtons.length} {t('buttons.bindings')}
          </span>
        </header>
        <div className="button-grid">
          {baseButtons.map((button) => (
            <BindingRow
              key={button.id}
              binding={button}
              macros={profile.macros}
              onChange={updateButton}
            />
          ))}
        </div>
        <p className="muted small">{t('buttons.baseNote')}</p>
      </div>

      <datalist id={KEY_DATALIST_ID}>
        {HID_KEY_SUGGESTIONS.map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>
    </div>
  )
}

interface BindingRowProps {
  binding: ButtonBinding
  macros: Macro[]
  onChange(next: ButtonBinding): void
  selected?: boolean
  onFocus?(): void
}

function BindingRow({ binding, macros, onChange, selected, onFocus }: BindingRowProps) {
  const { t, i18n } = useTranslation()
  const rowRef = useRef<HTMLDivElement>(null)
  const showInput = needsValue(binding.action)
  const unresolved = isUnresolvedKey(binding)

  // Base-Button-Labels über i18n auflösen; gespeicherter Label dient als Fallback (z.B. für custom Side-Button-Namen).
  const labelKey = `buttons.labels.${binding.id}`
  const displayLabel = i18n.exists(labelKey) ? (t(labelKey) as string) : binding.label

  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div
      ref={rowRef}
      className={`binding-row ${selected ? 'selected' : ''} ${unresolved ? 'invalid' : ''}`}
      onFocusCapture={onFocus}
    >
      <div className="binding-label">
        <span className="binding-index">#{binding.hardwareIndex}</span>
        <strong>{displayLabel}</strong>
      </div>
      <select
        value={binding.action}
        onChange={(event) =>
          onChange({
            ...binding,
            action: event.target.value as ButtonActionKind,
            value: event.target.value === 'mouse-button' ? 'Mouse 4' : binding.value,
          })
        }
      >
        {BUTTON_ACTION_IDS.map((action) => (
          <option key={action} value={action}>
            {t(`actions.${action}`)}
          </option>
        ))}
      </select>
      {showInput && binding.action === 'macro' ? (
        <select
          value={binding.macroId ?? ''}
          onChange={(event) =>
            onChange({ ...binding, macroId: event.target.value, value: event.target.value })
          }
        >
          <option value="">{t('buttons.macroPick')}</option>
          {macros.map((macro) => (
            <option key={macro.id} value={macro.id}>
              {macro.name}
            </option>
          ))}
        </select>
      ) : showInput && binding.action === 'mouse-button' ? (
        <select
          value={binding.value}
          onChange={(event) => onChange({ ...binding, value: event.target.value })}
        >
          {MOUSE_BUTTONS.map((mouseButton) => (
            <option key={mouseButton} value={mouseButton}>
              {mouseButton}
            </option>
          ))}
        </select>
      ) : showInput ? (
        <div className="binding-input">
          <input
            list={binding.action === 'key' ? KEY_DATALIST_ID : undefined}
            value={binding.value}
            placeholder={binding.action === 'key' ? t('buttons.keyPlaceholder') : 'Mouse 4'}
            onChange={(event) => onChange({ ...binding, value: event.target.value })}
          />
          {unresolved && (
            <span className="binding-warning" title={t('buttons.unknownKeyHint')}>
              <TriangleAlert size={13} />
            </span>
          )}
        </div>
      ) : (
        <div className="binding-static">{binding.value || '·'}</div>
      )}
    </div>
  )
}
