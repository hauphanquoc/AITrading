import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { UsersPage } from '@/pages/Users';
import { PointsPage } from '@/pages/Points';
import { AIConfigPage } from '@/pages/AIConfig';
import { HistoryPage } from '@/pages/History';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/ai-config" element={<AIConfigPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
