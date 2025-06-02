// src/pages/admin/AdminUserListPage.tsx - OTIMIZADO
import React, { useState } from 'react';
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';

// Componentes otimizados
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { usePagination } from '../../hooks/usePagination';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { formatDateTime } from '../../utils/dateUtils';
import { formatRoleNames } from '../../utils/roleUtils';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  roles: Role[];
  registrationDate: string;
  approvalDate?: string;
  approvedBy?: { id: number; name: string };
  rejectionReason?: string;
  updatedAt: string;
}

type UserStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

// Componente de Ações otimizado
const UserActions: React.FC<{
  user: User;
  onStatusUpdate: (userId: number, status: User['status']) => Promise<void>;
  loading: boolean;
}> = ({ user, onStatusUpdate, loading }) => (
  <div className="flex space-x-1">
    {user.status !== 'APPROVED' && (
      <button 
        onClick={() => onStatusUpdate(user.id, 'APPROVED')} 
        className="btn btn-success btn-sm p-1" 
        title="Aprovar Usuário" 
        disabled={loading}
      >
        <CheckCircleIcon className="h-4 w-4"/>
      </button>
    )}
    {user.status !== 'REJECTED' && (
      <button 
        onClick={() => onStatusUpdate(user.id, 'REJECTED')} 
        className="btn btn-danger btn-sm p-1" 
        title="Rejeitar Usuário" 
        disabled={loading}
      >
        <XCircleIcon className="h-4 w-4"/>
      </button>
    )}
    {user.status !== 'PENDING' && (
      <button 
        onClick={() => onStatusUpdate(user.id, 'PENDING')} 
        className="btn btn-secondary btn-sm p-1" 
        title="Marcar como Pendente" 
        disabled={loading}
      >
        <ClockIcon className="h-4 w-4"/>
      </button>
    )}
  </div>
);

// Componente de Informações do Usuário otimizado
const UserInfo: React.FC<{ user: User }> = ({ user }) => (
  <div className="flex items-center">
    <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" />
    <div>
      <div className="text-sm font-medium text-gray-900">{user.name}</div>
      <div className="text-xs text-gray-500">{user.email}</div>
    </div>
  </div>
);

const AdminUserListPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('ALL');
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const { confirm } = useConfirmDialog();

  // Hook de paginação otimizado
  const fetchUsers = async (page: number, status: UserStatusFilter) => {
    let url = `/admin/users?page=${page}&size=10&sort=registrationDate,desc`;
    if (status !== 'ALL') {
      url += `&status=${status}`;
    }
    return api.get(url);
  };

  const {
    data: users,
    currentPage,
    totalPages,
    totalElements,
    loading,
    handlePageChange,
    refresh
  } = usePagination<User>(
    (page: number) => fetchUsers(page, statusFilter),
    10
  );

  // Recarregar dados quando filtro muda
  React.useEffect(() => {
    refresh();
  }, [statusFilter, refresh]);

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as UserStatusFilter);
  };

  const handleUpdateStatus = async (userId: number, newStatus: User['status']) => {
    let reason = "";
    
    if (newStatus === 'REJECTED') {
      reason = prompt(`Motivo para REJEITAR o usuário ${userId} (obrigatório):`) || "";
      if (!reason.trim()) {
        toast.error("O motivo da rejeição é obrigatório.");
        return;
      }
    } else if (newStatus === 'APPROVED') {
      const confirmed = await confirm(`Confirma a APROVAÇÃO do usuário ${userId}?`);
      if (!confirmed) return;
      
      reason = prompt(`Notas para APROVAÇÃO do usuário ${userId} (opcional):`) || "";
    }
    
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      await api.put(`/admin/users/${userId}/status`, { 
        status: newStatus, 
        reason: reason 
      });
      
      toast.success(`Status do usuário ${userId} atualizado para ${newStatus}!`);
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Erro ao atualizar status do usuário ${userId}.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Configuração das colunas da tabela
  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (user: User) => (
        <span className="text-sm text-gray-500">{user.id}</span>
      ),
      className: 'w-16'
    },
    {
      key: 'user',
      header: 'Nome',
      render: (user: User) => <UserInfo user={user} />
    },
    {
      key: 'roles',
      header: 'Papéis (Roles)',
      render: (user: User) => (
        <span className="text-sm text-gray-500">{formatRoleNames(user.roles)}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => <StatusBadge status={user.status} type="user" />
    },
    {
      key: 'registrationDate',
      header: 'Data Registro',
      render: (user: User) => (
        <span className="text-sm text-gray-500">{formatDateTime(user.registrationDate)}</span>
      )
    }
  ];

  const filterOptions = [
    { value: 'ALL', label: 'Todos os Status' },
    { value: 'PENDING', label: 'Pendentes' },
    { value: 'APPROVED', label: 'Aprovados' },
    { value: 'REJECTED', label: 'Rejeitados' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Usuários"
        icon={UsersIcon}
        actions={
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {totalElements} usuário(s) encontrado(s)
            </span>
            <select
              id="statusFilter"
              name="statusFilter"
              className="input-field py-2 text-sm"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        emptyMessage={
          `Nenhum usuário encontrado${statusFilter !== 'ALL' ? ` com o status "${statusFilter}"` : ''}.`
        }
        emptyIcon={UsersIcon}
        actions={(user: User) => (
          <UserActions
            user={user}
            onStatusUpdate={handleUpdateStatus}
            loading={actionLoading[user.id] || false}
          />
        )}
      />

      {/* Paginação */}
      {totalPages > 1 && !loading && users.length > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 0} 
              className="btn btn-secondary"
            >
              Anterior
            </button>
            <button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage >= totalPages - 1} 
              className="btn btn-secondary"
            >
              Próximo
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{Math.min(currentPage * 10 + 1, totalElements)}</span> a{' '}
                <span className="font-medium">{Math.min((currentPage + 1) * 10, totalElements)}</span> de{' '}
                <span className="font-medium">{totalElements}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 0} 
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                
                {/* Números das páginas */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(0, Math.min(currentPage - 2 + i, totalPages - 1));
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage >= totalPages - 1} 
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Próximo
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserListPage;