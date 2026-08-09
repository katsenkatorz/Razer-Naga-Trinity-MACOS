// HID Usage Table, Keyboard/Keypad page (0x07). These are the Usage IDs the Naga
// firmware expects in byte[14] of a button-binding report (cls 0x02 cmd 0x0c).
//
// Without this table `buildSideBindings` had no way to turn a user-typed key name
// ("F1", "a", "Home") into a keycode, so every non-macro side button silently fell
// back to the Razer factory default. That was the "my F1..F12 bindings are ignored" bug.

/** Usage ID 0x00 = "no event". Written when a side button is disabled. */
export const HID_NONE = 0x00

const LETTERS: Record<string, number> = {}
for (let i = 0; i < 26; i += 1) {
  LETTERS[String.fromCharCode(97 + i)] = 0x04 + i
}

const FUNCTION_KEYS: Record<string, number> = {}
for (let i = 1; i <= 12; i += 1) {
  FUNCTION_KEYS[`f${i}`] = 0x39 + i // F1 = 0x3a
}
for (let i = 13; i <= 24; i += 1) {
  FUNCTION_KEYS[`f${i}`] = 0x68 + (i - 13) // F13 = 0x68
}

const NUMPAD: Record<string, number> = {
  numlock: 0x53,
  'numpad/': 0x54,
  'numpad*': 0x55,
  'numpad-': 0x56,
  'numpad+': 0x57,
  numpadenter: 0x58,
  numpad0: 0x62,
  'numpad.': 0x63,
}
for (let i = 1; i <= 9; i += 1) {
  NUMPAD[`numpad${i}`] = 0x58 + i // Numpad 1 = 0x59
}

/**
 * Canonical name -> HID Usage ID. Keys are already normalised
 * (lowercase, inner whitespace/underscores stripped).
 */
export const HID_KEY_CODES: Readonly<Record<string, number>> = {
  ...LETTERS,
  ...FUNCTION_KEYS,
  ...NUMPAD,

  // Digit row
  '1': 0x1e,
  '2': 0x1f,
  '3': 0x20,
  '4': 0x21,
  '5': 0x22,
  '6': 0x23,
  '7': 0x24,
  '8': 0x25,
  '9': 0x26,
  '0': 0x27,

  // Control / whitespace
  enter: 0x28,
  return: 0x28,
  escape: 0x29,
  esc: 0x29,
  backspace: 0x2a,
  tab: 0x2b,
  space: 0x2c,
  spacebar: 0x2c,

  // Punctuation
  '-': 0x2d,
  minus: 0x2d,
  '=': 0x2e,
  equal: 0x2e,
  '[': 0x2f,
  ']': 0x30,
  '\\': 0x31,
  ';': 0x33,
  "'": 0x34,
  '`': 0x35,
  ',': 0x36,
  '.': 0x37,
  '/': 0x38,

  capslock: 0x39,

  // Navigation cluster
  printscreen: 0x46,
  scrolllock: 0x47,
  pause: 0x48,
  insert: 0x49,
  home: 0x4a,
  pageup: 0x4b,
  pgup: 0x4b,
  delete: 0x4c,
  del: 0x4c,
  end: 0x4d,
  pagedown: 0x4e,
  pgdn: 0x4e,

  // Arrows
  right: 0x4f,
  arrowright: 0x4f,
  left: 0x50,
  arrowleft: 0x50,
  down: 0x51,
  arrowdown: 0x51,
  up: 0x52,
  arrowup: 0x52,
}

/**
 * Case-insensitive, whitespace-tolerant lookup key. Single characters keep their
 * literal form so `-`, `.` and `/` stay addressable.
 */
export const normalizeKeyName = (value: string): string => {
  const trimmed = value.trim()
  if (trimmed.length <= 1) return trimmed.toLowerCase()
  return trimmed.toLowerCase().replace(/[\s_]+/g, '')
}

/** Returns the HID Usage ID for a user-entered key name, or `undefined` if unknown. */
export const resolveHidCode = (value: string | undefined): number | undefined => {
  if (!value) return undefined
  return HID_KEY_CODES[normalizeKeyName(value)]
}

/**
 * Display names offered as autocomplete in the UI. One entry per distinct keycode so
 * aliases ("esc", "pgup") stay accepted on input without cluttering the suggestions.
 */
export const HID_KEY_SUGGESTIONS: readonly string[] = [
  ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`),
  ...'1234567890'.split(''),
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  'Enter',
  'Escape',
  'Backspace',
  'Tab',
  'Space',
  'CapsLock',
  'Insert',
  'Delete',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'PrintScreen',
  'ScrollLock',
  'Pause',
  'Up',
  'Down',
  'Left',
  'Right',
  '-',
  '=',
  '[',
  ']',
  '\\',
  ';',
  "'",
  '`',
  ',',
  '.',
  '/',
  ...Array.from({ length: 10 }, (_, i) => `Numpad${i}`),
  'NumpadEnter',
  'Numpad+',
  'Numpad-',
  'Numpad*',
  'Numpad/',
  'Numpad.',
  'NumLock',
]
