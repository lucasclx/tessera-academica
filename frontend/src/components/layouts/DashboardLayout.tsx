import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Menu,
  X,
  Home,
  FileText,
  Users,
  Bell,
  Settings,
  User,
  LogOut,
  Shield,
  UserCheck,
  GitBranch,
  MessageSquare
} from 'lucide-react'
import { useAuth, useAuthActions } from '@/stores/authStore'
import { useNotifications, useNotificationActions } from '@/stores/notificationStore'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAdmin, isAdvisor, isStudent } = useAuth()
  const { logout } = useAuthActions()
  const { unreadCount } = useNotifications()
  const { loadSummary } = useNotificationActions()

  // Carregar resumo de notificações ao montar
  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  // Fechar menus ao mudar de rota
  useEffect(() => {
    setSidebarOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: location.pathname === '/dashboard' },
    { name: 'Documentos', href: '/dashboard/documents', icon: FileText, current: location.pathname.startsWith('/dashboard/documents') },
    ...(isAdvisor ? [
      { name: 'Meus Orientandos', href: '/dashboard/students', icon: Users, current: location.pathname.startsWith('/dashboard/students') }
    ] : []),
    { name: 'Notificações', href: '/dashboard/notifications', icon: Bell, current: location.pathname === '/dashboard/notifications', badge: unreadCount > 0 ? unreadCount : undefined },
  ]

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: Shield, current: location.pathname === '/admin' },
    { name: 'Usuários', href: '/admin/users', icon: Users, current: location.pathname.startsWith('/admin/users') },
    { name: 'Solicitações', href: '/admin/registrations', icon: UserCheck, current: location.pathname.startsWith('/admin/registrations') },
  ]

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <div className={`${mobile ? 'w-full' : 'w-64'} h-full bg-white border-r border-secondary-200 flex flex-col`}>
      {/* Logo */}
      <div className="flex items-center space-x-3 px-6 py-4 border-b border-secondary-200">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-secondary-900">Tessera</h1>
          <p className="text-xs text-secondary-500">Acadêmica</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                item.current
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                  : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  item.current ? 'text-primary-500' : 'text-secondary-400 group-hover:text-secondary-500'
                }`}
              />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-danger-100 text-danger-800 rounded-full">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="pt-6">
            <h3 className="px-3 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">
              Administração
            </h3>
            <div className="space-y-1">
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    item.current
                      ? 'bg-warning-50 text-warning-700 border-r-2 border-warning-500'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      item.current ? 'text-warning-500' : 'text-secondary-400 group-hover:text-secondary-500'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-secondary-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-secondary-500 truncate">
              {user?.roles?.map(role => role.name).join(', ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex bg-secondary-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="absolute inset-0 bg-secondary-600 opacity-75" />
            </motion.div>

            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 flex w-64 z-50 lg:hidden"
            >
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-secondary-200 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title - Hidden on mobile */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-secondary-900">
                {navigation.find(item => item.current)?.name || 
                 adminNavigation.find(item => item.current)?.name || 
                 'Dashboard'}
              </h1>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications Bell */}
              <Link
                to="/dashboard/notifications"
                className="relative p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-secondary-900">
                      {user?.name}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {user?.roles?.map(role => role.name).join(', ')}
                    </p>
                  </div>
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-medium border border-secondary-200 py-2 z-50"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-secondary-200">
                        <p className="text-sm font-medium text-secondary-900">
                          {user?.name}
                        </p>
                        <p className="text-sm text-secondary-500">
                          {user?.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Meu Perfil
                        </Link>

                        <Link
                          to="/dashboard/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Configurações
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                          >
                            <Shield className="w-4 h-4 mr-3" />
                            Painel Admin
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-secondary-200 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sair
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-secondary-50">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Click outside handler for user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  )
}

export default DashboardLayout