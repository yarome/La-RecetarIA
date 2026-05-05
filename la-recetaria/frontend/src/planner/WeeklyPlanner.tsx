import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { X, GripVertical, Plus } from 'lucide-react';
import type {
  Meal,
  PlanSlot,
  Recipe,
  Weekday,
  WeeklyPlan,
  Nutrition,
} from '../api/types';
import { MEALS, WEEKDAYS } from '../api/types';
import { scaleFactor, scaleNutrition } from '../util/scale';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  recipes: Recipe[];
  plan: WeeklyPlan;
  onChange: (next: WeeklyPlan) => void;
  showSnack: Record<Weekday, boolean>;
  onToggleSnack: (day: Weekday, on: boolean) => void;
}

interface SourcePool {
  type: 'pool';
  recipeId: number;
}
interface SourceSlot {
  type: 'slot';
  day: Weekday;
  meal: Meal;
  index: number;
}
type DragSource = SourcePool | SourceSlot;

interface DropTarget {
  day: Weekday;
  meal: Meal;
}

function targetId(t: DropTarget): string {
  return `${t.day}.${t.meal}`;
}
function parseTargetId(id: string): DropTarget | null {
  const [day, meal] = id.split('.') as [Weekday, Meal];
  if (!WEEKDAYS.includes(day) || !MEALS.includes(meal)) return null;
  return { day, meal };
}

function poolDragId(recipeId: number): string {
  return `pool:${recipeId}`;
}

function slotDragId(day: Weekday, meal: Meal, index: number): string {
  return `slot:${day}:${meal}:${index}`;
}

function parseDragSource(id: string): DragSource | null {
  if (id.startsWith('pool:')) {
    return { type: 'pool', recipeId: Number(id.slice(5)) };
  }
  if (id.startsWith('slot:')) {
    const [, day, meal, idx] = id.split(':');
    return {
      type: 'slot',
      day: day as Weekday,
      meal: meal as Meal,
      index: Number(idx),
    };
  }
  return null;
}

function clonePlan(plan: WeeklyPlan): WeeklyPlan {
  return JSON.parse(JSON.stringify(plan)) as WeeklyPlan;
}

function getSlots(plan: WeeklyPlan, day: Weekday, meal: Meal): PlanSlot[] {
  return plan[day]?.[meal] ?? [];
}

function setSlots(plan: WeeklyPlan, day: Weekday, meal: Meal, slots: PlanSlot[]): WeeklyPlan {
  const next = clonePlan(plan);
  const dayPlan = next[day] ?? {};
  if (slots.length === 0) {
    delete dayPlan[meal];
  } else {
    dayPlan[meal] = slots;
  }
  if (Object.keys(dayPlan).length === 0) {
    delete next[day];
  } else {
    next[day] = dayPlan;
  }
  return next;
}

function PoolItem({ recipe }: { recipe: Recipe }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: poolDragId(recipe.id),
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 rounded-xl border border-ink-black/10 bg-canvas-white px-3 py-2 cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <GripVertical size={14} className="text-ink-black/40" />
      <span className="text-sm flex-1 truncate">{recipe.name}</span>
    </div>
  );
}

function SlotChip({
  day,
  meal,
  index,
  slot,
  recipe,
  onRemove,
}: {
  day: Weekday;
  meal: Meal;
  index: number;
  slot: PlanSlot;
  recipe: Recipe | null;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: slotDragId(day, meal, index),
  });
  return (
    <div
      ref={setNodeRef}
      className={`group flex items-center gap-1 rounded-lg bg-ink-black/5 px-2 py-1 text-xs ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="flex-1 truncate cursor-grab active:cursor-grabbing"
      >
        {recipe?.name ?? t('weekly.recipeFallback', { id: slot.recipeId })}
        <span className="text-ink-black/50">
          {' '}
          · {t('weekly.peopleSuffix', { n: slot.people })}
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="opacity-50 hover:opacity-100 hover:text-red-600"
        aria-label={t('weekly.removeSlot')}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function DayCell({
  day,
  meal,
  slots,
  recipesById,
  onRemoveSlot,
}: {
  day: Weekday;
  meal: Meal;
  slots: PlanSlot[];
  recipesById: Map<number, Recipe>;
  onRemoveSlot: (idx: number) => void;
}) {
  const { t } = useI18n();
  const { isOver, setNodeRef } = useDroppable({ id: targetId({ day, meal }) });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[3.5rem] rounded-lg border border-dashed p-1.5 flex flex-col gap-1 transition-colors ${
        isOver ? 'border-ink-black bg-ink-black/5' : 'border-ink-black/15'
      }`}
    >
      {slots.length === 0 ? (
        <span className="text-[11px] text-ink-black/30 self-center my-2">{t('weekly.dropHere')}</span>
      ) : (
        slots.map((s, idx) => (
          <SlotChip
            key={idx}
            day={day}
            meal={meal}
            index={idx}
            slot={s}
            recipe={recipesById.get(s.recipeId) ?? null}
            onRemove={() => onRemoveSlot(idx)}
          />
        ))
      )}
    </div>
  );
}

function dayNutritionTotals(
  plan: WeeklyPlan,
  day: Weekday,
  recipesById: Map<number, Recipe>,
): { kcal: number; nutrition: Nutrition } {
  const dayPlan = plan[day];
  let kcal = 0;
  const nutrition: Nutrition = { protein: 0, carbs: 0, sugars: 0, fat: 0, fiber: 0 };
  if (!dayPlan) return { kcal, nutrition };
  for (const meal of MEALS) {
    const slots = dayPlan[meal] ?? [];
    for (const slot of slots) {
      const r = recipesById.get(slot.recipeId);
      if (!r) continue;
      const f = scaleFactor(r, slot.people);
      kcal += r.kcal * f;
      const n = scaleNutrition(r.nutrition, f);
      nutrition.protein += n.protein;
      nutrition.carbs += n.carbs;
      nutrition.sugars += n.sugars;
      nutrition.fat += n.fat;
      nutrition.fiber += n.fiber;
    }
  }
  return { kcal, nutrition };
}

export function WeeklyPlanner({
  recipes,
  plan,
  onChange,
  showSnack,
  onToggleSnack,
}: Props) {
  const { t } = useI18n();
  const [activeMeals, setActiveMeals] = useState<Set<Meal>>(
    new Set(MEALS.filter((m) => m !== 'snack')),
  );

  const recipesById = useMemo(() => {
    const m = new Map<number, Recipe>();
    recipes.forEach((r) => m.set(r.id, r));
    return m;
  }, [recipes]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    const overId = e.over?.id;
    const draggedId = e.active.id;
    if (!overId || typeof overId !== 'string' || typeof draggedId !== 'string') return;
    const target = parseTargetId(overId);
    const source = parseDragSource(draggedId);
    if (!target || !source) return;

    if (source.type === 'pool') {
      const recipe = recipesById.get(source.recipeId);
      if (!recipe) return;
      const next = setSlots(plan, target.day, target.meal, [
        ...getSlots(plan, target.day, target.meal),
        { recipeId: source.recipeId, people: recipe.baseServings || 2 },
      ]);
      onChange(next);
      return;
    }

    if (source.day === target.day && source.meal === target.meal) return;
    const fromSlots = getSlots(plan, source.day, source.meal);
    const moving = fromSlots[source.index];
    if (!moving) return;
    let next = setSlots(
      plan,
      source.day,
      source.meal,
      fromSlots.filter((_, i) => i !== source.index),
    );
    next = setSlots(next, target.day, target.meal, [
      ...getSlots(next, target.day, target.meal),
      moving,
    ]);
    onChange(next);
  }

  function removeSlot(day: Weekday, meal: Meal, idx: number) {
    onChange(
      setSlots(
        plan,
        day,
        meal,
        getSlots(plan, day, meal).filter((_, i) => i !== idx),
      ),
    );
  }

  const visibleMeals = MEALS.filter((m) => activeMeals.has(m) || m !== 'snack');

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-6">
        <aside className="border border-ink-black/10 rounded-2xl p-4 flex flex-col gap-2 lg:max-h-[600px] overflow-y-auto scrollbar-thin">
          <h3 className="font-semibold text-sm flex items-center justify-between">
            {t('weekly.menuPool')}
            <span className="text-xs text-ink-black/50">{recipes.length}</span>
          </h3>
          <p className="text-xs text-ink-black/50 leading-snug">{t('weekly.dragHint')}</p>
          <div className="flex flex-col gap-1.5 mt-2">
            {recipes.length === 0 ? (
              <p className="text-xs text-ink-black/40 italic mt-2">{t('weekly.addToMenuFirst')}</p>
            ) : (
              recipes.map((r) => <PoolItem key={r.id} recipe={r} />)
            )}
          </div>
        </aside>

        <div className="overflow-x-auto scrollbar-thin">
          <div className="min-w-[720px]">
            <table className="w-full border-separate border-spacing-1.5">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-ink-black/60 px-2">
                    {t('weekly.mealHeader')}
                  </th>
                  {WEEKDAYS.map((d) => (
                    <th
                      key={d}
                      className="text-left text-xs font-semibold text-ink-black px-2"
                    >
                      {t(`weekday.abbr.${d}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleMeals.map((meal) => (
                  <tr key={meal}>
                    <td className="text-sm font-medium text-ink-black/80 align-top px-2 py-1.5 whitespace-nowrap">
                      {t(`meal.${meal}`)}
                    </td>
                    {WEEKDAYS.map((d) => (
                      <td key={d} className="align-top">
                        {meal !== 'snack' || showSnack[d] ? (
                          <DayCell
                            day={d}
                            meal={meal}
                            slots={getSlots(plan, d, meal)}
                            recipesById={recipesById}
                            onRemoveSlot={(idx) => removeSlot(d, meal, idx)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggleSnack(d, true)}
                            className="w-full min-h-[3.5rem] text-xs text-ink-black/30 rounded-lg border border-dashed border-ink-black/15 hover:border-ink-black/40 hover:text-ink-black/60 inline-flex items-center justify-center gap-1"
                          >
                            <Plus size={12} /> {t('weekly.snackAdd')}
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="text-xs text-ink-black/50 px-2 pt-3">{t('weekly.dayTotals')}</td>
                  {WEEKDAYS.map((d) => {
                    const dayTot = dayNutritionTotals(plan, d, recipesById);
                    return (
                      <td key={d} className="px-2 pt-3 text-[11px] text-ink-black/60 align-top">
                        <div className="font-semibold text-ink-black">
                          {t('weekly.kcalLine', { n: Math.round(dayTot.kcal) })}
                        </div>
                        <div>P {Math.round(dayTot.nutrition.protein)}g</div>
                        <div>C {Math.round(dayTot.nutrition.carbs)}g</div>
                        <div>F {Math.round(dayTot.nutrition.fat)}g</div>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-xs text-ink-black/50">{t('weekly.showMeals')}</span>
        {MEALS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setActiveMeals((prev) => {
                const next = new Set(prev);
                if (next.has(m)) next.delete(m);
                else next.add(m);
                return next;
              });
            }}
            className={`text-xs rounded-full border px-3 py-1 transition-colors ${
              activeMeals.has(m) || m !== 'snack'
                ? 'border-ink-black bg-ink-black text-canvas-white'
                : 'border-ink-black/30 text-ink-black/60'
            }`}
          >
            {t(`meal.${m}`)}
          </button>
        ))}
      </div>
    </DndContext>
  );
}

export { dayNutritionTotals };
