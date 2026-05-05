import { useEffect, useState } from 'react';
import { Clock, Heart, ExternalLink, Plus, Trash2 } from 'lucide-react';
import type { Recipe } from '../api/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { TagPill } from './TagPill';
import { ServingsStepper } from './ServingsStepper';
import { formatQuantity, scaleFactor, scaleIngredient, scaleNutrition } from '../util/scale';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  open: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onToggleFavorite: () => void;
  onAddToMenu: (people: number) => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function RecipeDetailModal({
  open,
  recipe,
  onClose,
  onToggleFavorite,
  onAddToMenu,
  onDelete,
  onEdit,
}: Props) {
  const { t } = useI18n();
  const [people, setPeople] = useState(2);

  useEffect(() => {
    if (recipe) setPeople(recipe.baseServings || 2);
  }, [recipe]);

  if (!recipe) return null;

  const factor = scaleFactor(recipe, people);
  const scaledKcal = recipe.kcal * factor;
  const scaledNutrition = scaleNutrition(recipe.nutrition, factor);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={recipe.name}
      size="lg"
      footer={
        <>
          <Button variant="danger" iconLeft={<Trash2 size={16} />} onClick={onDelete}>
            {t('recipeDetail.delete')}
          </Button>
          <Button variant="ghost" onClick={onEdit}>
            {t('recipeDetail.edit')}
          </Button>
          <Button
            variant="primary"
            iconLeft={<Plus size={16} />}
            onClick={() => onAddToMenu(people)}
          >
            {t('recipeDetail.addToMenu')}
          </Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-[1fr_1.2fr] gap-6">
        <div>
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full aspect-[4/3] object-cover rounded-xl bg-ink-black/5"
            />
          ) : (
            <div className="w-full aspect-[4/3] rounded-xl bg-ink-black/5" />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.tags.map((t) => (
              <TagPill key={t} label={t} />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-ink-black/70">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} /> {recipe.prepTimeMin} {t('recipeCard.min')}
            </span>
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`inline-flex items-center gap-1.5 ${
                recipe.isFavorite ? 'text-red-500' : 'text-ink-black/60 hover:text-red-500'
              }`}
            >
              <Heart size={14} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
              {recipe.isFavorite ? t('recipeDetail.favorited') : t('recipeDetail.addFavorites')}
            </button>
            {recipe.videoUrl ? (
              <a
                href={recipe.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 underline hover:no-underline"
              >
                <ExternalLink size={14} /> {t('recipeDetail.sourceVideo')}
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-lg font-bold">{t('recipeDetail.ingredients')}</h3>
              <ServingsStepper value={people} onChange={setPeople} />
            </div>
            <ul className="mt-3 divide-y divide-ink-black/10">
              {recipe.ingredients.map((ing, idx) => {
                const scaled = scaleIngredient(ing, factor);
                return (
                  <li
                    key={`${ing.name}-${idx}`}
                    className="py-2 flex items-center justify-between gap-4"
                  >
                    <span>{ing.name}</span>
                    <span className="text-ink-black/70 text-sm whitespace-nowrap">
                      {formatQuantity(scaled.quantity, ing.unit)}
                    </span>
                  </li>
                );
              })}
              {recipe.ingredients.length === 0 ? (
                <li className="py-2 text-ink-black/50 text-sm">{t('recipeDetail.noIngredients')}</li>
              ) : null}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold">
              {t('recipeDetail.nutritionFor', { people })}
            </h3>
            <dl className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
              {(
                [
                  ['kcal', Math.round(scaledKcal)],
                  ['protein', Math.round(scaledNutrition.protein)],
                  ['carbs', Math.round(scaledNutrition.carbs)],
                  ['sugars', Math.round(scaledNutrition.sugars)],
                  ['fat', Math.round(scaledNutrition.fat)],
                  ['fiber', Math.round(scaledNutrition.fiber)],
                ] as const
              ).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-ink-black/10 py-2">
                  <dt className="text-[10px] uppercase tracking-wider text-ink-black/50">
                    {t(`nutrition.${key}`)}
                  </dt>
                  <dd className="text-base font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-bold">{t('recipeDetail.steps')}</h3>
            <ol className="mt-3 flex flex-col gap-3">
              {recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full border border-ink-black/30 inline-flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-base leading-relaxed">{s}</span>
                </li>
              ))}
              {recipe.steps.length === 0 ? (
                <li className="text-ink-black/50 text-sm">{t('recipeDetail.noSteps')}</li>
              ) : null}
            </ol>
          </div>
        </div>
      </div>
    </Modal>
  );
}
