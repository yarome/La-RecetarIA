import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { GuestBanner } from './GuestBanner';
import { useI18n } from '../i18n/I18nProvider';

export function Layout() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col bg-canvas-white">
      <Navbar />
      <GuestBanner />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-ink-black/10 text-ink-black/40 text-xs py-4 text-center">
        {t('layout.footer')}
      </footer>
    </div>
  );
}
