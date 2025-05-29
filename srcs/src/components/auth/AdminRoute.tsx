import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/stores/authStore'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { Shield, ArrowLeft } from 'lucide-react'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return <LoadingScreen message="Verificando permissões de administrador..." />
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/auth/login" 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Verificar se o usuário é administrador
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-medium p-8">
            {/* Ícone de escudo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-warning-600" />
              </div>
            </div>

            {/* Título e mensagem */}
            <h1 className="text-2xl font-bold text-secondary-900 mb-4">
              Acesso Restrito
            </h1>
            
            <p className="text-secondary-600 mb-6">
              Esta área é restrita apenas para administradores do sistema.
            </p>

            <p className="text-sm text-secondary-500 mb-8">
              Usuário atual: <span className="font-medium">{user?.name}</span>
              <br />
              Roles: {user?.roles.map(role => role.name).join(', ')}
            </p>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.history.back()}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="btn-primary"
              >
                Ir para Dashboard
              </button>
            </div>

            {/* Informações de contato */}
            <div className="mt-8 pt-6 border-t border-secondary-200">
              <p className="text-xs text-secondary-500">
                Precisa de acesso de administrador?{' '}
                <a 
                  href="mailto:admin@tessera.com" 
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Entre em contato
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminRoute