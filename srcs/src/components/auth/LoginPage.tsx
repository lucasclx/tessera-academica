import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth, useAuthActions } from '@/stores/authStore'
import { LoginRequest } from '@/types'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { login, clearError } = useAuthActions()

  const from = location.state?.from?.pathname || '/dashboard'

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  // Limpar erros ao desmontar
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<LoginRequest>({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true)
    
    try {
      const success = await login(data)
      
      if (success) {
        // Pequeno delay para melhor UX
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 500)
      }
    } catch (error) {
      console.error('Erro no login:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const watchedEmail = watch('email')
  const watchedPassword = watch('password')
  const isFormValid = watchedEmail && watchedPassword

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-secondary-900 mb-2">
          Entrar na sua conta
        </h2>
        <p className="text-secondary-600">
          Acesse sua conta para continuar trabalhando em seus documentos
        </p>
      </div>

      {/* Demo Credentials Info */}
      <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <h3 className="text-sm font-medium text-primary-800 mb-2">
          Contas de demonstração:
        </h3>
        <div className="text-xs text-primary-700 space-y-1">
          <div><strong>Admin:</strong> admin@tessera.com / admin123</div>
          <div><strong>Orientador:</strong> orientador@tessera.com / senha123</div>
          <div><strong>Estudante:</strong> estudante@tessera.com / senha123</div>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="seu@email.com"
            {...register('email', {
              required: 'Email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido'
              }
            })}
          />
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-danger-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.email.message}
            </motion.p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter pelo menos 6 caracteres'
                }
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-secondary-400" />
              ) : (
                <Eye className="h-4 w-4 text-secondary-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-danger-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.password.message}
            </motion.p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <span className="ml-2 text-sm text-secondary-600">
              Lembrar de mim
            </span>
          </label>
          
          <Link
            to="/auth/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            Esqueceu a senha?
          </Link>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isFormValid && !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: isFormValid && !isLoading ? 0.98 : 1 }}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Entrando...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Register Link */}
      <div className="mt-8 text-center border-t border-secondary-200 pt-6">
        <p className="text-sm text-secondary-600">
          Não tem uma conta?{' '}
          <Link
            to="/auth/register"
            className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            Cadastre-se aqui
          </Link>
        </p>
      </div>

      {/* Help Section */}
      <div className="mt-6 text-center">
        <p className="text-xs text-secondary-500">
          Problemas para entrar?{' '}
          <a
            href="mailto:suporte@tessera.com"
            className="text-primary-600 hover:text-primary-500"
          >
            Entre em contato
          </a>
        </p>
      </div>
    </motion.div>
  )
}

export default LoginPage