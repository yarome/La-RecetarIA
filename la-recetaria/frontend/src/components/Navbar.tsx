import { NavLink } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useStorage } from '../storage/useStorage';
import { AccountWidget } from '../auth/AccountWidget';
import { useI18n } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/translations';

export function Navbar() {
  const { t, locale, setLocale } = useI18n();
  const storage = useStorage();
  const { data: menu } = useQuery({
    queryKey: ['menu'],
    queryFn: () => storage.listMenu(),
  });
  const count = menu?.length ?? 0;

  const tabs = [
    { to: '/catalogue', label: t('nav.catalogue') },
    { to: '/menu', label: t('nav.menu') },
    { to: '/shopping-list', label: t('nav.shopping') },
  ];

  function LangButton({ value, label }: { value: Locale; label: string }) {
    const active = locale === value;
    return (
      <button
        type="button"
        onClick={() => setLocale(value)}
        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
          active
            ? 'bg-canvas-white text-ink-black'
            : 'text-canvas-white/85 hover:text-canvas-white'
        }`}
        aria-pressed={active}
        aria-label={label}
      >
        {value.toUpperCase()}
      </button>
    );
  }

  return (
    <header className="sky-gradient-band text-canvas-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-wrap items-center gap-4">
        <NavLink to="/catalogue" className="font-newyork text-3xl sm:text-4xl tracking-wide">
          La RecetarIA
        </NavLink>
        <nav className="ml-auto order-3 sm:order-2 w-full sm:w-auto overflow-x-auto scrollbar-thin">
          <ul className="flex items-center gap-2 sm:gap-3 whitespace-nowrap">
            {tabs.map((tab) => (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full border border-canvas-white px-4 sm:px-5 py-1.5 text-sm sm:text-base transition-colors ${
                      isActive
                        ? 'bg-canvas-white text-ink-black'
                        : 'text-canvas-white hover:bg-canvas-white hover:text-ink-black'
                    }`
                  }
                >
                  <span>{tab.label}</span>
                  {tab.to === '/menu' && count > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-ink-black text-canvas-white text-xs font-semibold px-1.5">
                      {count}
                    </span>
                  ) : null}
                  {tab.to === '/menu' ? <ShoppingCart size={16} className="sm:hidden" /> : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="order-2 sm:order-3 ml-auto sm:ml-0 flex items-center gap-2">
          <div
            className="flex items-center rounded-full border border-canvas-white/80 p-0.5"
            role="group"
            aria-label={t('nav.langSwitch')}
          >
            <LangButton value="es" label={t('nav.langEs')} />
            <LangButton value="en" label={t('nav.langEn')} />
          </div>
          <AccountWidget light />
        </div>
      </div>
    </header>
  );
}
