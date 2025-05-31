// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalAdvisors: number;
  pendingRegistrations: number;
}

interface PendingRegistration {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  institution: string;
  department: string;
  justification: string;
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsResponse = await api.get<DashboardStats>('/admin/stats');
      setStats(statsResponse);

      // Load pending registrations
      const registrationsResponse = await api.get<{
        content: PendingRegistration[];
        totalElements: number;
      }>('/admin/registrations?page=0&size=5');
      setPendingRegistrations(registrationsResponse.content);
      
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistration = async (id: number) => {
    try {
      await api.put(`/admin/registrations/${id}/approve`, {
        adminNotes: 'Aprovado pelo dashboard'
      });
      toast.success('Registro aprovado com sucesso');
      loadDashboardData(); // Reload data
    } catch (error) {
      toast.error('Erro ao aprovar registro');
    }
  };

  const handleRejectRegistration = async (id: number) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;

    try {
      await api.put(`/admin/registrations/${id}/reject`, {
        rejectionReason: reason
      });
      toast.success('Registro rejeitado');
      loadDashboardData(); // Reload data
    } catch (error) {
      toast.error('Erro ao rejeitar registro');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Painel Administrativo
            </h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo, {user?.name}! Gerencie usuários e monitore o sistema.
            </p>
          </div>
          <div className="hidden sm:block">
            <Link
              to="/admin/registrations"
              className="btn btn-primary"
            >
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              Gerenciar Registros
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total de Usuários</div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Estudantes</div>
              <div className="text-2xl font-bold text-green-600">{stats.totalStudents}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Orientadores</div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalAdvisors}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Registros Pendentes</div>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingRegistrations}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Registrations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Solicitações de Registro Pendentes</h2>
            <Link
              to="/admin/registrations"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver todas
            </Link>
          </div>
        </div>

        {pendingRegistrations.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma solicitação pendente</h3>
            <p className="mt-1 text-sm text-gray-500">
              Todas as solicitações de registro foram processadas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingRegistrations.map((registration) => (
              <div key={registration.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <UsersIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {registration.user.name}
                        </h3>
                        <p className="text-sm text-gray-500">{registration.user.email}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="font-medium">Instituição:</span>
                            <span className="ml-1">{registration.institution}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="font-medium">Departamento:</span>
                            <span className="ml-1">{registration.department}</span>
                          </div>
                          <div className="flex items-start text-xs text-gray-500">
                            <span className="font-medium">Justificativa:</span>
                            <span className="ml-1">{registration.justification}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="font-medium">Solicitado em:</span>
                            <span className="ml-1">{formatDate(registration.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleApproveRegistration(registration.id)}
                      className="btn btn-success btn-sm"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleRejectRegistration(registration.id)}
                      className="btn btn-danger btn-sm"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Visão Geral do Sistema</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Taxa de Aprovação</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.pendingRegistrations === 0 ? '100%' : 
                   `${Math.round((stats.totalUsers / (stats.totalUsers + stats.pendingRegistrations)) * 100)}%`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estudantes Ativos</span>
                <span className="text-sm font-medium text-gray-900">{stats.totalStudents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Orientadores Ativos</span>
                <span className="text-sm font-medium text-gray-900">{stats.totalAdvisors}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Relação Estudante/Orientador</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalAdvisors > 0 ? Math.round(stats.totalStudents / stats.totalAdvisors * 10) / 10 : 0}:1
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Ações Rápidas</h2>
          </div>
          <div className="p-6 space-y-4">
            <Link
              to="/admin/registrations"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ClipboardDocumentListIcon className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Gerenciar Registros</div>
                <div className="text-sm text-gray-500">{stats.pendingRegistrations} pendente(s)</div>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UsersIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Gerenciar Usuários</div>
                <div className="text-sm text-gray-500">{stats.totalUsers} usuário(s) total</div>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChartBarIcon className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Configurações</div>
                <div className="text-sm text-gray-500">Configurar sistema</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;