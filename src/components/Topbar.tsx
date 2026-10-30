import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useActiveProfile, useNagaStore } from '../store/useNagaStore'
import type { SectionId } from '../store/useNagaStore'

const SECTIONS: readonly SectionId[] = ['lighting', 'performance', 'buttons', 'macros']

export function Topbar() {
  const { t } = useTranslation()
  const active = useActiveProfile()
  const section = useNagaStore((state) => state.section)
  const setSection = useNagaStore((state) => state.setSection)
  const updateActive = useNagaStore((state) => state.updateActive)
  const saveActive = useNagaStore((state) => state.saveActive)
  const applyActive = useNagaStore((state) => state.applyActive)
  const duplicateProfile = useNagaStore((state) => state.duplicateProfile)
  const deleteProfile = useNagaStore((state) => state.deleteProfile)
  const isApplying = useNagaStore((state) => state.isApplying)
  const dirty = useNagaStore((state) => state.hasUnsavedChanges)

  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="topbar-title">
          <input
            className="profile-name"
            value={active.name}
            aria-label={t('topbar.profileName')}
            onChange={(event) =>
              updateActive((profile) => ({ ...profile, name: event.target.value }))
            }
            spellCheck={false}
          />
          {dirty && <span className="dirty-note">{t('topbar.unsavedChanges')}</span>}
        </div>
        <div className="topbar-actions">
          <button type="button" className="btn-plain" onClick={() => void duplicateProfile()}>
            {t('topbar.duplicate')}
          </button>
          <button
            type="button"
            className="btn-plain danger"
            onClick={() => void deleteProfile(active.id)}
          >
            {t('topbar.delete')}
          </button>
          <span className="toolbar-divider" aria-hidden />
          <button type="button" className="btn-secondary" onClick={() => void saveActive()}>
            {t('topbar.save')}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void applyActive()}
            disabled={isApplying}
          >
            {isApplying && <Loader2 size={14} className="spin" />}
            {isApplying ? t('topbar.applying') : t('topbar.applyToMouse')}
          </button>
        </div>
      </div>

      <nav className="segmented section-tabs" role="tablist" aria-label={t('topbar.sections')}>
        {SECTIONS.map((id) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={section === id}
            className={section === id ? 'active' : ''}
            onClick={() => setSection(id)}
          >
            {t(`sections.${id}`)}
          </button>
        ))}
      </nav>
    </header>
  )
}
