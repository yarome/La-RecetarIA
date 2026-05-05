import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../api/types';
import { apiFetch, configureApiClient } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  bootstrap: () => Promise<void>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      async login(email, password) {
        set({ isLoading: true, error: null });
        try {
          const result = await apiFetch<{ token: string; user: User }>(
            '/api/auth/login',
            {
              method: 'POST',
              body: JSON.stringify({ email, password }),
              skipAuth: true,
            },
          );
          set({
            token: result.token,
            user: result.user,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Login failed',
          });
          throw err;
        }
      },

      logout() {
        set({ user: null, token: null, error: null });
      },

      async bootstrap() {
        if (!get().token) return;
        try {
          const result = await apiFetch<{ user: User }>('/api/auth/me');
          set({ user: result.user });
        } catch {
          set({ user: null, token: null });
        }
      },

      clear() {
        set({ user: null, token: null, error: null });
      },
    }),
    {
      name: 'la-recetaria:auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);

configureApiClient({
  getToken: () => useAuthStore.getState().token,
  onUnauthorised: () => useAuthStore.getState().clear(),
});
