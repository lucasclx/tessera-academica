// File: srcs/src/pages/auth/RegisterPage.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, SubmitHandler } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, AlertCircle, Briefcase, School, Building, BookText } from 'lucide-react'
import { useAuthActions } from '@/stores/authStore'
import { RegisterRequest } from '@/types'
import toast from 'react-hot-toast'

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { register: registerUser, clearError } = useAuthActions()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<RegisterRequest>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'STUDENT', // Default role
      institution: '',
      department: '',
      justification: '',
    },
  })

  const passwordValue = watch('password')

  // Limpar erros ao desmontar o componente
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const onSubmit: SubmitHandler<RegisterRequest> = async (data) => {
    setIsLoading(true)
    try {
      // Remover confirmPassword antes de enviar para a API, se existir no tipo de dados do formulário
      const { ...submissionData } = data
      // Se o tipo RegisterRequest não incluir confirmPassword, não é necessário o passo acima.
      // O UserRegistrationDTO no backend não tem confirmPassword.
      
      const success = await registerUser(submissionData)
      if (success) {
        reset() // Limpa o formulário
        // O toast de sucesso já é exibido pelo authStore
        // A navegação pode ser feita para a página de login ou uma página de "verifique seu email/aguarde aprovação"
        setTimeout(() => {
          navigate('/auth/login')
        }, 1000) // Pequeno delay para o usuário ler o toast
      }
    } catch (error) {
      // O toast de erro já é exibido pelo authStore
      console.error('Erro no registro:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
          Crie sua conta
        </h2>
        <p className="text-secondary-600">
          Junte-se à plataforma Tessera Acadêmica e simplifique seu trabalho.
        </p>
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-1">
            Nome Completo
          </label>
          <input
            id="name"
            type="text"
            className={`input ${errors.name ? 'border-danger-500' : ''}`}
            placeholder="Seu nome completo"
            {...register('name', {
              required: 'Nome é obrigatório',
              minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' },
            })}
          />
          {errors.name && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-danger-600 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.name.message}
            </motion.p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={`input ${errors.email ? 'border-danger-500' : ''}`}
            placeholder="seu@email.com"
            {...register('email', {
              required: 'Email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido',
              },
            })}
          />
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-danger-600 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.email.message}
            </motion.p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`input pr-10 ${errors.password ? 'border-danger-500' : ''}`}
              placeholder="••••••••"
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: { value: 6, message: 'Senha deve ter pelo menos 6 caracteres' },
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-500 hover:text-secondary-700"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-danger-600 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.password.message}
            </motion.p>
          )}
        </div>
        
        {/* Confirm Password Field - Opcional no DTO do backend, mas bom para UX */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-secondary-700 mb-1"
          >
            Confirmar Senha
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className={`input pr-10 ${errors.confirmPassword ? 'border-danger-500' : ''}`}
              placeholder="••••••••"
              {...register('confirmPassword' as any, { // Usar 'as any' se confirmPassword não estiver no tipo RegisterRequest
                required: 'Confirmação de senha é obrigatória',
                validate: (value) =>
                  value === passwordValue || 'As senhas não coincidem',
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-500 hover:text-secondary-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-danger-600 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.confirmPassword.message}
            </motion.p>
          )}
        </div>

        {/* Role Field */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-secondary-700 mb-1">
            Eu sou
          </label>
          <select
            id="role"
            className={`input ${errors.role ? 'border-danger-500' : ''}`}
            {...register('role', { required: 'Perfil é obrigatório' })}
          >
            <option value="STUDENT">Estudante</option>
            <option value="ADVISOR">Orientador(a)</option>
          </select>
          {errors.role && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-danger-600 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.role.message}
            </motion.p>
          )}
        </div>

        {/* Institution Field */}
        <div>
          <label htmlFor="institution" className="block text-sm font-medium text-secondary-700 mb-1">
            Instituição de Ensino
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="institution"
              type="text"
              className={`input pl-10 ${errors.institution ? 'border-danger-500' : ''}`}
              placeholder="Ex: Universidade Federal de..."
              {...register('institution', { required: 'Instituição é obrigatória' })}
            />
          </div>
          {errors.institution && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-danger-600 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.institution.message}
            </motion.p>
          )}
        </div>

        {/* Department Field */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-secondary-700 mb-1">
            Departamento/Curso
          </label>
          <div className="relative">
            <School className="w-4 h-4 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="department"
              type="text"
              className={`input pl-10 ${errors.department ? 'border-danger-500' : ''}`}
              placeholder="Ex: Departamento de Ciência da Computação"
              {...register('department', { required: 'Departamento/Curso é obrigatório' })}
            />
          </div>
          {errors.department && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-danger-600 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.department.message}
            </motion.p>
          )}
        </div>
        
        {/* Justification Field */}
        <div>
          <label htmlFor="justification" className="block text-sm font-medium text-secondary-700 mb-1">
            Justificativa para o Cadastro
          </label>
          <div className="relative">
             <BookText className="w-4 h-4 text-secondary-400 absolute left-3 top-3 pointer-events-none" />
            <textarea
              id="justification"
              rows={3}
              className={`input pl-10 ${errors.justification ? 'border-danger-500' : ''}`}
              placeholder="Descreva brevemente por que você precisa de acesso à plataforma."
              {...register('justification', { required: 'Justificativa é obrigatória' })}
            />
          </div>
          {errors.justification && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-danger-600 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.justification.message}
            </motion.p>
          )}
        </div>


        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
          whileHover={{ scale: !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: !isLoading ? 0.98 : 1 }}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Registrando...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center border-t border-secondary-200 pt-6">
        <p className="text-sm text-secondary-600">
          Já tem uma conta?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            Faça login aqui
          </Link>
        </p>
      </div>
    </motion.div>
  )
}

export default RegisterPage