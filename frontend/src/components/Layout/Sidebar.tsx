// src/components/Layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  // UserGroupIcon, // Não usado diretamente aqui
  BellIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ChartBarIcon, // Novo ícone para Métricas
  ShieldCheckIcon, // Novo ícone para Auditoria
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
          name: 'Métricas', // Novo item
          href: '/admin/metrics',
          icon: ChartBarIcon,
          current: location.pathname.startsWith('/admin/metrics'),
        },
        {
          name: 'Auditoria', // Placeholder
          href: '/admin/audit-logs',
          icon: ShieldCheckIcon,
          current: location.pathname.startsWith('/admin/audit-logs'),
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
          icon: AcademicCapIcon, // Pode ser UsersIcon ou AcademicCapIcon
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
          icon: DocumentTextIcon, // Poderia ser PlusCircleIcon ou similar
          current: location.pathname === '/student/documents/new',
        },
      ];
    }

    return baseItems;
  };

  const sharedItems = [
    // { // O NotificationCenter é aberto pelo Header, então o link aqui pode ser opcional
    //   name: 'Notificações',
    //   href: '/notifications', // Esta rota não está definida para uma página, mas para abrir o centro
    //   icon: BellIcon,
    //   current: location.pathname === '/notifications',
    // },
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
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpen(false)}> {/* z-30 para ficar abaixo do modal de notificação que é z-50 */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
            <Link to="/dashboard" className="flex items-center" onClick={() => setOpen(false)}>
              <div className="flex-shrink-0">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <AcademicCapIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Tessera</h1>
                <p className="text-xs text-gray-500">Acadêmica</p>
              </div>
            </Link>
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Fechar menu</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setOpen(false)}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  item.current ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {item.name}
              </Link>
            ))}
            
            {sharedItems.length > 0 && (
                 <div className="pt-4 mt-4 space-y-1 border-t border-gray-200">
                 {sharedItems.map((item) => (
                   <Link
                     key={item.name}
                     to={item.href}
                     className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                       item.current
                         ? 'bg-primary-100 text-primary-700'
                         : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                     }`}
                     onClick={() => setOpen(false)}
                   >
                     <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                       item.current ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                     }`} />
                     {item.name}
                   </Link>
                 ))}
               </div>
            )}
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
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