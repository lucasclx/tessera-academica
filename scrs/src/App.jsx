import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Imports que precisam carregar imediatamente (críticos)
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import PrivateRoute from './components/common/PrivateRoute.jsx';
import AdminRoute from './components/common/AdminRoute.jsx';
import AdvisorRoute from './components/common/AdvisorRoute.jsx';
import StudentRoute from './components/common/StudentRoute.jsx';

// Componente de Loading melhorado
import { CircularProgress, Box, Typography, Skeleton, Paper } from '@mui/material';

// Loading Fallback Components
const PageSkeleton = () => (
  <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
    {/* Header skeleton */}
    <Skeleton variant="text" width="40%" height={48} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 4 }} />
    
    {/* Content skeleton */}
    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
      <Skeleton variant="rectangular" width="100%" height={120} />
      <Skeleton variant="rectangular" width="100%" height={120} />
      <Skeleton variant="rectangular" width="100%" height={120} />
    </Box>
    
    {/* Table/List skeleton */}
    <Paper sx={{ p: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" />
          </Box>
          <Skeleton variant="rectangular" width={80} height={32} />
        </Box>
      ))}
    </Paper>
  </Box>
);

const LoadingFallback = ({ text = "Carregando..." }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh',
      gap: 2
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      {text}
    </Typography>
  </Box>
);

// =====================================================
// LAZY LOADING - Componentes que só carregam quando necessário
// =====================================================

// Páginas de autenticação (carregam só quando usuário não logado)
const Login = lazy(() => 
  import('./pages/auth/Login.jsx').then(module => {
    console.log('✅ Login carregado');
    return module;
  })
);

const Register = lazy(() => 
  import('./pages/auth/Register.jsx').then(module => {
    console.log('✅ Register carregado');
    return module;
  })
);

// Dashboard (carrega logo após login)
const Dashboard = lazy(() => 
  import('./pages/dashboard/Dashboard.jsx').then(module => {
    console.log('✅ Dashboard carregado');
    return module;
  })
);

// ======= ADMIN PAGES (só carrega se for admin) =======
const AdminDashboard = lazy(() => 
  import('./pages/admin/AdminDashboard.jsx').then(module => {
    console.log('✅ Admin Dashboard carregado');
    return module;
  })
);

const PendingRegistrations = lazy(() => 
  import('./pages/admin/PendingRegistrations.jsx').then(module => {
    console.log('✅ Pending Registrations carregado');
    return module;
  })
);

const RegistrationDetails = lazy(() => 
  import('./pages/admin/RegistrationDetails.jsx').then(module => {
    console.log('✅ Registration Details carregado');
    return module;
  })
);

// ======= STUDENT PAGES (só carrega se for estudante) =======
const MyDocuments = lazy(() => 
  import('./pages/student/MyDocuments.jsx').then(module => {
    console.log('✅ My Documents carregado');
    return module;
  })
);

const DocumentEditor = lazy(() => 
  import('./pages/student/DocumentEditor.jsx').then(module => {
    console.log('✅ Document Editor carregado');
    return module;
  })
);

const DocumentCompare = lazy(() => 
  import('./pages/student/DocumentCompare.jsx').then(module => {
    console.log('✅ Document Compare carregado');
    return module;
  })
);

// ======= ADVISOR PAGES (só carrega se for orientador) =======
const MyStudents = lazy(() => 
  import('./pages/advisor/MyStudents.jsx').then(module => {
    console.log('✅ My Students carregado');
    return module;
  })
);

const AdvisingDocuments = lazy(() => 
  import('./pages/advisor/AdvisingDocuments.jsx').then(module => {
    console.log('✅ Advising Documents carregado');
    return module;
  })
);

const DocumentReview = lazy(() => 
  import('./pages/advisor/DocumentReview.jsx').then(module => {
    console.log('✅ Document Review carregado');
    return module;
  })
);

// ======= NOTIFICATION PAGES (carrega sob demanda) =======
const NotificationsPage = lazy(() => 
  import('./pages/notifications/NotificationsPage.jsx').then(module => {
    console.log('✅ Notifications Page carregado');
    return module;
  })
);

const NotificationSettings = lazy(() => 
  import('./pages/settings/NotificationSettings.jsx').then(module => {
    console.log('✅ Notification Settings carregado');
    return module;
  })
);

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ToastContainer 
            position="top-right"
            autoClose={3000} 
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          
          <Routes>
            {/* ===== ROTAS PÚBLICAS ===== */}
            <Route 
              path="/login" 
              element={
                <Suspense fallback={<LoadingFallback text="Carregando página de login..." />}>
                  <Login />
                </Suspense>
              } 
            />
            <Route 
              path="/register" 
              element={
                <Suspense fallback={<LoadingFallback text="Carregando cadastro..." />}>
                  <Register />
                </Suspense>
              } 
            />

            {/* ===== ROTAS PRIVADAS ===== */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Dashboard principal */}
              <Route 
                path="dashboard" 
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <Dashboard />
                  </Suspense>
                } 
              />

              {/* ===== ROTAS DE NOTIFICAÇÕES ===== */}
              <Route 
                path="notifications" 
                element={
                  <Suspense fallback={<LoadingFallback text="Carregando notificações..." />}>
                    <NotificationsPage />
                  </Suspense>
                } 
              />
              <Route 
                path="settings/notifications" 
                element={
                  <Suspense fallback={<LoadingFallback text="Carregando configurações..." />}>
                    <NotificationSettings />
                  </Suspense>
                } 
              />

              {/* ===== ROTAS DE ADMINISTRADOR ===== */}
              <Route path="admin" element={<AdminRoute />}>
                <Route 
                  index 
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AdminDashboard />
                    </Suspense>
                  } 
                />
                <Route 
                  path="registrations" 
                  element={
                    <Suspense fallback={<LoadingFallback text="Carregando solicitações..." />}>
                      <PendingRegistrations />
                    </Suspense>
                  } 
                />
                <Route 
                  path="registrations/:id" 
                  element={
                    <Suspense fallback={<LoadingFallback text="Carregando detalhes..." />}>
                      <RegistrationDetails />
                    </Suspense>
                  } 
                />
              </Route>

              {/* ===== ROTAS DE ESTUDANTE ===== */}
              <Route path="student" element={<StudentRoute />}>
                <Route index element={<Navigate to="documents" replace />} />
                <Route 
                  path="documents" 
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <MyDocuments />
                    </Suspense>
                  } 
                />
                <Route 
                  path="documents/new" 
                  element={
                    <Suspense fallback={<LoadingFallback text="Carregando editor..." />}>
                      <DocumentEditor />
                    </Suspense>
                  } 
                />
                <Route 
                  path="documents/:id" 
                  element={
                    <Suspense fallback={<LoadingFallback text="Carregando documento..." />}>
                      <DocumentEditor />
                    </Suspense>
                  } 
                />
                <Route 
                  path="documents/:id/compare" 
                  element={
                    <Suspense fallback={<LoadingFallback text="Carregando comparação..." />}>
                      <DocumentCompare />
                    </Suspense>
                  } 
                />
                <Route 
                  path="documents/:id/compare/:v1/:v2" 
                  element={
                    <Suspense fallback={<LoadingFallback text="Carregando comparação..." />}>
                      <DocumentCompare />
                    </Suspense>
                  } 
                />
              </Route>

              {/* ===== ROTAS DE ORIENTADOR ===== */}
              <Route path="advisor" element={<AdvisorRoute />}>
                <Route index element={<Navigate to="documents" replace />} />
                <Route 
                  path="students" 
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <MyStudents />
                    </Suspense>
                  } 
                />
                <Route 
                  path="documents" 
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AdvisingDocuments />
                    </Suspense>
                  } 
                />
                <Route 
                  path="documents/:id" 
                  element={
                    <Suspense fallback={<LoadingFallback text="Carregando revisão..." />}>
                      <DocumentReview />
                    </Suspense>
                  } 
                />
                <Route 
                  path="documents/:id/review" 
                  element={
                    <Suspense fallback={<LoadingFallback text="Carregando revisão..." />}>
                      <DocumentReview />
                    </Suspense>
                  } 
                />
              </Route>
            </Route>

            {/* Rota para página não encontrada */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;