import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Aqui você pode enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      // window.Sentry?.captureException(error, { extra: errorInfo })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-medium p-8 text-center">
            {/* Ícone de erro */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-danger-600" />
              </div>
            </div>

            {/* Título e mensagem */}
            <h1 className="text-2xl font-bold text-secondary-900 mb-4">
              Ops! Algo deu errado
            </h1>
            
            <p className="text-secondary-600 mb-8">
              Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
            </p>

            {/* Detalhes do erro em desenvolvimento */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-6 p-4 bg-secondary-50 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-secondary-700 mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="text-xs text-danger-600 whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ir para Início
              </button>
            </div>

            {/* Informações de contato */}
            <div className="mt-8 pt-6 border-t border-secondary-200">
              <p className="text-sm text-secondary-500">
                Se o problema persistir, entre em contato conosco em{' '}
                <a 
                  href="mailto:suporte@tessera.com" 
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  suporte@tessera.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary