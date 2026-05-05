import { useMemo, useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Save, Settings, RotateCcw } from 'lucide-react';
import { useStorage } from '../storage/useStorage';
import type { NutritionGoals, Recipe, Weekday, WeeklyPlan, Nutrition } from '../api/types';
import { WEEKDAYS } from '../api/types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { ServingsStepper } from '../components/ServingsStepper';
import { WeeklyPlanner, dayNutritionTotals } from '../planner/WeeklyPlanner';
import { NutritionGoalsModal } from '../planner/NutritionGoalsModal';

export function MenuPage() {
  const { t } = useI18n();
  const storage = useStorage();
  const qc = useQueryClient();

  const [showSnack, setShowSnack] = useState<Record<Weekday, boolean>>({
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
    sun: false,
  });
  const [planLocal, setPlanLocal] = useState<WeeklyPlan | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedPlanName, setSavedPlanName] = useState('');
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  const { data: menu, isLoading: menuLoading } = useQuery({
    queryKey: ['menu'],
    queryFn: () => storage.listMenu(),
  });

  const { data: recipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => storage.listRecipes(),
  });

  const { data: planRemote } = useQuery({
    queryKey: ['plan', 'current'],
    queryFn: () => storage.getCurrentPlan(),
  });

  const { data: savedPlans } = useQuery({
    queryKey: ['plans', 'saved'],
    queryFn: () => storage.listSavedPlans(),
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => storage.getNutritionGoals(),
  });

  useEffect(() => {
    if (planRemote && planLocal === null) {
      setPlanLocal(planRemote);
    }
  }, [planRemote, planLocal]);

  const recipesById = useMemo(() => {
    const m = new Map<number, Recipe>();
    (recipes ?? []).forEach((r) => m.set(r.id, r));
    return m;
  }, [recipes]);

  const menuRecipes = useMemo(
    () =>
      (menu ?? [])
        .map((m) => recipesById.get(m.recipeId))
        .filter((r): r is Recipe => Boolean(r)),
    [menu, recipesById],
  );

  const updateMenuMut = useMutation({
    mutationFn: ({ id, peopleCount }: { id: number; peopleCount: number }) =>
      storage.updateMenuItem(id, { peopleCount }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });

  const removeMenuMut = useMutation({
    mutationFn: (id: number) => storage.removeFromMenu(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });

  const clearMenuMut = useMutation({
    mutationFn: () => storage.clearMenu(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });

  const setPlanMut = useMutation({
    mutationFn: (p: WeeklyPlan) => storage.setCurrentPlan(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan', 'current'] }),
  });

  const savePlanMut = useMutation({
    mutationFn: ({ name, plan }: { name: string; plan: WeeklyPlan }) =>
      storage.saveCurrentPlan(name, plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans', 'saved'] });
      setShowSaveDialog(false);
      setSavedPlanName('');
    },
  });

  const deleteSavedMut = useMutation({
    mutationFn: (id: number) => storage.deleteSavedPlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans', 'saved'] }),
  });

  const setGoalsMut = useMutation({
    mutationFn: (g: NutritionGoals) => storage.setNutritionGoals(g),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      setShowGoalsModal(false);
    },
  });

  function commitPlan(next: WeeklyPlan) {
    setPlanLocal(next);
    setPlanMut.mutate(next);
  }

  const weeklyTotals = useMemo(() => {
    const total: Nutrition & { kcal: number } = {
      kcal: 0,
      protein: 0,
      carbs: 0,
      sugars: 0,
      fat: 0,
      fiber: 0,
    };
    if (!planLocal) return total;
    for (const day of WEEKDAYS) {
      const dayTot = dayNutritionTotals(planLocal, day, recipesById);
      total.kcal += dayTot.kcal;
      total.protein += dayTot.nutrition.protein;
      total.carbs += dayTot.nutrition.carbs;
      total.sugars += dayTot.nutrition.sugars;
      total.fat += dayTot.nutrition.fat;
      total.fiber += dayTot.nutrition.fiber;
    }
    return total;
  }, [planLocal, recipesById]);

  const goalEntries = useMemo(() => {
    const keys = ['kcal', 'protein', 'carbs', 'sugars', 'fat', 'fiber'] as const;
    const units: Record<(typeof keys)[number], string> = {
      kcal: '',
      protein: 'g',
      carbs: 'g',
      sugars: 'g',
      fat: 'g',
      fiber: 'g',
    };
    return keys.map((key) => ({
      label: t(`nutrition.${key}`),
      key,
      unit: units[key],
    }));
  }, [t]);

  const isEmptyPlan = useMemo(() => {
    if (!planLocal) return true;
    return Object.keys(planLocal).length === 0;
  }, [planLocal]);

  return (
    <div className="flex flex-col gap-12">
      <header>
        <h1 className="font-newyork text-4xl sm:text-5xl text-ink-black">{t('menu.title')}</h1>
        <p className="text-ink-black/60 mt-1">{t('menu.subtitle')}</p>
      </header>

      {/* Menu list */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">{t('menu.selectedRecipes')}</h2>
            <p className="text-sm text-ink-black/60">
              {(menu?.length ?? 0) === 1
                ? t('menu.itemOne')
                : t('menu.itemMany', { n: menu?.length ?? 0 })}
            </p>
          </div>
          {(menu?.length ?? 0) > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              onClick={() => {
                if (confirm(t('menu.clearConfirm'))) clearMenuMut.mutate();
              }}
            >
              {t('menu.clearMenu')}
            </Button>
          ) : null}
        </div>
        {menuLoading ? (
          <Spinner label={t('menu.loading')} />
        ) : (menu ?? []).length === 0 ? (
          <div className="border border-dashed border-ink-black/20 rounded-2xl p-12 text-center text-ink-black/60">
            {t('menu.emptyMenu')}
          </div>
        ) : (
          <ul className="border border-ink-black/10 rounded-2xl divide-y divide-ink-black/10">
            {(menu ?? []).map((m) => {
              const recipe = recipesById.get(m.recipeId);
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-4 px-4 sm:px-6 py-3"
                >
                  {recipe?.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover bg-ink-black/5"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-ink-black/5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {recipe?.name ?? t('menu.recipeMissing')}
                    </div>
                    <div className="text-xs text-ink-black/50">
                      {t('menu.metaLine', {
                        minutes: recipe?.prepTimeMin ?? 0,
                        servings: recipe?.baseServings ?? 0,
                      })}
                    </div>
                  </div>
                  <ServingsStepper
                    value={m.peopleCount}
                    onChange={(next) =>
                      updateMenuMut.mutate({ id: m.id, peopleCount: next })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeMenuMut.mutate(m.id)}
                    className="text-ink-black/50 hover:text-red-600 ml-2"
                    aria-label={t('common.remove')}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Planner */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">{t('menu.planTitle')}</h2>
            <p className="text-sm text-ink-black/60">{t('menu.planSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Save size={14} />}
              onClick={() => setShowSaveDialog(true)}
              disabled={isEmptyPlan}
            >
              {t('menu.savePlan')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Settings size={14} />}
              onClick={() => setShowGoalsModal(true)}
            >
              {t('menu.goals')}
            </Button>
          </div>
        </div>
        <WeeklyPlanner
          recipes={menuRecipes}
          plan={planLocal ?? {}}
          onChange={commitPlan}
          showSnack={showSnack}
          onToggleSnack={(day, on) => setShowSnack((s) => ({ ...s, [day]: on }))}
        />
      </section>

      {/* Dashboard */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="border border-ink-black/10 rounded-2xl p-6">
          <h3 className="text-sm uppercase tracking-wider text-ink-black/50">
            {t('menu.weeklyTotals')}
          </h3>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {goalEntries.map((g) => (
              <div key={g.key}>
                <div className="text-xl font-bold">
                  {Math.round(weeklyTotals[g.key])}
                  <span className="text-xs font-normal text-ink-black/50 ml-1">
                    {g.unit}
                  </span>
                </div>
                <div className="text-[11px] uppercase tracking-wider text-ink-black/50">
                  {g.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-ink-black/10 rounded-2xl p-6">
          <h3 className="text-sm uppercase tracking-wider text-ink-black/50">
            {t('menu.goalsWeekly')}
          </h3>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {goalEntries.map((g) => {
              const have = weeklyTotals[g.key];
              const want = goals?.[g.key] ?? 0;
              const pct = want > 0 ? Math.min(100, Math.round((have / want) * 100)) : 0;
              return (
                <div key={g.key}>
                  <div className="text-sm">
                    <span className="font-bold">{Math.round(have)}</span>
                    <span className="text-ink-black/50"> / {Math.round(want)}{g.unit}</span>
                  </div>
                  <div className="h-1.5 bg-ink-black/10 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-ink-black"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-black/50 mt-1">
                    {g.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Saved plans */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{t('menu.savedPlans')}</h2>
        {(savedPlans ?? []).length === 0 ? (
          <p className="text-sm text-ink-black/50">{t('menu.savedPlansEmpty')}</p>
        ) : (
          <ul className="border border-ink-black/10 rounded-2xl divide-y divide-ink-black/10">
            {(savedPlans ?? []).map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-4 sm:px-6 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-ink-black/50">
                    {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<RotateCcw size={14} />}
                  onClick={() => commitPlan(p.plan)}
                >
                  {t('menu.load')}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t('menu.deleteSavedConfirm', { name: p.name })))
                      deleteSavedMut.mutate(p.id);
                  }}
                  className="text-ink-black/50 hover:text-red-600 ml-1"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title={t('menu.savePlanTitle')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>
              {t('menu.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                planLocal &&
                savedPlanName.trim() &&
                savePlanMut.mutate({ name: savedPlanName.trim(), plan: planLocal })
              }
              disabled={!savedPlanName.trim() || !planLocal || savePlanMut.isPending}
            >
              {t('menu.save')}
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          label={t('menu.namePlan')}
          id="planName"
          value={savedPlanName}
          onChange={(e) => setSavedPlanName(e.target.value)}
          placeholder={t('menu.namePlanPh')}
        />
      </Modal>

      <NutritionGoalsModal
        open={showGoalsModal}
        goals={
          goals ?? {
            kcal: 14000,
            protein: 350,
            carbs: 1750,
            sugars: 350,
            fat: 500,
            fiber: 175,
          }
        }
        onClose={() => setShowGoalsModal(false)}
        onSave={(g) => setGoalsMut.mutate(g)}
      />
    </div>
  );
}
