import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contextos
import { AuthProvider } from './context/AuthContext.jsx';

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
import DocumentView from './pages/student/DocumentView.jsx';
import DocumentCompare from './pages/student/DocumentCompare.jsx';

// Páginas de orientador
import MyStudents from './pages/advisor/MyStudents.jsx';
import AdvisingDocuments from './pages/advisor/AdvisingDocuments.jsx';
import DocumentReview from './pages/advisor/DocumentReview.jsx';

// Componentes de proteção de rotas
import PrivateRoute from './components/common/PrivateRoute.jsx';
import AdminRoute from './components/common/AdminRoute.jsx';
import AdvisorRoute from './components/common/AdvisorRoute.jsx';
import StudentRoute from './components/common/StudentRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer autoClose={3000} hideProgressBar />
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rotas privadas */}
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

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
              <Route path="documents/:id" element={<DocumentView />} />
              <Route path="documents/:id/edit" element={<DocumentView edit={true} />} />
              <Route path="documents/:id/compare" element={<DocumentCompare />} />
            </Route>

            {/* Rotas de orientador */}
            <Route path="advisor" element={<AdvisorRoute />}>
              <Route index element={<Navigate to="documents" replace />} />
              <Route path="students" element={<MyStudents />} />
              <Route path="documents" element={<AdvisingDocuments />} />
              <Route path="documents/:id" element={<DocumentReview />} />
            </Route>
          </Route>

          {/* Rota para página não encontrada */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;