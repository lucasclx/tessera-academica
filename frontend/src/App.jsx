import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './components/layout/MainLayout';
import { PrivateRoute, AdminRoute, AdvisorRoute, StudentRoute } from './components/common';

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

// Dashboard
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const PendingRegistrations = lazy(() => import('./pages/admin/PendingRegistrations'));
const RegistrationDetails = lazy(() => import('./pages/admin/RegistrationDetails'));

// Student Pages
const MyDocuments = lazy(() => import('./pages/student/MyDocuments'));
// const DocumentEditor = lazy(() => import('./pages/student/DocumentEditor')); // Comentado ou removido
const DocumentEditorWithCollaborators = lazy(() => import('./pages/student/DocumentEditorWithCollaborators')); // Importado
const DocumentCompare = lazy(() => import('./pages/student/DocumentCompare'));
const DocumentView = lazy(() => import('./pages/student/DocumentView')); // Adicionado para visualização, se necessário

// Advisor Pages
const MyStudents = lazy(() => import('./pages/advisor/MyStudents'));
const AdvisingDocuments = lazy(() => import('./pages/advisor/AdvisingDocuments'));
const DocumentReview = lazy(() => import('./pages/advisor/DocumentReview'));

// Notification Pages
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const NotificationSettings = lazy(() => import('./pages/settings/NotificationSettings'));

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ToastContainer 
            position="top-right"
            autoClose={3000} 
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            theme="light"
          />
          
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Rotas Privadas */}
            <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings/notifications" element={<NotificationSettings />} />

              {/* Admin */}
              <Route path="admin" element={<AdminRoute />}>
                <Route index element={<AdminDashboard />} />
                <Route path="registrations" element={<PendingRegistrations />} />
                <Route path="registrations/:id" element={<RegistrationDetails />} />
              </Route>

              {/* Student */}
              <Route path="student" element={<StudentRoute />}>
                <Route index element={<Navigate to="documents" replace />} />
                <Route path="documents" element={<MyDocuments />} />
                {/* Rotas de edição e visualização de documentos de estudante atualizadas */}
                <Route path="documents/new" element={<DocumentEditorWithCollaborators />} />
                <Route path="documents/:id" element={<DocumentEditorWithCollaborators />} />
                <Route path="documents/:id/view" element={<DocumentView />} /> {/* Rota para visualização dedicada, se necessário */}
                <Route path="documents/:id/compare" element={<DocumentCompare />} />
                <Route path="documents/:id/compare/:v1/:v2" element={<DocumentCompare />} />
              </Route>

              {/* Advisor */}
              <Route path="advisor" element={<AdvisorRoute />}>
                <Route index element={<Navigate to="documents" replace />} />
                <Route path="students" element={<MyStudents />} />
                <Route path="documents" element={<AdvisingDocuments />} />
                <Route path="documents/:id" element={<DocumentReview />} /> 
                <Route path="documents/:id/review" element={<DocumentReview />} />
              </Route>
            </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;