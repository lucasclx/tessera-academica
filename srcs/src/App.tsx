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

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Create a client
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
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard Routes */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <RoleBasedDashboard />
                }
              />

              {/* Student Routes */}
              <Route
                path="student/*"
                element={
                  <ProtectedRoute requiredRole="STUDENT">
                    <Routes>
                      <Route index element={<Navigate to="documents" replace />} />
                      <Route path="documents" element={<DocumentListPage />} />
                      <Route path="documents/:id" element={<DocumentViewPage />} />
                      <Route path="documents/:id/edit" element={<DocumentEditPage />} />
                      <Route path="documents/new" element={<DocumentEditPage />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Advisor Routes */}
              <Route
                path="advisor/*"
                element={
                  <ProtectedRoute requiredRole="ADVISOR">
                    <Routes>
                      <Route index element={<Navigate to="documents" replace />} />
                      <Route path="documents" element={<DocumentListPage />} />
                      <Route path="documents/:id" element={<DocumentViewPage />} />
                      <Route path="documents/:id/edit" element={<DocumentEditPage />} />
                      <Route path="students" element={<div>Meus Estudantes</div>} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="admin/*"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<div>Gerenciar Usuários</div>} />
                      <Route path="registrations" element={<div>Solicitações de Registro</div>} />
                      <Route path="settings" element={<div>Configurações</div>} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Shared Routes */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<div>Notificações</div>} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </div>
      </Router>
      
      {/* React Query Devtools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

// Component to render role-based dashboard
const RoleBasedDashboard: React.FC = () => {
  const { isStudent, isAdvisor, isAdmin } = useAuthStore();

  if (isAdmin()) {
    return <AdminDashboard />;
  } else if (isAdvisor()) {
    return <AdvisorDashboard />;
  } else if (isStudent()) {
    return <StudentDashboard />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default App;