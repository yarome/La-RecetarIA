import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, ListChecks, RefreshCw } from 'lucide-react';
import type { ShoppingListItem, Weekday } from '../api/types';
import { WEEKDAYS } from '../api/types';
import { useStorage } from '../storage/useStorage';
import { Button } from '../components/ui/Button';
import { formatQuantity } from '../util/scale';
import { Spinner } from '../components/ui/Spinner';
import { useI18n } from '../i18n/I18nProvider';

export function ShoppingListPage() {
  const { t } = useI18n();
  const storage = useStorage();
  const [selected, setSelected] = useState<Set<Weekday>>(new Set(WEEKDAYS));
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const computeMut = useMutation({
    mutationFn: (days: Weekday[]) => storage.computeShoppingList(days),
    onSuccess: (res) => setItems(res),
  });

  const { data: plan } = useQuery({
    queryKey: ['plan', 'current'],
    queryFn: () => storage.getCurrentPlan(),
  });

  function toggleDay(day: Weekday) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  const days = useMemo(() => Array.from(selected).sort(), [selected]);

  useEffect(() => {
    if (days.length > 0) {
      computeMut.mutate(days as Weekday[]);
    } else {
      setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.join(',')]);

  const planEmpty = !plan || Object.keys(plan).length === 0;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-newyork text-4xl sm:text-5xl text-ink-black">{t('shopping.title')}</h1>
        <p className="text-ink-black/60 mt-1">{t('shopping.subtitle')}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider text-ink-black/50">{t('shopping.planDays')}</h2>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => {
            const active = selected.has(d);
            return (
              <label
                key={d}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm cursor-pointer transition-colors ${
                  active
                    ? 'bg-ink-black text-canvas-white border-ink-black'
                    : 'border-ink-black/30 text-ink-black hover:border-ink-black'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  onChange={() => toggleDay(d)}
                />
                {active ? <Check size={14} /> : null}
                {t(`weekday.full.${d}`)}
              </label>
            );
          })}
        </div>
        {planEmpty ? (
          <p className="text-sm text-ink-black/50">{t('shopping.planEmpty')}</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-bold">{t('shopping.list')}</h2>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<RefreshCw size={14} />}
            onClick={() => days.length > 0 && computeMut.mutate(days as Weekday[])}
            disabled={computeMut.isPending}
          >
            {t('shopping.refresh')}
          </Button>
        </div>
        {computeMut.isPending ? (
          <Spinner label={t('shopping.computing')} />
        ) : items.length === 0 ? (
          <div className="border border-dashed border-ink-black/20 rounded-2xl p-12 text-center text-ink-black/60">
            <ListChecks className="inline mb-2 text-ink-black/40" size={28} />
            <div>{t('shopping.emptyList')}</div>
          </div>
        ) : (
          <ul className="border border-ink-black/10 rounded-2xl divide-y divide-ink-black/10">
            {items.map((it, idx) => {
              const key = `${it.name}__${it.unit}`;
              const isChecked = checked.has(key);
              return (
                <li
                  key={`${key}-${idx}`}
                  className={`flex items-center gap-3 px-4 sm:px-6 py-3 transition-colors ${
                    isChecked ? 'opacity-50' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setChecked((prev) => {
                        const next = new Set(prev);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      });
                    }}
                    className={`w-6 h-6 rounded-full border inline-flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-ink-black border-ink-black text-canvas-white'
                        : 'border-ink-black/40 text-transparent hover:border-ink-black'
                    }`}
                    aria-label={isChecked ? t('shopping.uncheck') : t('shopping.check')}
                  >
                    <Check size={14} />
                  </button>
                  <span className={`flex-1 ${isChecked ? 'line-through' : ''}`}>
                    {it.name}
                  </span>
                  <span className="text-ink-black/70 text-sm whitespace-nowrap">
                    {formatQuantity(it.totalQuantity, it.unit)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
