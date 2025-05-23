import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contextos
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

// Layouts
import MainLayout from './components/layout/MainLayout.jsx';

// Páginas de autenticação
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

// Páginas de administrador
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import PendingRegistrations from './pages/admin/PendingRegistrations.jsx';
import RegistrationDetails from './pages/admin/RegistrationDetails.jsx';

// Páginas de dashboard
import Dashboard from './pages/dashboard/Dashboard.jsx';

// Páginas de estudante
import MyDocuments from './pages/student/MyDocuments.jsx';
import DocumentEditor from './pages/student/DocumentEditor.jsx';
import DocumentCompare from './pages/student/DocumentCompare.jsx';

// Páginas de orientador
import MyStudents from './pages/advisor/MyStudents.jsx';
import AdvisingDocuments from './pages/advisor/AdvisingDocuments.jsx';
import DocumentReview from './pages/advisor/DocumentReview.jsx';

// CORREÇÃO: Importar do diretório correto
import NotificationsPage from './pages/notifications/NotificationsPage.jsx';
import NotificationSettings from './pages/settings/NotificationSettings.jsx';

// Componentes de proteção de rotas
import PrivateRoute from './components/common/PrivateRoute.jsx';
import AdminRoute from './components/common/AdminRoute.jsx';
import AdvisorRoute from './components/common/AdvisorRoute.jsx';
import StudentRoute from './components/common/StudentRoute.jsx';

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
          />
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Rotas privadas */}
            <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Rotas de Notificações */}
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings/notifications" element={<NotificationSettings />} />

              {/* Rotas de administrador */}
              <Route path="admin" element={<AdminRoute />}>
                <Route index element={<AdminDashboard />} />
                <Route path="registrations" element={<PendingRegistrations />} />
                <Route path="registrations/:id" element={<RegistrationDetails />} />
              </Route>

              {/* Rotas de estudante */}
              <Route path="student" element={<StudentRoute />}>
                <Route index element={<Navigate to="documents" replace />} />
                <Route path="documents" element={<MyDocuments />} />
                <Route path="documents/new" element={<DocumentEditor />} />
                <Route path="documents/:id" element={<DocumentEditor />} />
                <Route path="documents/:id/compare" element={<DocumentCompare />} />
                <Route path="documents/:id/compare/:v1/:v2" element={<DocumentCompare />} />
              </Route>

              {/* Rotas de orientador */}
              <Route path="advisor" element={<AdvisorRoute />}>
                <Route index element={<Navigate to="documents" replace />} />
                <Route path="students" element={<MyStudents />} />
                <Route path="documents" element={<AdvisingDocuments />} />
                <Route path="documents/:id" element={<DocumentReview />} />
                <Route path="documents/:id/review" element={<DocumentReview />} />
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