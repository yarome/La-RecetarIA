import { useMemo, useState } from 'react';
import { LogIn, Plus, Search, FolderOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Recipe, RecipeInput } from '../api/types';
import { useStorage, useStorageMode } from '../storage/useStorage';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeDetailModal } from '../components/RecipeDetailModal';
import { AddRecipeModal } from '../components/AddRecipeModal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { TagPill } from '../components/TagPill';
import { useI18n } from '../i18n/I18nProvider';

export function CataloguePage() {
  const { t } = useI18n();
  const storage = useStorage();
  const storageMode = useStorageMode();
  const location = useLocation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Recipe | null>(null);
  const [openRecipeId, setOpenRecipeId] = useState<number | null>(null);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => storage.listRecipes(),
  });

  const allTags = useMemo(() => {
    const set = new Set<string>();
    (recipes ?? []).forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [recipes]);

  const filtered = useMemo(() => {
    let list = recipes ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q)),
      );
    }
    if (activeTag) list = list.filter((r) => r.tags.includes(activeTag));
    return list;
  }, [recipes, search, activeTag]);

  const setFavoriteMut = useMutation({
    mutationFn: ({ id, isFavorite }: { id: number; isFavorite: boolean }) =>
      storage.setFavorite(id, isFavorite),
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

  const createMut = useMutation({
    mutationFn: (input: RecipeInput) => storage.createRecipe(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: number; input: RecipeInput }) =>
      storage.updateRecipe(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => storage.deleteRecipe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['menu'] });
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const openRecipe = openRecipeId
    ? (recipes ?? []).find((r) => r.id === openRecipeId) ?? null
    : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-newyork text-4xl sm:text-5xl text-ink-black">{t('catalogue.title')}</h1>
            <p className="text-ink-black/60 mt-1">{t('catalogue.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/catalogue/groups"
              className="inline-flex items-center gap-2 rounded-full border border-ink-black px-4 py-2 text-sm hover:bg-ink-black hover:text-canvas-white transition-colors"
            >
              <FolderOpen size={16} /> {t('catalogue.categories')}
            </Link>
            <Button
              variant="primary"
              iconLeft={<Plus size={16} />}
              onClick={() => {
                setEditTarget(null);
                setShowAdd(true);
              }}
            >
              {t('catalogue.addRecipe')}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 border border-ink-black/20 rounded-full px-4 py-2 max-w-lg">
          <Search size={16} className="text-ink-black/60" />
          <input
            className="flex-1 bg-transparent outline-none text-base"
            placeholder={t('catalogue.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {allTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <TagPill
              label={t('catalogue.all')}
              active={activeTag === null}
              onClick={() => setActiveTag(null)}
            />
            {allTags.map((t) => (
              <TagPill
                key={t}
                label={t}
                active={activeTag === t}
                onClick={() => setActiveTag(t === activeTag ? null : t)}
              />
            ))}
          </div>
        ) : null}
      </header>

      {isLoading ? (
        <Spinner label={t('catalogue.loading')} />
      ) : filtered.length === 0 ? (
        (recipes?.length ?? 0) > 0 ? (
          <div className="border border-dashed border-ink-black/20 rounded-2xl p-12 text-center">
            <p className="text-ink-black/60">{t('catalogue.noMatch')}</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => {
                setSearch('');
                setActiveTag(null);
              }}
            >
              {t('catalogue.clearFilters')}
            </Button>
          </div>
        ) : storageMode === 'local' ? (
          <div className="border border-dashed border-ink-black/25 rounded-2xl p-10 sm:p-12 text-center max-w-lg mx-auto">
            <h2 className="font-newyork text-2xl sm:text-3xl text-ink-black mb-2">
              {t('catalogue.guestTitle')}
            </h2>
            <p className="text-ink-black/60 text-sm sm:text-base leading-relaxed mb-6">
              {t('catalogue.guestBody')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                state={{ from: location.pathname }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-black bg-ink-black text-canvas-white px-6 py-2.5 text-base font-medium hover:bg-canvas-white hover:text-ink-black transition-colors w-full sm:w-auto"
              >
                <LogIn size={18} />
                {t('catalogue.logInSeeRecipes')}
              </Link>
              <Button
                variant="ghost"
                iconLeft={<Plus size={16} />}
                onClick={() => {
                  setEditTarget(null);
                  setShowAdd(true);
                }}
                className="w-full sm:w-auto"
              >
                {t('catalogue.createLocalRecipe')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-ink-black/20 rounded-2xl p-12 text-center">
            <p className="text-ink-black/60">{t('catalogue.emptyLoggedIn')}</p>
            <Button
              variant="ghost"
              iconLeft={<Plus size={16} />}
              onClick={() => {
                setEditTarget(null);
                setShowAdd(true);
              }}
              className="mt-4"
            >
              {t('catalogue.createFirst')}
            </Button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onClick={() => setOpenRecipeId(r.id)}
              onToggleFavorite={() =>
                setFavoriteMut.mutate({ id: r.id, isFavorite: !r.isFavorite })
              }
              onAddToMenu={(people) =>
                addToMenuMut.mutate({ recipeId: r.id, peopleCount: people })
              }
              busy={addToMenuMut.isPending}
            />
          ))}
        </div>
      )}

      <RecipeDetailModal
        open={openRecipeId !== null}
        recipe={openRecipe}
        onClose={() => setOpenRecipeId(null)}
        onToggleFavorite={() =>
          openRecipe &&
          setFavoriteMut.mutate({ id: openRecipe.id, isFavorite: !openRecipe.isFavorite })
        }
        onAddToMenu={(people) =>
          openRecipe && addToMenuMut.mutate({ recipeId: openRecipe.id, peopleCount: people })
        }
        onDelete={() => {
          if (!openRecipe) return;
          if (confirm(t('catalogue.deleteConfirm', { name: openRecipe.name }))) {
            deleteMut.mutate(openRecipe.id);
            setOpenRecipeId(null);
          }
        }}
        onEdit={() => {
          if (!openRecipe) return;
          setEditTarget(openRecipe);
          setOpenRecipeId(null);
          setShowAdd(true);
        }}
      />

      <AddRecipeModal
        open={showAdd}
        initial={editTarget}
        onClose={() => {
          setShowAdd(false);
          setEditTarget(null);
        }}
        onSubmit={async (input) => {
          if (editTarget) {
            await updateMut.mutateAsync({ id: editTarget.id, input });
          } else {
            await createMut.mutateAsync(input);
          }
        }}
      />
    </div>
  );
}
