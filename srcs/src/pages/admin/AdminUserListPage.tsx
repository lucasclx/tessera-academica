// Arquivo: srcs/src (cópia)/pages/admin/AdminUserListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { usePagination } from '../../hooks/usePagination';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { formatDateTime } from '../../utils/dateUtils';
import { formatRoleNames } from '../../utils/roleUtils';
import { api, Page, User as ApiUserType, Role as ApiRoleType } from '../../lib/api';

// Definindo tipos localmente ou importando de um arquivo de tipos compartilhado
interface Role extends ApiRoleType {}

interface User extends ApiUserType {
  // Se ApiUserType já for completo, não precisa adicionar campos.
  // Caso contrário, adicione campos específicos que AdminUserListPage espera.
  // roles: Role[]; // Certifique-se que 'roles' está corretamente tipado
}

type UserStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const AdminUserListPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('ALL');
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const { confirm } = useConfirmDialog();

  const fetchUsersCallback = useCallback(async (page: number, currentStatusFilter: UserStatusFilter): Promise<Page<User>> => {
    let url = `/admin/users?page=${page}&size=10&sort=registrationDate,desc`;
    if (currentStatusFilter && currentStatusFilter !== 'ALL') {
      url += `&status=${currentStatusFilter}`;
    }
    return api.get<Page<User>>(url);
  }, []);

  const {
    data: users,
    currentPage,
    totalPages,
    totalElements,
    loading,
    handlePageChange,
    fetchData: fetchDataFromHook,
    refresh,
  } = usePagination<User>(fetchUsersCallback);

  useEffect(() => {
    // Fetch inicial e quando o filtro de status mudar
    // fetchDataFromHook espera (page, ...args)
    fetchDataFromHook(0, statusFilter);
  }, [statusFilter, fetchDataFromHook]);

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as UserStatusFilter);
    // O useEffect acima tratará o refetch com o novo filtro, começando da página 0.
  };

  const handleUpdateStatus = async (userId: number, newStatus: User['status']) => {
    let reason = "";
    let proceed = false;

    if (newStatus === 'REJECTED') {
      reason = prompt(`Motivo para REJEITAR o usuário (ID: ${userId}) (obrigatório):`) || "";
      if (!reason.trim()) {
        toast.error("O motivo da rejeição é obrigatório.");
        return;
      }
      proceed = true;
    } else if (newStatus === 'APPROVED') {
      const confirmed = await confirm(`Confirma a APROVAÇÃO do usuário (ID: ${userId})?`);
      if (!confirmed) return;
      reason = prompt(`Notas para APROVAÇÃO do usuário (ID: ${userId}) (opcional):`) || "";
      proceed = true;
    } else if (newStatus === 'PENDING') {
      const confirmed = await confirm(`Tem certeza que deseja marcar o usuário (ID: ${userId}) como PENDENTE?`);
      if (!confirmed) return;
      proceed = true;
    }

    if (!proceed) return;

    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await api.put(`/admin/users/${userId}/status`, {
        status: newStatus,
        reason: reason,
      });
      toast.success(`Status do usuário ${userId} atualizado para ${newStatus}!`);
      refresh(); // Recarrega a página atual com os filtros atuais
    } catch (error: any) {
      // Erros de API são tratados pelo interceptor no api.tsx
      // Se precisar de lógica específica aqui, pode adicionar.
      console.error("Falha ao atualizar status:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (user: User) => <span className="text-sm text-gray-500">{user.id}</span>,
      className: 'w-16',
    },
    {
      key: 'user',
      header: 'Usuário',
      render: (user: User) => <UserInfo user={user} />,
    },
    {
      key: 'roles',
      header: 'Papéis',
      render: (user: User) => <span className="text-sm text-gray-500">{formatRoleNames(user.roles)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => <StatusBadge status={user.status} type="user" showIcon />,
    },
    {
      key: 'registrationDate',
      header: 'Data Registro',
      render: (user: User) => <span className="text-sm text-gray-500">{formatDateTime(user.registrationDate)}</span>,
    },
  ];

  const UserInfo: React.FC<{ user: User }> = ({ user }) => (
    <div className="flex items-center">
      <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3 flex-shrink-0" />
      <div>
        <div className="text-sm font-medium text-gray-900">{user.name}</div>
        <div className="text-xs text-gray-500">{user.email}</div>
      </div>
    </div>
  );

  const UserActions: React.FC<{
    user: User;
    onStatusUpdate: (userId: number, status: User['status']) => Promise<void>;
    loading: boolean;
  }> = ({ user, onStatusUpdate, loading: actionInProgress }) => (
    <div className="flex space-x-1">
      {user.status !== 'APPROVED' && (
        <button
          onClick={() => onStatusUpdate(user.id, 'APPROVED')}
          className="btn btn-success btn-sm p-1.5"
          title="Aprovar Usuário"
          disabled={actionInProgress}
        >
          <CheckCircleIcon className="h-4 w-4" />
        </button>
      )}
      {user.status !== 'REJECTED' && (
        <button
          onClick={() => onStatusUpdate(user.id, 'REJECTED')}
          className="btn btn-danger btn-sm p-1.5"
          title="Rejeitar Usuário"
          disabled={actionInProgress}
        >
          <XCircleIcon className="h-4 w-4" />
        </button>
      )}
      {user.status !== 'PENDING' && user.status !== 'APPROVED' && ( // Exemplo: só pode marcar como pendente se estiver rejeitado
        <button
          onClick={() => onStatusUpdate(user.id, 'PENDING')}
          className="btn btn-secondary btn-sm p-1.5"
          title="Marcar como Pendente"
          disabled={actionInProgress}
        >
          <ClockIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );

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
              disabled={loading}
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
        loading={loading && users.length === 0} // Mostrar loading apenas se não houver dados antigos
        emptyMessage={`Nenhum usuário encontrado${statusFilter !== 'ALL' ? ` com o status "${statusFilter}"` : ''}.`}
        emptyIcon={UsersIcon}
        actions={(user: User) => (
          <UserActions
            user={user}
            onStatusUpdate={handleUpdateStatus}
            loading={actionLoading[user.id] || false}
          />
        )}
      />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0 || loading}
              className="btn btn-secondary"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || loading}
              className="btn btn-secondary"
            >
              Próximo
            </button>
          </div>

          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{loading || users.length === 0 ? 0 : currentPage * 10 + 1}</span> a{' '}
                <span className="font-medium">{loading || users.length === 0 ? 0 : Math.min((currentPage + 1) * 10, totalElements)}</span> de{' '}
                <span className="font-medium">{totalElements}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0 || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = 0;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else {
                    // Garantir que a página atual esteja mais ou menos no meio, se possível
                    const startPage = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
                    pageNum = startPage + i;
                  }
                  if (pageNum >= totalPages) return null; // Não renderizar botões para páginas inexistentes

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                }).filter(Boolean)}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1 || loading}
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