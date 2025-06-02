// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAuthStore } from './store/authStore'; //
import 'react-quill/dist/quill.snow.css'; // Ou quill.bubble.css

// Componentes de Layout e Proteção (carregados diretamente pois são essenciais para a estrutura)
import Layout from './components/Layout/Layout'; //
import ProtectedRoute from './components/ProtectedRoute'; //
import NotFoundPage from './pages/NotFoundPage'; //

// Lazy load das páginas principais
const LoginPage = React.lazy(() => import('./pages/LoginPage')); //
const RegisterPage = React.lazy(() => import('./pages/RegisterPage')); //
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard')); //
const AdvisorDashboard = React.lazy(() => import('./pages/advisor/AdvisorDashboard')); //
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard')); //
const DocumentListPage = React.lazy(() => import('./pages/DocumentListPage')); //
const DocumentViewPage = React.lazy(() => import('./pages/DocumentViewPage')); //
const DocumentEditPage = React.lazy(() => import('./pages/DocumentEditPage')); //
const ProfilePage = React.lazy(() => import('./pages/ProfilePage')); //
const AdvisorStudentsPage = React.lazy(() => import('./pages/advisor/AdvisorStudentsPage')); //
const MyCommentsPage = React.lazy(() => import('./pages/MyCommentsPage')); //
const AdminRegistrationListPage = React.lazy(() => import('./pages/admin/AdminRegistrationListPage')); //
const AdminUserListPage = React.lazy(() => import('./pages/admin/AdminUserListPage')); //
const MetricsPage = React.lazy(() => import('./pages/admin/MetricsPage')); //


// Componente de fallback visual enquanto as páginas lazy-loaded são carregadas
const PageLoader: React.FC = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white bg-opacity-90">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
    <p className="mt-4 text-lg font-medium text-gray-700">Carregando página...</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Tenta novamente apenas 1 vez em caso de falha na query
      refetchOnWindowFocus: false, // Evita refetch automático ao focar na janela
    },
  },
});

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore(); //

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* Suspense envolve todas as rotas para lidar com o carregamento preguiçoso das páginas */}
        <Suspense fallback={<PageLoader />}>
          <div className="App"> {/* Classe de App.css */}
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
              <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

              {/* Rotas Protegidas (requerem autenticação) */}
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<RoleBasedDashboard />} />

                {/* Rotas específicas para cada papel */}
                <Route path="student/*" element={<ProtectedRoute requiredRole="STUDENT"><StudentRoutes /></ProtectedRoute>} />
                <Route path="advisor/*" element={<ProtectedRoute requiredRole="ADVISOR"><AdvisorRoutes /></ProtectedRoute>} />
                <Route path="admin/*" element={<ProtectedRoute requiredRole="ADMIN"><AdminRoutes /></ProtectedRoute>} />

                {/* Rotas compartilhadas dentro do layout protegido */}
                <Route path="profile" element={<ProfilePage />} />
                <Route path="notifications" element={<div>Notificações (Central de Notificações é um modal)</div>} />
                <Route path="my-comments" element={<MyCommentsPage />} />
              </Route>

              {/* Rota para página não encontrada */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            {/* Componente para exibir toasts (notificações globais) */}
            <Toaster
              position="top-right"
              toastOptions={{
                success: { duration: 3000 },
                error: { duration: 5000 },
                style: {
                  fontSize: '14px',
                  maxWidth: '400px',
                  padding: '12px 16px',
                  zIndex: 9999, // Garante que o toast fique sobre outros elementos
                },
              }}
            />
          </div>
        </Suspense>
      </Router>
      {/* Ferramentas de desenvolvimento para React Query (apenas em ambiente de desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

/**
 * Componente que agrupa as rotas específicas para o papel de Estudante.
 * As páginas internas (DocumentListPage, DocumentViewPage, etc.) já são lazy-loaded.
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
 * Componente que agrupa as rotas específicas para o papel de Orientador.
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
 * Componente que agrupa as rotas específicas para o papel de Administrador.
 */
const AdminRoutes: React.FC = () => (
  <Routes>
    <Route index element={<AdminDashboard />} /> {/* AdminDashboard é lazy-loaded */}
    <Route path="registrations" element={<AdminRegistrationListPage />} /> {/* AdminRegistrationListPage é lazy-loaded */}
    <Route path="users" element={<AdminUserListPage />} /> {/* AdminUserListPage é lazy-loaded */}
    <Route path="metrics" element={<MetricsPage />} /> {/* MetricsPage é lazy-loaded */}
    <Route path="settings" element={<div>Configurações (Placeholder)</div>} />
  </Routes>
);

/**
 * Componente que renderiza o dashboard apropriado com base no papel do usuário autenticado.
 */
const RoleBasedDashboard: React.FC = () => {
  const { isStudent, isAdvisor, isAdmin } = useAuthStore(); //
  if (isAdmin()) return <AdminDashboard />;
  if (isAdvisor()) return <AdvisorDashboard />;
  if (isStudent()) return <StudentDashboard />;
  // Fallback para login se nenhum papel corresponder ou se o usuário não estiver devidamente autenticado.
  return <Navigate to="/login" replace />;
};

export default App;