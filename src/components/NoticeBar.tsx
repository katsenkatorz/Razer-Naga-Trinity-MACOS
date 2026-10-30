import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNagaStore } from '../store/useNagaStore'

export function NoticeBar() {
  const { t, i18n } = useTranslation()
  const notice = useNagaStore((state) => state.notice)
  const dismiss = useNagaStore((state) => state.dismissNotice)

  if (!notice) return null
  const tone = notice.tone

  // 1) If the driver supplies an i18n key (plus optional params), translate it.
  // 2) If the driver exception only carried the English fallback string
  //    ('Razer Naga Trinity not found.'), fall back to the notFound key.
  let label = notice.message
  if (notice.key && i18n.exists(notice.key)) {
    label = t(notice.key, notice.params ?? {}) as string
  } else if (notice.message?.includes('Razer Naga Trinity not found')) {
    label = t('driverNotices.notFound') as string
  }

  const Icon = tone === 'success' ? CircleCheck : tone === 'error' ? TriangleAlert : Info

  return (
    <div className={`notice ${tone}`} role="status">
      <span className="notice-icon">
        <Icon size={15} />
      </span>
      <span className="notice-text">{label}</span>
      <button
        type="button"
        className="icon-btn"
        onClick={dismiss}
        aria-label={t('notice.dismiss')}
      >
        <X size={14} />
      </button>
    </div>
  )
}
