// File: srcs/src/App.tsx
import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PublicLayout from '@/components/layouts/PublicLayout'

// Pages - Auth
import LoginPage from '@/components/auth/LoginPage' // Caminho corrigido para o arquivo existente
import RegisterPage from '@/pages/auth/RegisterPage' // Mantido, pois RegisterPage.tsx foi gerado para esta pasta
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'

// Pages - Public
import LandingPage from '@/pages/public/LandingPage'
import AboutPage from '@/pages/public/AboutPage'
import ContactPage from '@/pages/public/ContactPage'

// Pages - Dashboard
import DashboardPage from '@/pages/dashboard/DashboardPage'
import DocumentsPage from '@/pages/documents/DocumentsPage'
import DocumentDetailsPage from '@/pages/documents/DocumentDetailsPage'
import DocumentEditorPage from '@/pages/documents/DocumentEditorPage'
import CollaboratorsPage from '@/pages/collaborators/CollaboratorsPage'
import VersionsPage from '@/pages/versions/VersionsPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'

// Pages - Admin
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import UsersManagementPage from '@/pages/admin/UsersManagementPage'
import RegistrationRequestsPage from '@/pages/admin/RegistrationRequestsPage'

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminRoute from '@/components/auth/AdminRoute'
import LoadingScreen from '@/components/ui/LoadingScreen'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

// Services
import { initializeWebSocket } from '@/services/websocket'

function App() {
  const { user, isLoading, checkAuth } = useAuthStore()
  const { connect: connectNotifications } = useNotificationStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (user) {
      initializeWebSocket()
      connectNotifications()
    }
  }, [user, connectNotifications])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <ErrorBoundary>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="sobre" element={<AboutPage />} />
          <Route path="contato" element={<ContactPage />} />
        </Route>

        {/* Rotas de Autenticação */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Rotas Protegidas - Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:id" element={<DocumentDetailsPage />} />
          <Route path="documents/:id/edit" element={<DocumentEditorPage />} />
          <Route path="documents/:id/collaborators" element={<CollaboratorsPage />} />
          <Route path="documents/:id/versions" element={<VersionsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Rotas de Administração */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <DashboardLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<UsersManagementPage />} />
          <Route path="registrations" element={<RegistrationRequestsPage />} />
        </Route>

        {/* Redirecionamentos */}
        <Route
          path="/app"
          element={<Navigate to="/dashboard" replace />}
        />
        
        {/* 404 - Rota não encontrada */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-secondary-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-secondary-900 mb-4">404</h1>
                <p className="text-xl text-secondary-600 mb-8">Página não encontrada</p>
                <button
                  onClick={() => window.history.back()}
                  className="btn-primary"
                >
                  Voltar
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </ErrorBoundary>
  )
}

export default App