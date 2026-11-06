import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useActiveProfile, useNagaStore } from '../store/useNagaStore'
import { BUTTON_ACTION_IDS, MOUSE_BUTTONS } from '../lib/constants'
import { SidePlateDiagram, type SlotState } from './SidePlateDiagram'
import {
  SIDE_PLATE_BUTTON_COUNT,
  SIDE_PLATE_IDS,
  WHEEL_TILT_ACTIONS,
  baseDefaultValue,
  isWheelTilt,
} from '../../electron/buttonLayout'
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
  const tiltButtons = baseButtons.filter(isWheelTilt)
  const fixedButtons = baseButtons.filter((button) => !isWheelTilt(button))
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
      <section className="group">
        <header className="group-head">
          <h3 className="group-title">{t('buttons.plateTitle')}</h3>
          <span className="group-aside">{t('buttons.plateFitted')}</span>
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
                <SidePlateDiagram
                  plate={plate}
                  ariaLabel={t(`sidePlates.${plate}.label`)}
                />
                <span className="plate-option-text">
                  <span className="plate-option-title">
                    {t(`sidePlates.${plate}.label`)}
                    {active && <Check size={13} className="plate-option-check" aria-hidden />}
                  </span>
                  <span className="plate-option-sub">{t(`sidePlates.${plate}.subtitle`)}</span>
                  <span className="plate-option-count">
                    {SIDE_PLATE_BUTTON_COUNT[plate]} {t('performance.plateButtons')}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <p className="group-caption">{t('buttons.plateNote')}</p>
      </section>

      <section className="group">
        <header className="group-head">
          <h3 className="group-title">
            {t('buttons.sideTitle', { count: sideButtons.length })}
          </h3>
          {unresolvedCount > 0 && (
            <span className="group-aside warn">
              <TriangleAlert size={13} />
              {t('buttons.unresolvedBadge', { count: unresolvedCount })}
            </span>
          )}
        </header>

        <div className="group-box side-layout">
          <div className="side-diagram">
            <SidePlateDiagram
              plate={profile.sidePlate}
              variant="full"
              slots={slotStates}
              selectedIndex={selectedIndex}
              onSelect={selectSlot}
              ariaLabel={t('buttons.diagramAria')}
            />
            <ul className="tone-legend" aria-label={t('buttons.legendAria')}>
              <li className="tone-key">{t('actions.key')}</li>
              <li className="tone-macro">{t('actions.macro')}</li>
              <li className="tone-off">{t('buttons.legendOther')}</li>
              <li className="tone-invalid">{t('buttons.legendInvalid')}</li>
            </ul>
            <p className="diagram-hint">{t('buttons.diagramHint')}</p>
          </div>

          <div className="binding-list">
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
      </section>

      <section className="group">
        <header className="group-head">
          <h3 className="group-title">{t('buttons.tiltTitle')}</h3>
        </header>
        <div className="group-box binding-list">
          {tiltButtons.map((button) => (
            <BindingRow
              key={button.id}
              binding={button}
              macros={profile.macros}
              onChange={updateButton}
              actions={WHEEL_TILT_ACTIONS}
              defaultText={t(`buttons.tiltDefault.${button.id}`)}
            />
          ))}
        </div>
        <p className="group-caption">{t('buttons.tiltNote')}</p>
      </section>

      <section className="group">
        <header className="group-head">
          <h3 className="group-title">{t('buttons.baseTitle')}</h3>
          <span className="group-aside">
            {t('buttons.bindingCount', { count: fixedButtons.length })}
          </span>
        </header>
        <div className="group-box binding-list">
          {fixedButtons.map((button) => (
            <BindingRow
              key={button.id}
              binding={button}
              macros={profile.macros}
              onChange={updateButton}
              readOnly
            />
          ))}
        </div>
        <p className="group-caption">{t('buttons.baseNote')}</p>
      </section>

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
  /** Actions offered in the picker; defaults to every action. */
  actions?: readonly ButtonActionKind[]
  /** Text shown for the `default` action instead of the stored value. */
  defaultText?: string
  /** The firmware cannot rebind this button: show what it does, no picker. */
  readOnly?: boolean
}

function BindingRow({
  binding,
  macros,
  onChange,
  selected,
  onFocus,
  actions = BUTTON_ACTION_IDS,
  defaultText,
  readOnly = false,
}: BindingRowProps) {
  const { t, i18n } = useTranslation()
  const rowRef = useRef<HTMLDivElement>(null)
  const showInput = needsValue(binding.action)
  const unresolved = isUnresolvedKey(binding)

  // Resolve base button labels through i18n; the stored label is the fallback (e.g. custom side button names).
  const labelKey = `buttons.labels.${binding.id}`
  const displayLabel = i18n.exists(labelKey) ? (t(labelKey) as string) : binding.label

  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const label = (
    <div className="binding-label">
      <span className="binding-index numeric">{binding.hardwareIndex}</span>
      <span className="binding-name">{displayLabel}</span>
    </div>
  )

  if (readOnly) {
    return (
      <div className="row binding-row readonly">
        {label}
        <div className="binding-static">{binding.value}</div>
      </div>
    )
  }

  const changeAction = (action: ButtonActionKind) => {
    let value = binding.value
    if (action === 'mouse-button') value = 'Mouse 4'
    // Drop leftovers such as a macro id or "Browser ←", but keep a key that still works.
    else if (action === 'key' && resolveHidCode(value) === undefined) value = ''
    else if (action === 'default') value = baseDefaultValue(binding.id) ?? value
    onChange({ ...binding, action, value })
  }

  const staticText =
    binding.action === 'default' && defaultText
      ? defaultText
      : binding.action === 'disabled'
        ? ''
        : binding.value

  return (
    <div
      ref={rowRef}
      className={`row binding-row ${selected ? 'selected' : ''} ${unresolved ? 'invalid' : ''}`}
      onFocusCapture={onFocus}
    >
      {label}
      <select
        value={binding.action}
        onChange={(event) => changeAction(event.target.value as ButtonActionKind)}
      >
        {actions.map((action) => (
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
        <div className="binding-static">{staticText}</div>
      )}
    </div>
  )
}
