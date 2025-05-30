// src/components/Layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BellIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const location = useLocation();
  const { isStudent, isAdvisor, isAdmin } = useAuthStore();

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
        current: location.pathname === '/dashboard',
      },
    ];

    if (isAdmin()) {
      return [
        ...baseItems,
        {
          name: 'Solicitações',
          href: '/admin/registrations',
          icon: ClipboardDocumentListIcon,
          current: location.pathname.startsWith('/admin/registrations'),
        },
        {
          name: 'Usuários',
          href: '/admin/users',
          icon: UsersIcon,
          current: location.pathname.startsWith('/admin/users'),
        },
        {
          name: 'Configurações',
          href: '/admin/settings',
          icon: Cog6ToothIcon,
          current: location.pathname.startsWith('/admin/settings'),
        },
      ];
    }

    if (isAdvisor()) {
      return [
        ...baseItems,
        {
          name: 'Documentos',
          href: '/advisor/documents',
          icon: DocumentTextIcon,
          current: location.pathname.startsWith('/advisor/documents'),
        },
        {
          name: 'Meus Estudantes',
          href: '/advisor/students',
          icon: AcademicCapIcon,
          current: location.pathname.startsWith('/advisor/students'),
        },
      ];
    }

    if (isStudent()) {
      return [
        ...baseItems,
        {
          name: 'Meus Documentos',
          href: '/student/documents',
          icon: DocumentTextIcon,
          current: location.pathname.startsWith('/student/documents'),
        },
        {
          name: 'Novo Documento',
          href: '/student/documents/new',
          icon: DocumentTextIcon,
          current: location.pathname === '/student/documents/new',
        },
      ];
    }

    return baseItems;
  };

  const sharedItems = [
    {
      name: 'Notificações',
      href: '/notifications',
      icon: BellIcon,
      current: location.pathname === '/notifications',
    },
    {
      name: 'Perfil',
      href: '/profile',
      icon: UserIcon,
      current: location.pathname === '/profile',
    },
  ];

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <AcademicCapIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Tessera</h1>
                <p className="text-xs text-gray-500">Acadêmica</p>
              </div>
            </div>
            <button
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    item.current
                      ? 'nav-link-active'
                      : 'nav-link-inactive'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Separator */}
            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="space-y-1">
                {sharedItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'nav-link-active'
                        : 'nav-link-inactive'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>Tessera Acadêmica v1.0</p>
              <p className="mt-1">Sistema de Gestão Acadêmica</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;