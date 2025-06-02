// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  EyeIcon, // Ícone para "Detalhes" ou "Gerenciar"
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import AdminRegistrationDetailModal from './AdminRegistrationDetailModal'; // <-- IMPORTAR O MODAL

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalAdvisors: number;
  pendingRegistrations: number;
}

interface UserSummary {
  id: number;
  name: string;
  email: string;
}
interface PendingRegistration { // Renomeado de RegistrationRequest para evitar conflito se importado de outro lugar
  id: number;
  user: UserSummary;
  institution: string;
  department: string;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Adicionado status para clareza, embora aqui sejam pendentes
  adminNotes?: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalAdvisors: 0,
    pendingRegistrations: 0,
  });
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  // Removido actionLoading, pois o modal terá seu próprio estado de processamento
  // const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({}); 

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<PendingRegistration | null>(null);


  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const statsResponse = await api.get<DashboardStats>('/admin/stats');
      setStats(statsResponse);

      const registrationsResponse = await api.get<{
        content: PendingRegistration[];
        totalElements: number;
      }>('/admin/registrations?page=0&size=3&sort=createdAt,asc'); // Mostrar apenas algumas (ex: 3)
      setPendingRegistrations(registrationsResponse.content);
      
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []); // useCallback sem dependências que mudam frequentemente aqui
  
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const openDetailModal = (request: PendingRegistration) => {
    setSelectedRequestForDetail(request);
    setIsDetailModalOpen(true);
  };

  const handleModalActionComplete = () => {
    loadDashboardData(); // Recarrega todos os dados do dashboard
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading && !stats.totalUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seção de Boas-vindas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Painel Administrativo
            </h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo, {user?.name}! Gerencie usuários, registros e monitore o sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Cartões de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ... Cartões de estatísticas permanecem os mesmos ... */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4"> <UsersIcon className="h-6 w-6" /> </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Total de Usuários</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4"> <AcademicCapIcon className="h-6 w-6" /> </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Estudantes</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4"> <DocumentTextIcon className="h-6 w-6" /> </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Orientadores</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalAdvisors}</div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4"> <ExclamationTriangleIcon className="h-6 w-6" /> </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Registros Pendentes</div>
              <div className="text-2xl font-bold text-gray-900">{stats.pendingRegistrations}</div>
            </div>
        </div>
      </div>

      {/* Seção de Solicitações de Registro Pendentes (Resumida) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Solicitações de Registro Pendentes</h2>
          {stats.pendingRegistrations > 0 && (
            <Link
              to="/admin/registrations"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver todas ({stats.pendingRegistrations})
            </Link>
          )}
        </div>

        {loading && pendingRegistrations.length === 0 && stats.pendingRegistrations > 0 ? ( // Mostrar se há pendentes mas ainda não carregou
             <div className="p-6 text-center text-gray-500">Carregando solicitações...</div>
        ) : !loading && pendingRegistrations.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma solicitação pendente</h3>
            <p className="mt-1 text-sm text-gray-500">
              Todas as novas solicitações de registro foram processadas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingRegistrations.map((registration) => (
              <div key={registration.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between">
                  <div className="mb-4 sm:mb-0 flex-grow">
                    <h3 className="text-sm font-medium text-gray-900">
                      {registration.user.name} <span className="text-xs text-gray-500">({registration.user.email})</span>
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {registration.institution} / {registration.department}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Solicitado em: {formatDate(registration.createdAt)}
                    </p>
                    <p className="mt-2 text-sm text-gray-600 max-w-md truncate" title={registration.justification}>
                      Justificativa: {registration.justification}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex space-x-2">
                    <button
                        onClick={() => openDetailModal(registration)}
                        className="btn btn-secondary btn-sm p-1.5"
                        title="Ver Detalhes e Gerenciar"
                    >
                        <EyeIcon className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Gerenciar</span>
                    </button>
                    {/* Botões diretos de Aprovar/Rejeitar removidos daqui para usar o modal */}
                  </div>
                </div>
              </div>
            ))}
            {stats.pendingRegistrations > pendingRegistrations.length && !loading && (
                 <div className="p-4 text-center border-t border-gray-200">
                    <Link to="/admin/registrations" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                        Ver mais {stats.pendingRegistrations - pendingRegistrations.length} solicitações pendentes...
                    </Link>
                 </div>
            )}
          </div>
        )}
      </div>

      {/* Ações Rápidas (Links para páginas de gerenciamento) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* ... Seção de Ações Rápidas permanece a mesma ... */}
        <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Ações Rápidas</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/admin/registrations" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <ClipboardDocumentListIcon className="h-8 w-8 text-orange-500 mr-4" />
              <div>
                <div className="font-medium text-gray-900">Gerenciar Registros</div>
                <div className="text-sm text-gray-500">{stats.pendingRegistrations} pendente(s)</div>
              </div>
            </Link>
            <Link to="/admin/users" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <UsersIcon className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <div className="font-medium text-gray-900">Gerenciar Usuários</div>
                <div className="text-sm text-gray-500">{stats.totalUsers} usuário(s) no total</div>
              </div>
            </Link>
            <Link to="/admin/settings" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Cog6ToothIcon className="h-8 w-8 text-purple-500 mr-4" />
              <div>
                <div className="font-medium text-gray-900">Configurações</div>
                <div className="text-sm text-gray-500">Configurações do sistema</div>
              </div>
            </Link>
        </div>
      </div>

      {/* Modal de Detalhes da Solicitação de Registro */}
      <AdminRegistrationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        request={selectedRequestForDetail} // Passa o tipo correto aqui
        onActionComplete={handleModalActionComplete}
      />
    </div>
  );
};

export default AdminDashboard;