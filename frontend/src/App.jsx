import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contextos
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Páginas
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard'; // <-- Adicionado
import PendingRegistrations from './pages/admin/PendingRegistrations';
import RegistrationDetails from './pages/admin/RegistrationDetails';
import Dashboard from './pages/dashboard/Dashboard';
import MyStudents from './pages/advisor/MyStudents'; // <-- Adicionado

// Componentes de proteção de rotas
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import AdvisorRoute from './components/common/AdvisorRoute'; // <-- Adicionado

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
              <Route index element={<AdminDashboard />} /> {/* <-- Atualizado */}
              <Route path="registrations" element={<PendingRegistrations />} />
              <Route path="registrations/:id" element={<RegistrationDetails />} />
            </Route>

            {/* Rotas de Orientador (Advisor) */}
            <Route path="advisor" element={<AdvisorRoute />}> {/* <-- Adicionado */}
              <Route index element={<Navigate to="students" replace />} /> {/* Opcional: redireciona /advisor para /advisor/students */}
              <Route path="students" element={<MyStudents />} /> {/* <-- Adicionado */}
              {/* Outras futuras rotas de orientador podem ser adicionadas aqui */}
            </Route>

          </Route>

          {/* Rota para página não encontrada (melhorada para redirecionar para dashboard se logado, ou login se não) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;