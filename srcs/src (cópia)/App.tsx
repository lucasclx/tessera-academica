// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAuthStore } from './store/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import AdvisorDashboard from './pages/advisor/AdvisorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import DocumentListPage from './pages/DocumentListPage';
import DocumentViewPage from './pages/DocumentViewPage';
import DocumentEditPage from './pages/DocumentEditPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import AdvisorStudentsPage from './pages/advisor/AdvisorStudentsPage';
import MyCommentsPage from './pages/MyCommentsPage';
import AdminRegistrationListPage from './pages/admin/AdminRegistrationListPage';
import AdminUserListPage from './pages/admin/AdminUserListPage'; // <-- IMPORTAR A NOVA PÁGINA

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<RoleBasedDashboard />} />

              <Route path="student/*" element={<ProtectedRoute requiredRole="STUDENT"><StudentRoutes /></ProtectedRoute>} />
              <Route path="advisor/*" element={<ProtectedRoute requiredRole="ADVISOR"><AdvisorRoutes /></ProtectedRoute>} />
              <Route path="admin/*" element={<ProtectedRoute requiredRole="ADMIN"><AdminRoutes /></ProtectedRoute>} />

              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<div>Notificações (Placeholder - Central é modal)</div>} />
              <Route path="my-comments" element={<MyCommentsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster position="top-right" toastOptions={{ /* ... */ }} />
        </div>
      </Router>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

// Sub-componentes de Rota
const StudentRoutes: React.FC = () => ( /* ... sem alterações ... */ 
  <Routes>
    <Route index element={<Navigate to="documents" replace />} />
    <Route path="documents" element={<DocumentListPage />} />
    <Route path="documents/:id" element={<DocumentViewPage />} />
    <Route path="documents/:id/edit" element={<DocumentEditPage />} />
    <Route path="documents/new" element={<DocumentEditPage />} />
  </Routes>
);

const AdvisorRoutes: React.FC = () => ( /* ... sem alterações ... */ 
  <Routes>
    <Route index element={<Navigate to="documents" replace />} />
    <Route path="documents" element={<DocumentListPage />} />
    <Route path="documents/:id" element={<DocumentViewPage />} />
    <Route path="students" element={<AdvisorStudentsPage />} />
  </Routes>
);

const AdminRoutes: React.FC = () => (
  <Routes>
    <Route index element={<AdminDashboard />} />
    <Route path="registrations" element={<AdminRegistrationListPage />} />
    <Route path="users" element={<AdminUserListPage />} /> {/* <-- ATUALIZAR A ROTA */}
    <Route path="settings" element={<div>Configurações (Placeholder)</div>} />
  </Routes>
);

const RoleBasedDashboard: React.FC = () => { /* ... sem alterações ... */ 
  const { isStudent, isAdvisor, isAdmin } = useAuthStore();
  if (isAdmin()) return <AdminDashboard />;
  if (isAdvisor()) return <AdvisorDashboard />;
  if (isStudent()) return <StudentDashboard />;
  return <Navigate to="/login" replace />;
};

export default App;