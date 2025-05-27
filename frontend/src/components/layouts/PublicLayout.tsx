import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Menu, X, User, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/stores/authStore'

const PublicLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()

  const navigation = [
    { name: 'Início', href: '/', current: location.pathname === '/' },
    { name: 'Sobre', href: '/sobre', current: location.pathname === '/sobre' },
    { name: 'Contato', href: '/contato', current: location.pathname === '/contato' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200 sticky top-0 z-40">
        <nav className="container-app">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary-900">
                Tessera
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors ${
                    item.current
                      ? 'text-primary-600'
                      : 'text-secondary-600 hover:text-primary-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-secondary-600">
                    Olá, {user?.name}
                  </span>
                  <Link
                    to="/dashboard"
                    className="btn-primary flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/auth/login"
                    className="text-sm font-medium text-secondary-600 hover:text-primary-600 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/auth/register"
                    className="btn-primary flex items-center space-x-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Cadastrar</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-secondary-200 bg-white"
          >
            <div className="container-app py-4">
              {/* Navigation Links */}
              <div className="space-y-3 mb-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-secondary-600 hover:bg-secondary-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Auth Section */}
              <div className="border-t border-secondary-200 pt-4">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="px-3 py-2">
                      <p className="text-sm text-secondary-600">
                        Olá, {user?.name}
                      </p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full btn-primary text-center"
                    >
                      Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/auth/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full btn-ghost text-center"
                    >
                      Entrar
                    </Link>
                    <Link
                      to="/auth/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full btn-primary text-center"
                    >
                      Cadastrar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white">
        <div className="container-app py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Tessera Acadêmica</span>
              </div>
              <p className="text-secondary-300 max-w-md">
                Plataforma colaborativa para gestão de documentos acadêmicos com edição em tempo real e controle de versões.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-secondary-300">
                <li><Link to="/sobre" className="hover:text-white transition-colors">Sobre</Link></li>
                <li><Link to="/contato" className="hover:text-white transition-colors">Contato</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-secondary-300">
                <li><a href="mailto:suporte@tessera.com" className="hover:text-white transition-colors">suporte@tessera.com</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-secondary-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-400 text-sm">
              © 2024 Tessera Acadêmica. Todos os direitos reservados.
            </p>
            <p className="text-secondary-400 text-sm mt-4 md:mt-0">
              Versão 1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout