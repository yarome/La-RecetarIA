import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, FolderPlus, Heart, Trash2, Folder } from 'lucide-react';
import { useStorage } from '../storage/useStorage';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { useI18n } from '../i18n/I18nProvider';

export function GroupsPage() {
  const { t } = useI18n();
  const storage = useStorage();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => storage.listGroups(),
  });

  const createMut = useMutation({
    mutationFn: (n: string) => storage.createGroup(n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setShowCreate(false);
      setName('');
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : t('groups.createFailed'));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => storage.deleteGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-1 text-sm text-ink-black/60 hover:text-ink-black"
          >
            <ChevronLeft size={14} /> {t('groups.backCatalogue')}
          </Link>
          <h1 className="font-newyork text-4xl sm:text-5xl text-ink-black mt-2">
            {t('groups.title')}
          </h1>
          <p className="text-ink-black/60 mt-1">{t('groups.subtitle')}</p>
        </div>
        <Button
          variant="primary"
          iconLeft={<FolderPlus size={16} />}
          onClick={() => setShowCreate(true)}
        >
          {t('groups.newCategory')}
        </Button>
      </header>

      {isLoading ? (
        <Spinner label={t('groups.loading')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(groups ?? []).map((g) => (
            <Link
              key={g.id}
              to={`/catalogue/groups/${g.id}`}
              className="group flex flex-col gap-2 border border-ink-black/10 rounded-2xl p-6 hover:border-ink-black/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-ink-black/5 inline-flex items-center justify-center">
                  {g.isProtected ? (
                    <Heart className="text-red-500" fill="currentColor" size={22} />
                  ) : (
                    <Folder size={22} className="text-ink-black/60" />
                  )}
                </div>
                {!g.isProtected ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm(t('groups.deleteConfirm', { name: g.name })))
                        deleteMut.mutate(g.id);
                    }}
                    className="text-ink-black/30 hover:text-red-600"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
              <h3 className="font-newyork text-2xl">{g.name}</h3>
              <p className="text-xs text-ink-black/60">
                {g.recipeIds.length === 1
                  ? t('groups.recipeOne')
                  : t('groups.recipeMany', { n: g.recipeIds.length })}
              </p>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setError(null);
          setName('');
        }}
        title={t('groups.modalTitle')}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreate(false);
                setError(null);
                setName('');
              }}
            >
              {t('groups.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => name.trim() && createMut.mutate(name.trim())}
              disabled={!name.trim() || createMut.isPending}
            >
              {t('groups.create')}
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          label={t('groups.name')}
          id="groupName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('groups.namePh')}
          error={error ?? undefined}
        />
      </Modal>
    </div>
  );
}
