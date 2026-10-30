import { Plus, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n'
import { useActiveProfile, useNagaStore } from '../store/useNagaStore'

export function Sidebar() {
  const { t, i18n } = useTranslation()
  const device = useNagaStore((state) => state.device)
  const store = useNagaStore((state) => state.store)
  const active = useActiveProfile()
  const selectProfile = useNagaStore((state) => state.selectProfile)
  const createProfile = useNagaStore((state) => state.createProfile)
  const rescan = useNagaStore((state) => state.rescan)

  const activeStage = active.dpi.stages[active.dpi.activeStage - 1] ?? active.dpi.stages[0]
  const currentLang = (i18n.resolvedLanguage ?? i18n.language ?? 'de').slice(0, 2) as SupportedLanguage

  const switchLanguage = (code: SupportedLanguage) => {
    void i18n.changeLanguage(code)
    void window.naga?.updateSettings?.({ language: code })
  }

  return (
    <aside className="sidebar">
      <section className="device" aria-label={t('sidebar.device')}>
        <h2 className="device-name">{device.productName || 'Razer Naga Trinity'}</h2>
        <div className="device-status-row">
          <p className={`device-status ${device.connected ? 'connected' : ''}`}>
            <span className="status-dot" aria-hidden />
            {device.connected ? t('common.connected') : t('common.disconnected')}
          </p>
          <button className="btn-plain small" type="button" onClick={() => void rescan()}>
            <RefreshCw size={12} />
            {t('sidebar.rescan')}
          </button>
        </div>
        <dl className="device-facts">
          <div>
            <dt>VID:PID</dt>
            <dd>1532:0067</dd>
          </div>
          <div>
            <dt>{t('sidebar.hidInterfaces')}</dt>
            <dd>{device.interfaces || 0}</dd>
          </div>
        </dl>
      </section>

      <section className="profile-section">
        <header className="sidebar-heading">
          <h2>{t('sidebar.profiles')}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={() => void createProfile()}
            aria-label={t('sidebar.addProfile')}
            title={t('sidebar.addProfile')}
          >
            <Plus size={14} />
          </button>
        </header>

        <nav className="profile-list" aria-label={t('sidebar.profiles')}>
          {store.profiles.map((item) => {
            const isActive = item.id === active.id
            return (
              <button
                className={`profile ${isActive ? 'active' : ''}`}
                key={item.id}
                type="button"
                aria-current={isActive ? 'true' : undefined}
                onClick={() => void selectProfile(item.id)}
              >
                <span className="profile-info">
                  <span className="profile-name-label">{item.name}</span>
                  <small>
                    {t('sidebar.profileSummary', {
                      dpi: item.dpi.stages[item.dpi.activeStage - 1]?.x ?? 1800,
                      hz: item.pollingRate,
                    })}
                  </small>
                </span>
                <span
                  className="profile-swatch"
                  style={{ background: item.rgb.color }}
                  aria-hidden
                />
              </button>
            )
          })}
        </nav>
      </section>

      <footer className="sidebar-footer">
        <div className="footer-row">
          <span className="footer-label">{t('sidebar.activeStage')}</span>
          <span className="footer-value">
            {activeStage?.x ?? 1800}
            <span className="unit">{t('sidebar.dpiSuffix')}</span>
          </span>
        </div>
        <div className="footer-row">
          <span className="footer-label">{t('topbar.language')}</span>
          <div className="segmented small" role="group" aria-label={t('topbar.language')}>
            {SUPPORTED_LANGUAGES.map((code) => (
              <button
                key={code}
                type="button"
                className={currentLang === code ? 'active' : ''}
                onClick={() => switchLanguage(code)}
                aria-pressed={currentLang === code}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <p className="trademark-note">
          {t('trademark.short')} {t('trademark.disclaimer')}
        </p>
      </footer>
    </aside>
  )
}
