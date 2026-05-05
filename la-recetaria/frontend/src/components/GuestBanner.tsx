import { Info, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStorageMode } from '../storage/useStorage';
import { useI18n } from '../i18n/I18nProvider';

export function GuestBanner() {
  const { t } = useI18n();
  const mode = useStorageMode();
  const location = useLocation();
  if (mode !== 'local') return null;
  return (
    <div className="border-y border-ink-black/10 bg-[#f4f6fc] text-ink-black/85 text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Info size={18} className="mt-0.5 shrink-0 text-sky-blue" />
          <p className="leading-relaxed m-0">
            <strong className="text-ink-black">{t('guest.title')}</strong> — {t('guest.body')}
          </p>
        </div>
        <Link
          to="/login"
          state={{ from: location.pathname }}
          className="shrink-0 inline-flex items-center justify-center gap-2 self-start sm:self-center rounded-full border border-ink-black bg-ink-black text-canvas-white px-5 py-2 text-sm font-medium hover:bg-canvas-white hover:text-ink-black transition-colors"
        >
          <LogIn size={16} />
          {t('guest.logIn')}
        </Link>
      </div>
    </div>
  );
}
