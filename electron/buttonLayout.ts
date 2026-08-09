// Single source of truth for the button layout. Previously duplicated between
// profileStore.ts and src/store/useNagaStore.ts, which meant the two copies had to be
// kept in sync by hand.

import type { ButtonBinding, SidePlate } from './types'

export const SIDE_PLATE_IDS: readonly SidePlate[] = ['two', 'seven', 'twelve']

export const SIDE_PLATE_BUTTON_COUNT: Record<SidePlate, number> = {
  two: 2,
  seven: 7,
  twelve: 12,
}

/**
 * Keys the mouse sends out of the box on each side-plate slot: 1-9, 0, -, =.
 * Mirrors RAZER_DEFAULT_SIDE_HID in nagaDriver.ts, so what the UI shows for a fresh
 * profile is exactly what gets written to the EEPROM.
 */
export const RAZER_DEFAULT_SIDE_KEYS: readonly string[] = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=',
]

const SIDE_LABEL_PREFIX: Record<SidePlate, string> = {
  two: 'Thumb',
  seven: 'Ring',
  twelve: 'Numpad',
}

export const BASE_BUTTONS: ReadonlyArray<{
  label: string
  action: ButtonBinding['action']
  value: string
}> = [
  { label: 'Left Click', action: 'default', value: 'Mouse 1' },
  { label: 'Right Click', action: 'default', value: 'Mouse 2' },
  { label: 'Scroll Click', action: 'default', value: 'Mouse 3' },
  { label: 'Scroll Up', action: 'default', value: 'Wheel ↑' },
  { label: 'Scroll Down', action: 'default', value: 'Wheel ↓' },
  { label: 'Wheel Tilt Left', action: 'default', value: 'Browser ←' },
  { label: 'Wheel Tilt Right', action: 'default', value: 'Browser →' },
  { label: 'DPI Up', action: 'dpi-up', value: 'DPI +' },
  { label: 'DPI Down', action: 'dpi-down', value: 'DPI -' },
]

export const isSideButton = (button: ButtonBinding) => button.id.startsWith('side-')
export const isBaseButton = (button: ButtonBinding) => button.id.startsWith('base-')

export const buildBaseButtons = (): ButtonBinding[] =>
  BASE_BUTTONS.map((entry, index) => ({
    id: `base-${index + 1}`,
    label: entry.label,
    hardwareIndex: index + 1,
    action: entry.action,
    value: entry.value,
  }))

export const buildSideButtons = (plate: SidePlate): ButtonBinding[] =>
  Array.from({ length: SIDE_PLATE_BUTTON_COUNT[plate] }, (_, index) => ({
    id: `side-${index + 1}`,
    label: `${SIDE_LABEL_PREFIX[plate]} ${index + 1}`,
    hardwareIndex: 10 + index,
    action: 'key' as const,
    value: RAZER_DEFAULT_SIDE_KEYS[index],
  }))

export const buildButtonsForPlate = (plate: SidePlate): ButtonBinding[] => [
  ...buildBaseButtons(),
  ...buildSideButtons(plate),
]

export type SidePlateBindings = Record<SidePlate, ButtonBinding[]>

/** Fresh per-plate binding set, so switching plates never wipes the other two. */
export const buildSidePlateBindings = (): SidePlateBindings => ({
  two: buildSideButtons('two'),
  seven: buildSideButtons('seven'),
  twelve: buildSideButtons('twelve'),
})

/**
 * Rebuilds the per-plate map from a profile, keeping stored bindings when they still
 * match the plate's button count and falling back to defaults otherwise.
 */
export const normalizeSidePlateBindings = (
  stored: Partial<SidePlateBindings> | undefined,
  activePlate: SidePlate,
  activeButtons: ButtonBinding[],
): SidePlateBindings => {
  const defaults = buildSidePlateBindings()
  const result = { ...defaults }

  for (const plate of SIDE_PLATE_IDS) {
    const entry = stored?.[plate]
    if (Array.isArray(entry) && entry.length === SIDE_PLATE_BUTTON_COUNT[plate]) {
      result[plate] = entry
    }
  }

  // The active plate is always authoritative from `buttons` - that's what the UI edits.
  const activeSide = activeButtons.filter(isSideButton)
  if (activeSide.length === SIDE_PLATE_BUTTON_COUNT[activePlate]) {
    result[activePlate] = activeSide
  }

  return result
}
