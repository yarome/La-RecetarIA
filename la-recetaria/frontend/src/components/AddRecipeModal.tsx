import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Recipe, RecipeInput } from '../api/types';
import { Modal } from './ui/Modal';
import { Input, Textarea } from './ui/Input';
import { Button } from './ui/Button';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  open: boolean;
  initial?: Recipe | null;
  onClose: () => void;
  onSubmit: (input: RecipeInput) => Promise<void> | void;
}

interface IngredientField {
  name: string;
  quantity: string;
  unit: string;
}

function blankInput(): RecipeInput {
  return {
    name: '',
    imageUrl: null,
    prepTimeMin: 0,
    baseServings: 2,
    tags: [],
    ingredients: [],
    kcal: 0,
    nutrition: { protein: 0, carbs: 0, sugars: 0, fat: 0, fiber: 0 },
    steps: [],
    videoUrl: null,
    isFavorite: false,
  };
}

export function AddRecipeModal({ open, initial, onClose, onSubmit }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [prepTimeMin, setPrepTimeMin] = useState('30');
  const [baseServings, setBaseServings] = useState('2');
  const [tagsRaw, setTagsRaw] = useState('');
  const [ingredients, setIngredients] = useState<IngredientField[]>([]);
  const [stepsRaw, setStepsRaw] = useState('');
  const [kcal, setKcal] = useState('0');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [sugars, setSugars] = useState('0');
  const [fat, setFat] = useState('0');
  const [fiber, setFiber] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const src = initial ?? blankInput();
    setName(src.name);
    setImageUrl(src.imageUrl ?? '');
    setVideoUrl(src.videoUrl ?? '');
    setPrepTimeMin(String(src.prepTimeMin));
    setBaseServings(String(src.baseServings));
    setTagsRaw(src.tags.join(', '));
    setIngredients(
      src.ingredients.map((i) => ({
        name: i.name,
        quantity: String(i.quantity),
        unit: i.unit,
      })),
    );
    setStepsRaw(src.steps.join('\n'));
    setKcal(String(src.kcal));
    setProtein(String(src.nutrition.protein));
    setCarbs(String(src.nutrition.carbs));
    setSugars(String(src.nutrition.sugars));
    setFat(String(src.nutrition.fat));
    setFiber(String(src.nutrition.fiber));
    setError(null);
  }, [open, initial]);

  function addIngredient() {
    setIngredients((arr) => [...arr, { name: '', quantity: '0', unit: 'g' }]);
  }

  function updateIngredient(idx: number, patch: Partial<IngredientField>) {
    setIngredients((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeIngredient(idx: number) {
    setIngredients((arr) => arr.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('addRecipe.nameRequired'));
      return;
    }

    const tags = tagsRaw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const steps = stepsRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const cleanIngredients = ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: Number(i.quantity) || 0,
        unit: i.unit.trim() || 'unit',
      }));

    const input: RecipeInput = {
      name: trimmedName,
      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      videoUrl: videoUrl.trim() ? videoUrl.trim() : null,
      prepTimeMin: Math.max(0, Number(prepTimeMin) || 0),
      baseServings: Math.max(1, Number(baseServings) || 1),
      tags,
      ingredients: cleanIngredients,
      kcal: Math.max(0, Number(kcal) || 0),
      nutrition: {
        protein: Math.max(0, Number(protein) || 0),
        carbs: Math.max(0, Number(carbs) || 0),
        sugars: Math.max(0, Number(sugars) || 0),
        fat: Math.max(0, Number(fat) || 0),
        fiber: Math.max(0, Number(fiber) || 0),
      },
      steps,
      isFavorite: initial?.isFavorite ?? false,
    };

    try {
      setSubmitting(true);
      await onSubmit(input);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addRecipe.errorSave'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? t('addRecipe.editTitle') : t('addRecipe.newTitle')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t('addRecipe.cancel')}
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="add-recipe-form"
            disabled={submitting}
          >
            {submitting
              ? t('addRecipe.saving')
              : initial
                ? t('addRecipe.saveChanges')
                : t('addRecipe.create')}
          </Button>
        </>
      }
    >
      <form id="add-recipe-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            id="name"
            label={t('addRecipe.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="imageUrl"
            label={t('addRecipe.imageUrl')}
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder={t('addRecipe.placeholderUrl')}
          />
          <Input
            id="prepTimeMin"
            label={t('addRecipe.prepTime')}
            type="number"
            min="0"
            value={prepTimeMin}
            onChange={(e) => setPrepTimeMin(e.target.value)}
          />
          <Input
            id="baseServings"
            label={t('addRecipe.baseServings')}
            type="number"
            min="1"
            value={baseServings}
            onChange={(e) => setBaseServings(e.target.value)}
          />
          <Input
            id="tags"
            label={t('addRecipe.tags')}
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder={t('addRecipe.placeholderTags')}
          />
          <Input
            id="videoUrl"
            label={t('addRecipe.videoUrl')}
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={t('addRecipe.placeholderUrl')}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base">{t('addRecipe.ingredients')}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={addIngredient}
            >
              {t('addRecipe.addIngredient')}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_5rem_5rem_2.5rem] gap-2 items-center">
                <input
                  className="rounded-lg border border-ink-black/30 px-3 py-1.5 text-sm"
                  placeholder={t('addRecipe.ingredientPh')}
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, { name: e.target.value })}
                />
                <input
                  className="rounded-lg border border-ink-black/30 px-3 py-1.5 text-sm"
                  type="number"
                  step="0.01"
                  min="0"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(idx, { quantity: e.target.value })}
                />
                <input
                  className="rounded-lg border border-ink-black/30 px-3 py-1.5 text-sm"
                  placeholder={t('addRecipe.unitPh')}
                  value={ing.unit}
                  onChange={(e) => updateIngredient(idx, { unit: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-full text-ink-black/50 hover:text-red-600 hover:bg-red-50"
                  aria-label={t('common.remove')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {ingredients.length === 0 ? (
              <p className="text-sm text-ink-black/50">{t('addRecipe.noIngredients')}</p>
            ) : null}
          </div>
        </div>

        <Textarea
          id="steps"
          label={t('addRecipe.steps')}
          rows={5}
          value={stepsRaw}
          onChange={(e) => setStepsRaw(e.target.value)}
          placeholder={t('addRecipe.stepsPh')}
        />

        <div>
          <h3 className="font-semibold text-base mb-2">{t('addRecipe.nutritionHeading')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            <Input id="kcal" label={t('nutrition.kcal')} type="number" min="0" value={kcal} onChange={(e) => setKcal(e.target.value)} />
            <Input id="protein" label={t('nutrition.proteinG')} type="number" min="0" value={protein} onChange={(e) => setProtein(e.target.value)} />
            <Input id="carbs" label={t('nutrition.carbsG')} type="number" min="0" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            <Input id="sugars" label={t('nutrition.sugarsG')} type="number" min="0" value={sugars} onChange={(e) => setSugars(e.target.value)} />
            <Input id="fat" label={t('nutrition.fatG')} type="number" min="0" value={fat} onChange={(e) => setFat(e.target.value)} />
            <Input id="fiber" label={t('nutrition.fiberG')} type="number" min="0" value={fiber} onChange={(e) => setFiber(e.target.value)} />
          </div>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </form>
    </Modal>
  );
}
