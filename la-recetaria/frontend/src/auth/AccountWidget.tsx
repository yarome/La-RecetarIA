import { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from './useAuthStore';
import { useI18n } from '../i18n/I18nProvider';

export function AccountWidget({ light = false }: { light?: boolean }) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const colour = light ? 'text-canvas-white' : 'text-ink-black';
  const border = light ? 'border-canvas-white' : 'border-ink-black';
  const hover = light
    ? 'hover:bg-canvas-white hover:text-ink-black'
    : 'hover:bg-ink-black hover:text-canvas-white';

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location.pathname }}
        className={`inline-flex items-center gap-2 rounded-full border ${border} ${colour} px-4 py-1.5 text-sm transition-colors ${hover}`}
      >
        <LogIn size={16} />
        <span>{t('account.logIn')}</span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-full border ${border} ${colour} px-4 py-1.5 text-sm transition-colors ${hover}`}
      >
        <UserIcon size={16} />
        <span className="hidden sm:inline max-w-[160px] truncate">{user.email}</span>
        <span className="sm:hidden">{t('account.account')}</span>
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-56 bg-canvas-white border border-ink-black/10 rounded-xl py-1 z-30">
          <div className="px-4 py-2 text-xs text-ink-black/60 truncate">
            {t('account.signedInAs')}
            <br />
            <span className="text-ink-black font-medium">{user.email}</span>
          </div>
          <button
            type="button"
            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-ink-black hover:bg-ink-black/5"
            onClick={() => {
              logout();
              setOpen(false);
            }}
          >
            <LogOut size={16} />
            {t('account.logOut')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
