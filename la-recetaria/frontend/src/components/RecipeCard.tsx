import { useState } from 'react';
import { Clock, Heart, Plus, ImageOff } from 'lucide-react';
import type { Recipe } from '../api/types';
import { useI18n } from '../i18n/I18nProvider';
import { TagPill } from './TagPill';
import { ServingsStepper } from './ServingsStepper';

interface Props {
  recipe: Recipe;
  onToggleFavorite: () => void;
  onAddToMenu: (people: number) => void;
  onClick: () => void;
  busy?: boolean;
}

export function RecipeCard({
  recipe,
  onToggleFavorite,
  onAddToMenu,
  onClick,
  busy,
}: Props) {
  const { t } = useI18n();
  const [people, setPeople] = useState(recipe.baseServings || 2);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article
      className="group flex h-[22.5rem] sm:h-[24.5rem] lg:h-[26.5rem] flex-col bg-canvas-white border border-ink-black/10 rounded-2xl overflow-hidden hover:border-ink-black/40 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-40 sm:h-44 lg:h-52 bg-ink-black/5 overflow-hidden shrink-0">
        {recipe.imageUrl && !imgFailed ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-black/20">
            <ImageOff size={48} />
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`absolute top-3 right-3 w-9 h-9 inline-flex items-center justify-center rounded-full transition-colors ${
            recipe.isFavorite
              ? 'bg-canvas-white text-red-500'
              : 'bg-canvas-white/80 hover:bg-canvas-white text-ink-black/60 hover:text-red-500'
          }`}
          aria-label={
            recipe.isFavorite ? t('recipeCard.favoriteRemove') : t('recipeCard.favoriteAdd')
          }
        >
          <Heart
            size={18}
            fill={recipe.isFavorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex items-start gap-3">
          <h3 className="font-newyork text-xl sm:text-2xl text-ink-black flex-1 leading-tight max-h-[2.85rem] sm:max-h-[3.15rem] lg:max-h-[3.4rem] overflow-hidden">
            {recipe.name}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-black/60">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {recipe.prepTimeMin} {t('recipeCard.min')}
          </span>
          {recipe.kcal > 0 ? (
            <span>·</span>
          ) : null}
          {recipe.kcal > 0 ? (
            <span>
              {Math.round(recipe.kcal / Math.max(recipe.baseServings, 1))}{' '}
              {t('recipeCard.kcalPerServ')}
            </span>
          ) : null}
        </div>
        {recipe.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-[2.6rem] sm:max-h-[2.9rem] lg:max-h-[3.2rem] overflow-hidden">
            {recipe.tags.slice(0, 4).map((t) => (
              <TagPill key={t} label={t} size="xs" />
            ))}
            {recipe.tags.length > 4 ? (
              <TagPill label={`+${recipe.tags.length - 4}`} size="xs" />
            ) : null}
          </div>
        ) : null}
        <div
          className="mt-auto pt-3 border-t border-ink-black/10 flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <ServingsStepper value={people} onChange={setPeople} />
          <button
            type="button"
            onClick={() => onAddToMenu(people)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-black bg-ink-black text-canvas-white px-4 py-1.5 text-sm hover:bg-canvas-white hover:text-ink-black transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
            <span>{t('recipeCard.add')}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
