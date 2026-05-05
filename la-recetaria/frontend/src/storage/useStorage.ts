import { useMemo } from 'react';
import { useAuthStore } from '../auth/useAuthStore';
import { ApiStorage } from './ApiStorage';
import { LocalStorageBackend } from './LocalStorage';
import type { StorageBackend } from './Storage';

const apiStorage = new ApiStorage();
const localStorage = new LocalStorageBackend();

export function useStorage(): StorageBackend {
  const token = useAuthStore((s) => s.token);
  return useMemo(() => (token ? apiStorage : localStorage), [token]);
}

export function useStorageMode(): 'api' | 'local' {
  const token = useAuthStore((s) => s.token);
  return token ? 'api' : 'local';
}
