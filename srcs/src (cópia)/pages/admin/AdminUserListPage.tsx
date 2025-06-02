// src/pages/admin/AdminUserListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PencilSquareIcon, // Para editar status
  EyeIcon, // Para visualizar detalhes (futuro)
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';

// Interfaces baseadas nas entidades User.java e Role.java
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
  approvedBy?: { id: number; name: string }; // Supondo que o backend pode enviar isso
  rejectionReason?: string;
  updatedAt: string;
}

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page number (0-indexed)
  size: number;
}

type UserStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const AdminUserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({}); // Para loading por linha
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('ALL');

  const fetchUsers = useCallback(async (page: number, status: UserStatusFilter) => {
    setLoading(true);
    try {
      let url = `/admin/users?page=${page}&size=${pageSize}&sort=registrationDate,desc`;
      if (status !== 'ALL') {
        url += `&status=${status}`;
      }
      const response = await api.get<Page<User>>(url);
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.number);
    } catch (error) {
      toast.error('Erro ao carregar lista de usuários.');
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchUsers(currentPage, statusFilter);
  }, [fetchUsers, currentPage, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchUsers(newPage, statusFilter);
    }
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentPage(0); // Resetar para a primeira página ao mudar o filtro
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
      reason = prompt(`Notas para APROVAÇÃO do usuário ${userId} (opcional):`) || "";
       // Se o usuário cancelar o prompt, reason será null. Se deixar em branco, será "".
      if (reason === null && newStatus === 'APPROVED') { // Se for aprovação e cancelou o prompt
        // Permite aprovar sem notas, não faz nada se cancelou.
        // Se desejar obrigar notas ou confirmação, ajuste aqui.
      } else {
        reason = reason || ""; // Garante que é string
      }
    }
    
    // Para PENDING, geralmente não se pede motivo, mas o DTO aceita.
    // Se for 'PENDING' e você quiser um motivo, adicione lógica de prompt aqui.

    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await api.put(`/admin/users/${userId}/status`, { status: newStatus, reason: reason });
      toast.success(`Status do usuário ${userId} atualizado para ${newStatus}!`);
      fetchUsers(currentPage, statusFilter); // Recarregar a lista
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Erro ao atualizar status do usuário ${userId}.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'APPROVED':
        return <span className="status-badge status-approved">Aprovado</span>;
      case 'PENDING':
        return <span className="status-badge status-submitted">Pendente</span>; // Usando cor de submetido para pendente
      case 'REJECTED':
        return <span className="status-badge status-revision">Rejeitado</span>; // Usando cor de revisão para rejeitado
      default:
        return <span className="status-badge status-draft">{status}</span>;
    }
  };
  
  const getRoleNames = (roles: Role[]): string => {
    return roles.map(role => role.name.replace('ROLE_', '')).join(', ') || 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <UsersIcon className="h-7 w-7 mr-2 text-primary-600" />
          Gerenciamento de Usuários
        </h1>
        <div className="mt-2 sm:mt-0">
          <label htmlFor="statusFilter" className="sr-only">Filtrar por status</label>
          <select
            id="statusFilter"
            name="statusFilter"
            className="input-field py-2 text-sm"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="ALL">Todos os Status</option>
            <option value="PENDING">Pendentes</option>
            <option value="APPROVED">Aprovados</option>
            <option value="REJECTED">Rejeitados</option>
          </select>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : !loading && users.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200">
          <UsersIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Nenhum usuário encontrado{statusFilter !== 'ALL' ? ` com o status "${statusFilter}"` : ''}.
          </h3>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Papéis (Roles)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Registro</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={`${actionLoading[user.id] ? 'opacity-50 animate-pulse' : ''}`}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getRoleNames(user.roles)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.registrationDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                        {user.status !== 'APPROVED' && (
                            <button onClick={() => handleUpdateStatus(user.id, 'APPROVED')} className="btn btn-success btn-sm p-1" title="Aprovar Usuário" disabled={actionLoading[user.id]}>
                                <CheckCircleIcon className="h-4 w-4"/>
                            </button>
                        )}
                        {user.status !== 'REJECTED' && (
                            <button onClick={() => handleUpdateStatus(user.id, 'REJECTED')} className="btn btn-danger btn-sm p-1" title="Rejeitar Usuário" disabled={actionLoading[user.id]}>
                                <XCircleIcon className="h-4 w-4"/>
                            </button>
                        )}
                        {user.status !== 'PENDING' && ( // Permitir reverter para pendente se necessário
                            <button onClick={() => handleUpdateStatus(user.id, 'PENDING')} className="btn btn-secondary btn-sm p-1" title="Marcar como Pendente" disabled={actionLoading[user.id]}>
                                <ClockIcon className="h-4 w-4"/>
                            </button>
                        )}
                        {/* <button className="btn btn-secondary btn-sm p-1" title="Editar (futuro)">
                            <PencilSquareIcon className="h-4 w-4"/>
                        </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && !loading && users.length > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm border border-gray-200">
          {/* Controles de Paginação ... */}
          <div className="flex-1 flex justify-between sm:hidden">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} className="btn btn-secondary">Anterior</button>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="btn btn-secondary">Próximo</button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{Math.min(currentPage * pageSize + 1, totalElements)}</span> a <span className="font-medium">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> de <span className="font-medium">{totalElements}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Próximo</button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserListPage;