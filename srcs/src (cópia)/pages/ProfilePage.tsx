// src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import {
  UserCircleIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  BellIcon,
  KeyIcon, 
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import ChangePasswordModal from '../components/Layout/ChangePasswordModal'; // <<< IMPORTAR O MODAL

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false); // <<< ESTADO PARA O MODAL

  const getRoleDisplayName = (roles: string[]) => {
    if (roles.includes('ROLE_ADMIN')) return 'Administrador';
    if (roles.includes('ROLE_ADVISOR')) return 'Orientador';
    if (roles.includes('ROLE_STUDENT')) return 'Estudante';
    return 'Usuário';
  };

  const getRoleColor = (roles: string[]) => {
    if (roles.includes('ROLE_ADMIN')) return 'bg-red-100 text-red-800';
    if (roles.includes('ROLE_ADVISOR')) return 'bg-blue-100 text-blue-800';
    if (roles.includes('ROLE_STUDENT')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: UserCircleIcon },
    { id: 'notifications', name: 'Notificações', icon: BellIcon },
    { id: 'security', name: 'Segurança', icon: ShieldCheckIcon },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <UserCircleIcon className="h-20 w-20 text-gray-400" />
          </div>
          <div className="ml-6">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.roles)}`}>
                {getRoleDisplayName(user.roles)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Perfil</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    <div className="flex items-center">
                      <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user.name}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Usuário
                    </label>
                    <div className="flex items-center">
                      <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.roles)}`}>
                        {getRoleDisplayName(user.roles)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status da Conta
                    </label>
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-600 font-medium">Ativa</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button className="btn btn-primary">
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  Editar Perfil
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Entre em contato com o administrador para alterar suas informações pessoais.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preferências de Notificação</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Notificações por Email</h4>
                      <p className="text-sm text-gray-500">Receber notificações importantes por email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Notificações do Navegador</h4>
                      <p className="text-sm text-gray-500">Receber notificações push no navegador</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Novos Comentários</h4>
                      <p className="text-sm text-gray-500">Notificar quando receberem novos comentários</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Atualizações de Status</h4>
                      <p className="text-sm text-gray-500">Notificar sobre mudanças de status dos documentos</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button className="btn btn-primary">
                  Salvar Preferências
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Segurança da Conta</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Alterar Senha</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Para sua segurança, escolha uma senha forte e única.
                    </p>
                    {/* >>> INÍCIO DA ALTERAÇÃO: Botão para abrir modal */}
                    <button 
                      onClick={() => setIsChangePasswordModalOpen(true)}
                      className="btn btn-secondary inline-flex items-center"
                    >
                      <KeyIcon className="h-5 w-5 mr-2" />
                      Alterar Senha
                    </button>
                    {/* <<< FIM DA ALTERAÇÃO */}
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Histórico de Login</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Monitore a atividade recente da sua conta.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">Último login:</span>
                        <span className="text-gray-500">Hoje às 14:30</span> {/* Dado de exemplo */}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Excluir Conta</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Esta ação é irreversível. Entre em contato com o administrador.
                    </p>
                    <button className="btn btn-danger">
                      Solicitar Exclusão
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Alteração de Senha */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;