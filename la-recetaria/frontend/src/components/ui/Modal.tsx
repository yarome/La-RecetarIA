import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button } from './Button';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

const sizes: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'md', footer }: Props) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/40 p-0 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`relative w-full ${sizes[size]} bg-canvas-white sm:rounded-2xl flex flex-col max-h-screen sm:max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between gap-4 px-6 sm:px-8 py-4 border-b border-black/10">
          <h2 className="font-newyork text-2xl sm:text-3xl text-ink-black truncate">
            {title}
          </h2>
          <Button variant="subtle" size="sm" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">{children}</div>
        {footer ? (
          <footer className="px-6 sm:px-8 py-4 border-t border-black/10 flex justify-end gap-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
