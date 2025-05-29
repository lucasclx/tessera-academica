// File: srcs/src/pages/auth/ForgotPasswordPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, SubmitHandler } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
// import { useAuthActions } from '@/stores/authStore'; // Você precisará de uma ação para isso

interface ForgotPasswordFormInput {
  email: string;
}

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  // const { forgotPassword } = useAuthActions(); // Descomente e implemente no authStore

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormInput>({
    defaultValues: {
      email: '',
    },
  })

  const onSubmit: SubmitHandler<ForgotPasswordFormInput> = async (data) => {
    setIsLoading(true)
    toast.loading('Enviando solicitação...')
    
    try {
      // TODO: Implementar a lógica de chamada à API para "esqueci minha senha"
      // Exemplo: const success = await forgotPassword(data.email);
      // if (success) {
      //   toast.dismiss();
      //   toast.success('Se um email correspondente for encontrado, um link para redefinição de senha será enviado.');
      //   reset();
      //   navigate('/auth/login');
      // } else {
      //   toast.dismiss();
      //   toast.error('Falha ao enviar solicitação. Tente novamente.');
      // }
      
      // Placeholder enquanto a lógica não está implementada:
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simula chamada de API
      toast.dismiss();
      toast.success('Se um email correspondente for encontrado, um link para redefinição de senha será enviado.');
      reset();
      // navigate('/auth/login'); // Pode redirecionar ou mostrar uma mensagem para verificar o email

    } catch (error) {
      toast.dismiss();
      toast.error('Ocorreu um erro. Tente novamente.');
      console.error('Erro ao solicitar redefinição de senha:', error)
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
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-secondary-900 mb-2">
          Esqueceu sua Senha?
        </h2>
        <p className="text-secondary-600">
          Sem problemas! Insira seu email abaixo e enviaremos um link para você cadastrar uma nova senha.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-secondary-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              type="email"
              className={`input pl-10 ${errors.email ? 'border-danger-500' : ''}`}
              placeholder="seu@email.com"
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido',
                },
              })}
            />
          </div>
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
              <span>Enviando...</span>
            </>
          ) : (
            <span>Enviar Link de Redefinição</span>
          )}
        </motion.button>
      </form>

      <div className="mt-6 text-center border-t border-secondary-200 pt-6">
        <Link
          to="/auth/login"
          className="inline-flex items-center space-x-2 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para o Login</span>
        </Link>
      </div>
    </motion.div>
  )
}

export default ForgotPasswordPage