// src/components/Layout/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { useNotificationSummaryStore } from '../../store/notificationStore'; // Importar a store de resumo de notificações
import { toast } from 'react-hot-toast';

interface HeaderProps {
  onMenuClick: () => void;
  onNotificationBellClick: () => void; // Nova prop para lidar com o clique no sino
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onNotificationBellClick }) => {
  const { user, clearAuth } = useAuthStore();
  const { summary: notificationSummary } = useNotificationSummaryStore(); // Obter o resumo da store
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  const getRoleDisplayName = (roles: string[]) => {
    if (roles.includes('ROLE_ADMIN')) return 'Administrador';
    if (roles.includes('ROLE_ADVISOR')) return 'Orientador';
    if (roles.includes('ROLE_STUDENT')) return 'Estudante';
    return 'Usuário';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Menu button and title */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-label="Abrir menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="hidden md:block ml-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Tessera Acadêmica
              </h1>
            </div>
          </div>

          {/* Right side - Notifications and user menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              onClick={onNotificationBellClick} // Usar a nova prop
              className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Notificações"
            >
              <BellIcon className="h-6 w-6" />
              {(notificationSummary && notificationSummary.unreadCount > 0) && (
                <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
                  {notificationSummary.unreadCount > 9 ? '9+' : notificationSummary.unreadCount}
                  <span className="sr-only">{notificationSummary.unreadCount} novas notificações</span>
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Menu do usuário"
              >
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">
                    {user?.roles && getRoleDisplayName(user.roles)}
                  </div>
                </div>
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                          <div className="text-sm text-gray-500">{user?.email}</div>
                          <div className="text-xs text-gray-400">
                            {user?.roles && getRoleDisplayName(user.roles)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                      Meu Perfil
                    </Link>

                    <button // Alterado para botão para abrir a central de notificações
                      onClick={() => {
                        onNotificationBellClick(); // Reutilizar a função de abrir a central
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <BellIcon className="mr-3 h-5 w-5 text-gray-400" />
                      Notificações
                      {(notificationSummary && notificationSummary.unreadCount > 0) && (
                        <span className="ml-auto bg-red-100 text-red-600 text-xs rounded-full px-2 py-1">
                          {notificationSummary.unreadCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        toast.error('Modal de configurações ainda não implementado.');
                        // TODO: Abrir modal de configurações
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                      Configurações
                    </button>

                    <div className="border-t border-gray-100"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-400" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;