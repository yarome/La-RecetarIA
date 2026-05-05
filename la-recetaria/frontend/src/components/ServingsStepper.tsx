import { Minus, Plus } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  label?: string;
}

export function ServingsStepper({
  value,
  onChange,
  min = 1,
  max = 32,
  size = 'sm',
  label: labelProp,
}: Props) {
  const { t } = useI18n();
  const label = labelProp ?? t('common.people');
  const btn =
    size === 'sm'
      ? 'h-7 w-7 text-sm'
      : 'h-9 w-9 text-base';
  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(Math.max(min, value - 1));
        }}
        disabled={value <= min}
        className={`${btn} inline-flex items-center justify-center rounded-full border border-ink-black/40 hover:border-ink-black hover:bg-ink-black hover:text-canvas-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-black`}
        aria-label={t('common.decrease')}
      >
        <Minus size={14} />
      </button>
      <span className="min-w-[3.5rem] text-center text-sm">
        <strong>{value}</strong>
        <span className="text-ink-black/50"> {label}</span>
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(Math.min(max, value + 1));
        }}
        disabled={value >= max}
        className={`${btn} inline-flex items-center justify-center rounded-full border border-ink-black/40 hover:border-ink-black hover:bg-ink-black hover:text-canvas-white transition-colors disabled:opacity-40`}
        aria-label={t('common.increase')}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
