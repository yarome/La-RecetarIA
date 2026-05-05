import { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Pencil, Plus, X } from 'lucide-react';
import { useStorage } from '../storage/useStorage';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeDetailModal } from '../components/RecipeDetailModal';
import type { Recipe } from '../api/types';
import { useI18n } from '../i18n/I18nProvider';

export function GroupDetailPage() {
  const { t } = useI18n();
  const { id: idStr } = useParams<{ id: string }>();
  const id = Number(idStr);
  const storage = useStorage();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [openRecipeId, setOpenRecipeId] = useState<number | null>(null);

  const { data: group, isLoading } = useQuery({
    queryKey: ['groups', id],
    queryFn: () => storage.getGroup(id),
    enabled: Number.isFinite(id),
  });

  const { data: allRecipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => storage.listRecipes(),
  });

  const recipesInGroup = useMemo(() => {
    const all = allRecipes ?? [];
    if (!group) return [] as Recipe[];
    const inSet = new Set(group.recipeIds);
    return all.filter((r) => inSet.has(r.id));
  }, [allRecipes, group]);

  const recipesNotInGroup = useMemo(() => {
    const all = allRecipes ?? [];
    if (!group) return [] as Recipe[];
    const inSet = new Set(group.recipeIds);
    return all.filter((r) => !inSet.has(r.id));
  }, [allRecipes, group]);

  const renameMut = useMutation({
    mutationFn: (name: string) => storage.renameGroup(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setEditing(false);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : t('common.failed')),
  });

  const addMut = useMutation({
    mutationFn: (recipeId: number) => storage.addRecipeToGroup(id, recipeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const removeMut = useMutation({
    mutationFn: (recipeId: number) => storage.removeRecipeFromGroup(id, recipeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => storage.deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      navigate('/catalogue/groups', { replace: true });
    },
  });

  const setFavoriteMut = useMutation({
    mutationFn: ({ rid, isFavorite }: { rid: number; isFavorite: boolean }) =>
      storage.setFavorite(rid, isFavorite),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const addToMenuMut = useMutation({
    mutationFn: ({ recipeId, peopleCount }: { recipeId: number; peopleCount: number }) =>
      storage.addToMenu(recipeId, peopleCount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });

  if (isLoading) return <Spinner label={t('groupDetail.loading')} />;
  if (!group) {
    return (
      <div>
        <p>{t('groupDetail.notFound')}</p>
        <Link to="/catalogue/groups" className="underline">
          {t('groupDetail.backCategories')}
        </Link>
      </div>
    );
  }

  const openRecipe = openRecipeId
    ? recipesInGroup.find((r) => r.id === openRecipeId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Link
            to="/catalogue/groups"
            className="inline-flex items-center gap-1 text-sm text-ink-black/60 hover:text-ink-black"
          >
            <ChevronLeft size={14} /> {t('groups.title')}
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="font-newyork text-4xl sm:text-5xl text-ink-black">{group.name}</h1>
            {!group.isProtected ? (
              <Button
                size="sm"
                variant="ghost"
                iconLeft={<Pencil size={14} />}
                onClick={() => {
                  setEditing(true);
                  setNewName(group.name);
                }}
              >
                {t('groupDetail.rename')}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            iconLeft={<Plus size={16} />}
            onClick={() => setShowAdd(true)}
            disabled={recipesNotInGroup.length === 0}
          >
            {t('groupDetail.addRecipes')}
          </Button>
          {!group.isProtected ? (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(t('groupDetail.deleteConfirm', { name: group.name })))
                  deleteMut.mutate();
              }}
            >
              {t('groupDetail.delete')}
            </Button>
          ) : null}
        </div>
      </header>

      {recipesInGroup.length === 0 ? (
        <div className="border border-dashed border-ink-black/20 rounded-2xl p-12 text-center text-ink-black/60">
          {t('groupDetail.empty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipesInGroup.map((r) => (
            <div key={r.id} className="relative">
              <RecipeCard
                recipe={r}
                onClick={() => setOpenRecipeId(r.id)}
                onToggleFavorite={() =>
                  setFavoriteMut.mutate({ rid: r.id, isFavorite: !r.isFavorite })
                }
                onAddToMenu={(people) =>
                  addToMenuMut.mutate({ recipeId: r.id, peopleCount: people })
                }
              />
              {!group.isProtected ? (
                <button
                  type="button"
                  onClick={() => removeMut.mutate(r.id)}
                  className="absolute top-3 left-3 w-8 h-8 inline-flex items-center justify-center rounded-full bg-canvas-white/90 text-ink-black/60 hover:text-red-600"
                  aria-label={t('groupDetail.removeFromGroup')}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editing}
        onClose={() => {
          setEditing(false);
          setError(null);
        }}
        title={t('groupDetail.renameTitle')}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
            >
              {t('menu.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => newName.trim() && renameMut.mutate(newName.trim())}
              disabled={!newName.trim() || renameMut.isPending}
            >
              {t('groupDetail.save')}
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          label={t('groups.name')}
          id="renameInput"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          error={error ?? undefined}
        />
      </Modal>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={t('groupDetail.addTitle')}
        size="md"
      >
        {recipesNotInGroup.length === 0 ? (
          <p className="text-ink-black/60">{t('groupDetail.allHere')}</p>
        ) : (
          <ul className="divide-y divide-ink-black/10">
            {recipesNotInGroup.map((r) => (
              <li
                key={r.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <span>{r.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  iconLeft={<Plus size={14} />}
                  onClick={() => addMut.mutate(r.id)}
                  disabled={addMut.isPending}
                >
                  {t('groupDetail.addBtn')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <RecipeDetailModal
        open={openRecipeId !== null}
        recipe={openRecipe}
        onClose={() => setOpenRecipeId(null)}
        onToggleFavorite={() =>
          openRecipe &&
          setFavoriteMut.mutate({ rid: openRecipe.id, isFavorite: !openRecipe.isFavorite })
        }
        onAddToMenu={(people) =>
          openRecipe && addToMenuMut.mutate({ recipeId: openRecipe.id, peopleCount: people })
        }
        onDelete={() => {}}
        onEdit={() => {}}
      />
    </div>
  );
}
