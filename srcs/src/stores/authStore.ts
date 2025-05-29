import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginRequest, RegisterRequest, LoginResponse } from '@/types'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>
  register: (data: RegisterRequest) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.login(credentials)
          const { user, token } = response
          
          set({ 
            user, 
            token, 
            isLoading: false,
            error: null 
          })
          
          // Armazenar token no localStorage para uso nas requisições
          localStorage.setItem('auth_token', token)
          
          toast.success(`Bem-vindo de volta, ${user.name}!`)
          return true
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Erro ao fazer login'
          set({ 
            isLoading: false, 
            error: errorMessage,
            user: null,
            token: null 
          })
          
          toast.error(errorMessage)
          return false
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          await authApi.register(data)
          
          set({ isLoading: false, error: null })
          
          toast.success(
            'Cadastro realizado com sucesso! Aguarde a aprovação do administrador.',
            { duration: 6000 }
          )
          return true
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Erro ao realizar cadastro'
          set({ 
            isLoading: false, 
            error: errorMessage 
          })
          
          toast.error(errorMessage)
          return false
        }
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          error: null,
          isLoading: false 
        })
        
        // Limpar token do localStorage
        localStorage.removeItem('auth_token')
        
        toast.success('Logout realizado com sucesso')
        
        // Redirecionar para página de login
        window.location.href = '/auth/login'
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          set({ user: null, token: null, isLoading: false })
          return
        }

        set({ isLoading: true })
        
        try {
          // Verificar se o token é válido fazendo uma requisição para o perfil
          const user = await authApi.getProfile()
          
          set({ 
            user, 
            token, 
            isLoading: false,
            error: null 
          })
          
        } catch (error) {
          // Token inválido ou expirado
          localStorage.removeItem('auth_token')
          set({ 
            user: null, 
            token: null, 
            isLoading: false,
            error: null 
          })
        }
      },

      clearError: () => set({ error: null }),

      updateUser: (updatedUser: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...updatedUser } 
          })
        }
      },
    }),
    {
      name: 'tessera-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
)

// Selectors para componentes
export const useAuth = () => {
  const { user, token, isLoading } = useAuthStore()
  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.roles?.some(role => role.name === 'ADMIN') || false,
    isAdvisor: user?.roles?.some(role => role.name === 'ADVISOR') || false,
    isStudent: user?.roles?.some(role => role.name === 'STUDENT') || false,
  }
}

// Hook para ações de autenticação
export const useAuthActions = () => {
  const { login, register, logout, checkAuth, clearError, updateUser } = useAuthStore()
  return {
    login,
    register,
    logout,
    checkAuth,
    clearError,
    updateUser,
  }
}