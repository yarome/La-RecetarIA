import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { LoginPage } from './auth/LoginPage';
import { useAuthStore } from './auth/useAuthStore';
import { CataloguePage } from './pages/CataloguePage';
import { GroupsPage } from './pages/GroupsPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { MenuPage } from './pages/MenuPage';
import { ShoppingListPage } from './pages/ShoppingListPage';

export default function App() {
  const queryClient = useQueryClient();
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const unsub = useAuthStore.subscribe((state, prev) => {
      if (state.token !== prev.token) {
        queryClient.clear();
      }
    });
    return unsub;
  }, [queryClient]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/catalogue" replace />} />
        <Route path="/catalogue" element={<CataloguePage />} />
        <Route path="/catalogue/groups" element={<GroupsPage />} />
        <Route path="/catalogue/groups/:id" element={<GroupDetailPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/shopping-list" element={<ShoppingListPage />} />
        <Route path="*" element={<Navigate to="/catalogue" replace />} />
      </Route>
    </Routes>
  );
}
