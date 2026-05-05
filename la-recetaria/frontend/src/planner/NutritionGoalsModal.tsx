import { useEffect, useState } from 'react';
import type { NutritionGoals } from '../api/types';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  open: boolean;
  goals: NutritionGoals;
  onClose: () => void;
  onSave: (goals: NutritionGoals) => Promise<void> | void;
}

export function NutritionGoalsModal({ open, goals, onClose, onSave }: Props) {
  const { t } = useI18n();
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [sugars, setSugars] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  useEffect(() => {
    if (!open) return;
    setKcal(String(goals.kcal));
    setProtein(String(goals.protein));
    setCarbs(String(goals.carbs));
    setSugars(String(goals.sugars));
    setFat(String(goals.fat));
    setFiber(String(goals.fiber));
  }, [open, goals]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('nutGoals.title')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('menu.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              onSave({
                kcal: Number(kcal) || 0,
                protein: Number(protein) || 0,
                carbs: Number(carbs) || 0,
                sugars: Number(sugars) || 0,
                fat: Number(fat) || 0,
                fiber: Number(fiber) || 0,
              })
            }
          >
            {t('nutGoals.save')}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-black/60 mb-4">{t('nutGoals.blurb')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Input
          id="g-kcal"
          label={t('nutrition.kcal')}
          type="number"
          min="0"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
        />
        <Input
          id="g-protein"
          label={t('nutrition.proteinG')}
          type="number"
          min="0"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />
        <Input
          id="g-carbs"
          label={t('nutrition.carbsG')}
          type="number"
          min="0"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
        />
        <Input
          id="g-sugars"
          label={t('nutrition.sugarsG')}
          type="number"
          min="0"
          value={sugars}
          onChange={(e) => setSugars(e.target.value)}
        />
        <Input
          id="g-fat"
          label={t('nutrition.fatG')}
          type="number"
          min="0"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
        />
        <Input
          id="g-fiber"
          label={t('nutrition.fiberG')}
          type="number"
          min="0"
          value={fiber}
          onChange={(e) => setFiber(e.target.value)}
        />
      </div>
    </Modal>
  );
}
