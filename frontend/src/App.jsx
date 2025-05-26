import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './components/layout/MainLayout';
import { PrivateRoute, AdminRoute, AdvisorRoute, StudentRoute } from './components/common';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingRegistrations from './pages/admin/PendingRegistrations';
import RegistrationDetails from './pages/admin/RegistrationDetails';

// Student Pages
import MyDocuments from './pages/student/MyDocuments';
// import DocumentEditor from './pages/student/DocumentEditor'; // Comentado ou removido
import DocumentEditorWithCollaborators from './pages/student/DocumentEditorWithCollaborators'; // Importado
import DocumentCompare from './pages/student/DocumentCompare';
import DocumentView from './pages/student/DocumentView'; // Adicionado para visualização, se necessário

// Advisor Pages
import MyStudents from './pages/advisor/MyStudents';
import AdvisingDocuments from './pages/advisor/AdvisingDocuments';
import DocumentReview from './pages/advisor/DocumentReview';

// Notification Pages
import NotificationsPage from './pages/notifications/NotificationsPage';
import NotificationSettings from './pages/settings/NotificationSettings';

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
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;