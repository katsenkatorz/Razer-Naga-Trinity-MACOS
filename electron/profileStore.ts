import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { app } from 'electron'
import { join } from 'node:path'
import {
  buildBaseButtons,
  buildButtonsForPlate,
  buildSideButtons,
  isBaseButton,
  isSideButton,
  normalizeSidePlateBindings,
  type SidePlateBindings,
} from './buttonLayout'
import { resolveHidCode } from './hidKeys'
import type {
  AppSettings,
  ButtonBinding,
  Macro,
  NagaProfile,
  ProfileStore,
  SidePlate,
} from './types'

const STORE_VERSION = 3

export { buildButtonsForPlate }

const defaultSettings = (): AppSettings => ({
  rgbOffOnLock: true,
})

const mergeSettings = (incoming: Partial<AppSettings> | undefined): AppSettings => ({
  ...defaultSettings(),
  ...(incoming ?? {}),
})

export const createDefaultMacro = (): Macro => ({
  id: randomUUID(),
  name: 'Potion + Confirm',
  repeatMode: 'once',
  repeatCount: 1,
  steps: [
    { id: randomUUID(), type: 'key', value: '1', delayMs: 0 },
    { id: randomUUID(), type: 'delay', value: '', delayMs: 120 },
    { id: randomUUID(), type: 'key', value: 'Enter', delayMs: 0 },
  ],
})

const defaultRgb = (): NagaProfile['rgb'] => ({
  effect: 'static',
  color: '#00ff66',
  secondaryColor: '#00b3ff',
  brightness: 80,
  waveDirection: 'right',
  reactiveSpeed: 2,
  syncZones: true,
  zones: {
    logo: { enabled: true, color: '#00ff66' },
    scroll: { enabled: true, color: '#00ff66' },
    side: { enabled: true, color: '#00ff66' },
  },
})

const defaultDpi = (): NagaProfile['dpi'] => ({
  activeStage: 2,
  stages: [
    { id: randomUUID(), x: 800, y: 800 },
    { id: randomUUID(), x: 1800, y: 1800 },
    { id: randomUUID(), x: 3200, y: 3200 },
    { id: randomUUID(), x: 6400, y: 6400 },
    { id: randomUUID(), x: 12000, y: 12000 },
  ],
})

// Migriert Base-Buttons aus älteren Profil-Versionen (vor Wheel-Tilt) auf das aktuelle 9-Base-Layout.
const migrateBaseButtons = (buttons: ButtonBinding[] | undefined): ButtonBinding[] => {
  const expected = buildBaseButtons()
  if (!buttons) return expected

  // Alt-Layout (vor Wheel-Tilt) hatte DPI Up/Down auf base-6/base-7 - komplett neu setzen.
  if (buttons.find((b) => b.id === 'base-6')?.action === 'dpi-up') return expected

  const byId = new Map(buttons.filter(isBaseButton).map((b) => [b.id, b]))
  return expected.map((entry) => byId.get(entry.id) ?? entry)
}

// Store-Version 2 vergab als Side-Default `${index + 1}` bzw. `F${index + 1}`. Werte wie
// "10", "11" oder "12" sind keine HID-Tastennamen und konnten nie geschrieben werden.
// Nur solche unveränderten Defaults werden ersetzt - eigene Eingaben bleiben erhalten.
const isLegacyAutoValue = (value: string, index: number) =>
  value === `${index + 1}` && resolveHidCode(value) === undefined

const migrateSideButtons = (
  buttons: ButtonBinding[] | undefined,
  plate: SidePlate,
): ButtonBinding[] => {
  const expected = buildSideButtons(plate)
  if (!buttons) return expected

  const byId = new Map(buttons.filter(isSideButton).map((b) => [b.id, b]))
  return expected.map((entry, index) => {
    const stored = byId.get(entry.id)
    if (!stored) return entry
    if (stored.action === 'key' && isLegacyAutoValue(stored.value, index)) {
      return { ...stored, value: entry.value }
    }
    return stored
  })
}

export const createDefaultProfile = (
  overrides: Partial<NagaProfile> = {},
): NagaProfile => {
  const now = Date.now()
  const plate: SidePlate = overrides.sidePlate ?? 'twelve'
  const rgbBase = defaultRgb()
  const incomingRgb = (overrides.rgb ?? {}) as Partial<NagaProfile['rgb']>
  const dpiBase = defaultDpi()
  const incomingDpi = (overrides.dpi ?? {}) as Partial<NagaProfile['dpi']> & {
    x?: number
    y?: number
  }
  const dpiStages =
    incomingDpi.stages && incomingDpi.stages.length > 0
      ? incomingDpi.stages
      : incomingDpi.x && incomingDpi.y
        ? [{ id: randomUUID(), x: incomingDpi.x, y: incomingDpi.y }]
        : dpiBase.stages

  const buttons = [
    ...migrateBaseButtons(overrides.buttons),
    ...migrateSideButtons(overrides.buttons, plate),
  ]
  const sidePlateBindings: SidePlateBindings = normalizeSidePlateBindings(
    overrides.sidePlateBindings,
    plate,
    buttons,
  )

  return {
    id: overrides.id ?? randomUUID(),
    name: overrides.name ?? 'Standardprofil',
    sidePlate: plate,
    rgb: {
      ...rgbBase,
      ...incomingRgb,
      zones: { ...rgbBase.zones, ...(incomingRgb.zones ?? {}) },
    },
    dpi: {
      activeStage: incomingDpi.activeStage ?? dpiBase.activeStage,
      stages: dpiStages,
    },
    pollingRate: overrides.pollingRate ?? 1000,
    buttons,
    sidePlateBindings,
    macros: overrides.macros ?? [createDefaultMacro()],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  }
}

const createInitialStore = (): ProfileStore => {
  const profile = createDefaultProfile({ name: 'Raid / Produktiv' })
  return {
    version: STORE_VERSION,
    activeProfileId: profile.id,
    profiles: [profile],
    settings: defaultSettings(),
  }
}

const storePath = () => join(app.getPath('userData'), 'profiles.json')

const isLegacyArray = (raw: unknown): raw is NagaProfile[] => Array.isArray(raw)

const migrate = (raw: unknown): ProfileStore => {
  if (isLegacyArray(raw)) {
    const profiles = raw.map((legacy) => createDefaultProfile(legacy as Partial<NagaProfile>))
    return {
      version: STORE_VERSION,
      activeProfileId: profiles[0]?.id ?? createInitialStore().activeProfileId,
      profiles: profiles.length > 0 ? profiles : createInitialStore().profiles,
    }
  }

  if (raw && typeof raw === 'object' && 'profiles' in raw) {
    const store = raw as Partial<ProfileStore>
    const profiles = (store.profiles ?? []).map((profile) =>
      createDefaultProfile(profile as Partial<NagaProfile>),
    )
    if (profiles.length === 0) {
      return createInitialStore()
    }
    return {
      version: STORE_VERSION,
      activeProfileId:
        store.activeProfileId && profiles.some((profile) => profile.id === store.activeProfileId)
          ? store.activeProfileId
          : profiles[0].id,
      profiles,
      settings: mergeSettings(store.settings),
    }
  }

  return createInitialStore()
}

export const readStore = async (): Promise<ProfileStore> => {
  try {
    const content = await readFile(storePath(), 'utf8')
    return migrate(JSON.parse(content))
  } catch {
    return createInitialStore()
  }
}

export const writeStore = async (store: ProfileStore): Promise<ProfileStore> => {
  await mkdir(app.getPath('userData'), { recursive: true })
  const next: ProfileStore = {
    ...store,
    version: STORE_VERSION,
    settings: mergeSettings(store.settings),
  }
  await writeFile(storePath(), JSON.stringify(next, null, 2), 'utf8')
  return next
}

export const updateSettings = async (
  partial: Partial<AppSettings>,
): Promise<ProfileStore> => {
  const store = await readStore()
  return writeStore({
    ...store,
    settings: mergeSettings({ ...store.settings, ...partial }),
  })
}

export const upsertProfile = async (profile: NagaProfile): Promise<ProfileStore> => {
  const store = await readStore()
  const exists = store.profiles.some((entry) => entry.id === profile.id)
  const stamped: NagaProfile = { ...profile, updatedAt: Date.now() }
  const profiles = exists
    ? store.profiles.map((entry) => (entry.id === profile.id ? stamped : entry))
    : [...store.profiles, stamped]
  return writeStore({ ...store, profiles })
}

export const deleteProfile = async (id: string): Promise<ProfileStore> => {
  const store = await readStore()
  const profiles = store.profiles.filter((profile) => profile.id !== id)
  const fallback = profiles[0] ?? createDefaultProfile()
  const ensured = profiles.length > 0 ? profiles : [fallback]
  return writeStore({
    ...store,
    profiles: ensured,
    activeProfileId:
      store.activeProfileId === id ? ensured[0].id : store.activeProfileId,
  })
}

export const duplicateProfile = async (id: string): Promise<ProfileStore> => {
  const store = await readStore()
  const source = store.profiles.find((profile) => profile.id === id)
  if (!source) return store
  const copy = createDefaultProfile({
    ...source,
    id: randomUUID(),
    name: `${source.name} – Kopie`,
  })
  return writeStore({
    ...store,
    profiles: [...store.profiles, copy],
    activeProfileId: copy.id,
  })
}

export const setActiveProfile = async (id: string): Promise<ProfileStore> => {
  const store = await readStore()
  if (!store.profiles.some((profile) => profile.id === id)) return store
  return writeStore({ ...store, activeProfileId: id })
}
