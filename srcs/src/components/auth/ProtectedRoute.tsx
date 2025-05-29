import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/stores/authStore'
import LoadingScreen from '@/components/ui/LoadingScreen'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

const ProtectedRoute = ({ children, requiredRoles = [] }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return <LoadingScreen message="Verificando autenticação..." />
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

  // Verificar se o usuário tem as roles necessárias
  if (requiredRoles.length > 0 && user) {
    const userRoles = user.roles.map(role => role.name)
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-secondary-900 mb-4">
              Acesso Negado
            </h1>
            <p className="text-secondary-600 mb-8">
              Você não tem permissão para acessar esta página.
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              Voltar
            </button>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

export default ProtectedRoute