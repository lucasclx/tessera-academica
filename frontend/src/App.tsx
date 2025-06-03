// src/App.tsx - CORRIGIDO
import React, { Suspense } from 'react';
import { debugLog } from './utils/logger';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAuthStore } from './store/authStore';

// Componentes de Layout e Proteção (carregados diretamente)
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';

// Lazy load das páginas principais
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard'));
const AdvisorDashboard = React.lazy(() => import('./pages/advisor/AdvisorDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const DocumentListPage = React.lazy(() => import('./pages/DocumentListPage'));
const DocumentViewPage = React.lazy(() => import('./pages/DocumentViewPage'));
const DocumentEditPage = React.lazy(() => import('./pages/DocumentEditPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const AdvisorStudentsPage = React.lazy(() => import('./pages/advisor/AdvisorStudentsPage'));
const MyCommentsPage = React.lazy(() => import('./pages/MyCommentsPage'));
const AdminRegistrationListPage = React.lazy(() => import('./pages/admin/AdminRegistrationListPage'));
const AdminUserListPage = React.lazy(() => import('./pages/admin/AdminUserListPage'));
const MetricsPage = React.lazy(() => import('./pages/admin/MetricsPage'));

// Componente de fallback para carregamento
const PageLoader: React.FC = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white bg-opacity-90">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
    <p className="mt-4 text-lg font-medium text-gray-700">Carregando página...</p>
  </div>
);

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  debugLog('🚀 App renderizando', { isAuthenticated });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <div className="App">
            <Routes>
              {/* Rotas Públicas */}
              <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
              />
              <Route 
                path="/register" 
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
              />

              {/* Rotas Protegidas */}
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<RoleBasedDashboard />} />

                {/* Rotas específicas para estudantes */}
                <Route path="student/*" element={
                  <ProtectedRoute requiredRole="STUDENT">
                    <StudentRoutes />
                  </ProtectedRoute>
                } />

                {/* Rotas específicas para orientadores */}
                <Route path="advisor/*" element={
                  <ProtectedRoute requiredRole="ADVISOR">
                    <AdvisorRoutes />
                  </ProtectedRoute>
                } />

                {/* Rotas específicas para administradores */}
                <Route path="admin/*" element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminRoutes />
                  </ProtectedRoute>
                } />

                {/* Rotas compartilhadas */}
                <Route path="profile" element={<ProfilePage />} />
                <Route path="notifications" element={
                  <div className="p-6 text-center">
                    <h2 className="text-xl font-semibold mb-4">Central de Notificações</h2>
                    <p className="text-gray-600">
                      As notificações aparecem no sino no canto superior direito.
                    </p>
                  </div>
                } />
                <Route path="my-comments" element={<MyCommentsPage />} />
              </Route>

              {/* Página não encontrada */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            {/* Toaster para notificações globais */}
            <Toaster
              position="top-right"
              toastOptions={{
                success: { duration: 3000 },
                error: { duration: 5000 },
                style: {
                  fontSize: '14px',
                  maxWidth: '400px',
                  padding: '12px 16px',
                  zIndex: 9999,
                },
              }}
            />
          </div>
        </Suspense>
      </Router>

      {/* React Query DevTools (apenas em desenvolvimento) */}
      {import.meta.env?.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

/**
 * Rotas específicas para estudantes
 */
const StudentRoutes: React.FC = () => (
  <Routes>
    <Route index element={<Navigate to="documents" replace />} />
    <Route path="documents" element={<DocumentListPage />} />
    <Route path="documents/:id" element={<DocumentViewPage />} />
    <Route path="documents/:id/edit" element={<DocumentEditPage />} />
    <Route path="documents/new" element={<DocumentEditPage />} />
  </Routes>
);

/**
 * Rotas específicas para orientadores
 */
const AdvisorRoutes: React.FC = () => (
  <Routes>
    <Route index element={<Navigate to="documents" replace />} />
    <Route path="documents" element={<DocumentListPage />} />
    <Route path="documents/:id" element={<DocumentViewPage />} />
    <Route path="students" element={<AdvisorStudentsPage />} />
  </Routes>
);

/**
 * Rotas específicas para administradores
 */
const AdminRoutes: React.FC = () => (
  <Routes>
    <Route index element={<AdminDashboard />} />
    <Route path="registrations" element={<AdminRegistrationListPage />} />
    <Route path="users" element={<AdminUserListPage />} />
    <Route path="metrics" element={<MetricsPage />} />
    <Route path="settings" element={
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Configurações do Sistema</h2>
        <p className="text-gray-600">Funcionalidade em desenvolvimento.</p>
      </div>
    } />
  </Routes>
);

/**
 * Dashboard baseado no papel do usuário
 */
const RoleBasedDashboard: React.FC = () => {
  const { isStudent, isAdvisor, isAdmin } = useAuthStore();
  
  debugLog('🎯 RoleBasedDashboard', {
    isStudent: isStudent(), 
    isAdvisor: isAdvisor(), 
    isAdmin: isAdmin() 
  });

  if (isAdmin()) return <AdminDashboard />;
  if (isAdvisor()) return <AdvisorDashboard />;
  if (isStudent()) return <StudentDashboard />;
  
  // Fallback para usuários sem papel definido
  return <Navigate to="/login" replace />;
};

export default App;