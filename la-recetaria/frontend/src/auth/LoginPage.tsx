import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuthStore } from './useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useI18n } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/translations';

export function LoginPage() {
  const { t, locale, setLocale } = useI18n();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();
  const location = useLocation();
  const from = ((location.state as { from?: string } | null)?.from as string) ?? '/catalogue';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'));
    }
  }

  function LangToggle({ value }: { value: Locale }) {
    const active = locale === value;
    return (
      <button
        type="button"
        onClick={() => setLocale(value)}
        className={`rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors ${
          active
            ? 'border-ink-black bg-ink-black text-canvas-white'
            : 'border-ink-black/25 text-ink-black/70 hover:border-ink-black/50'
        }`}
        aria-pressed={active}
        aria-label={value === 'es' ? t('nav.langEs') : t('nav.langEn')}
      >
        {value.toUpperCase()}
      </button>
    );
  }

  return (
    <div className="min-h-screen sky-gradient flex items-stretch sm:items-center justify-center p-0 sm:p-8">
      <div className="bg-canvas-white w-full max-w-md sm:rounded-2xl px-6 sm:px-10 py-10 sm:py-12 flex flex-col gap-6">
        <div className="flex justify-end gap-1" role="group" aria-label={t('nav.langSwitch')}>
          <LangToggle value="es" />
          <LangToggle value="en" />
        </div>
        <div className="text-center">
          <h1 className="font-newyork text-4xl sm:text-5xl text-ink-black">La RecetarIA</h1>
          <p className="text-sm text-ink-black/60 mt-2">{t('login.subtitle')}</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label={t('login.email')}
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label={t('login.password')}
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error ? (
            <div className="text-sm text-red-600 -mt-2">{error}</div>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading || !email || !password}
            iconLeft={<LogIn size={18} />}
            className="mt-2"
          >
            {isLoading ? t('login.signingIn') : t('login.signIn')}
          </Button>
        </form>
        <div className="text-center text-xs text-ink-black/50 leading-relaxed">
          {t('login.footer')}
          <br />
          <Link to="/catalogue" className="underline hover:no-underline">
            {t('login.continueGuest')}
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
