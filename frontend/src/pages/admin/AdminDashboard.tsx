// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  UserPlusIcon,
  UserMinusIcon,
  PencilSquareIcon,
  EyeIcon, // Importado para detalhes, se necessário
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { adminApi, DashboardStats, RegistrationRequestItem, User as AdminUserType, ApiPage, UserStatusUpdatePayload } from '../../lib/api';
import { toast } from 'react-hot-toast';

// Componente de Paginação reutilizável
const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; loading: boolean }> = ({ currentPage, totalPages, onPageChange, loading }) => {
  if (totalPages <= 1) return null;
  
  const pageNumbers = [];
  // Lógica para mostrar um número limitado de páginas, ex: primeira, última, atuais e reticências
  const maxPagesToShow = 5;
  let startPage, endPage;
  if (totalPages <= maxPagesToShow) {
    startPage = 0;
    endPage = totalPages -1;
  } else {
    if (currentPage <= Math.floor(maxPagesToShow / 2) ) {
      startPage = 0;
      endPage = maxPagesToShow - 1;
    } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
      startPage = totalPages - maxPagesToShow;
      endPage = totalPages - 1;
    } else {
      startPage = currentPage - Math.floor(maxPagesToShow / 2);
      endPage = currentPage + Math.floor(maxPagesToShow / 2);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }


  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-4 py-3">
      <div className="flex-1 flex justify-between sm:justify-end items-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || loading}
          className="btn btn-secondary btn-sm"
        >
          Anterior
        </button>
        <div className="hidden sm:flex mx-2">
            {startPage > 0 && (
                 <>
                    <button onClick={() => onPageChange(0)} className="btn btn-secondary btn-sm mx-0.5">1</button>
                    {startPage > 1 && <span className="text-sm text-gray-500 p-2">...</span>}
                 </>
            )}
            {pageNumbers.map(number => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`btn btn-sm mx-0.5 ${currentPage === number ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={loading}
                >
                    {number + 1}
                </button>
            ))}
            {endPage < totalPages -1 && (
                <>
                    {endPage < totalPages - 2 && <span className="text-sm text-gray-500 p-2">...</span>}
                    <button onClick={() => onPageChange(totalPages - 1)} className="btn btn-secondary btn-sm mx-0.5">{totalPages}</button>
                </>
            )}
        </div>
         <span className="text-sm text-gray-700 mx-2 sm:hidden">
           Pág {currentPage + 1}/{totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || loading}
          className="btn btn-secondary btn-sm ml-3"
        >
          Próximo
        </button>
      </div>
    </nav>
  );
};


const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalAdvisors: 0,
    pendingRegistrations: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const [pendingRegistrations, setPendingRegistrations] = useState<RegistrationRequestItem[]>([]);
  const [pendingRegPage, setPendingRegPage] = useState(0);
  const [pendingRegTotalElements, setPendingRegTotalElements] = useState(0);
  const [pendingRegTotalPages, setPendingRegTotalPages] = useState(0);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);

  const [usersList, setUsersList] = useState<AdminUserType[]>([]);
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [userStatusFilter, setUserStatusFilter] = useState<string>("ALL");
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [isUserStatusModalOpen, setIsUserStatusModalOpen] = useState(false);
  const [selectedUserForStatusUpdate, setSelectedUserForStatusUpdate] = useState<AdminUserType | null>(null);
  const [newUserStatus, setNewUserStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('APPROVED');
  const [statusUpdateReason, setStatusUpdateReason] = useState('');

  const loadDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const statsResponse = await adminApi.getStats();
      setStats(statsResponse);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadPendingRegistrations = async (page: number) => {
    setLoadingRegistrations(true);
    try {
      const response = await adminApi.getPendingRegistrations(page, 5); // 5 por página
      setPendingRegistrations(response.content);
      setPendingRegTotalPages(response.totalPages);
      setPendingRegTotalElements(response.totalElements);
      // Atualiza a contagem de pendentes nas stats globais se for a primeira carga
      if (page === 0) {
         setStats(prev => ({ ...prev, pendingRegistrations: response.totalElements }));
      }
    } catch (error) {
      toast.error('Erro ao carregar registros pendentes');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const loadUsers = async (page: number, status?: string) => {
    setLoadingUsers(true);
    try {
      const currentStatus = status === "ALL" ? undefined : status;
      const response = await adminApi.getUsers(page, 10, currentStatus); // 10 por página
      setUsersList(response.content);
      setUsersTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
    loadPendingRegistrations(0);
    loadUsers(0, userStatusFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPendingRegistrations(pendingRegPage);
  }, [pendingRegPage]);

  useEffect(() => {
    setUsersPage(0); // Reset page when filter changes before loading
    loadUsers(0, userStatusFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userStatusFilter]);

  useEffect(() => {
    loadUsers(usersPage, userStatusFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[usersPage]);


  const handleApproveRegistration = async (id: number) => {
    const adminNotes = prompt("Adicionar observações para aprovação (opcional):");
    if (adminNotes === null) return; 

    try {
      await adminApi.approveRegistration(id, { adminNotes: adminNotes || undefined });
      toast.success('Registro aprovado com sucesso');
      loadPendingRegistrations(pendingRegPage);
      loadDashboardStats(); 
    } catch (error) { /* Erro já tratado pelo api.tsx */ }
  };

  const handleRejectRegistration = async (id: number) => {
    const rejectionReason = prompt('Motivo da rejeição (obrigatório):');
    if (!rejectionReason) {
      if(rejectionReason === "") toast.error("Motivo da rejeição é obrigatório.");
      return;
    }
    try {
      await adminApi.rejectRegistration(id, { rejectionReason });
      toast.success('Registro rejeitado com sucesso');
      loadPendingRegistrations(pendingRegPage);
      loadDashboardStats();
    } catch (error) { /* Erro já tratado pelo api.tsx */ }
  };

  const openUserStatusModal = (userToUpdate: AdminUserType) => {
    setSelectedUserForStatusUpdate(userToUpdate);
    setNewUserStatus(userToUpdate.status as 'PENDING' | 'APPROVED' | 'REJECTED');
    setStatusUpdateReason(userToUpdate.rejectionReason || '');
    setIsUserStatusModalOpen(true);
  };

  const handleConfirmUpdateUserStatus = async () => {
    if (!selectedUserForStatusUpdate) return;

    const payload: UserStatusUpdatePayload = {
      status: newUserStatus,
      reason: newUserStatus === 'REJECTED' ? statusUpdateReason : undefined,
    };
     if (newUserStatus === 'REJECTED' && !statusUpdateReason) {
        toast.error("A razão é obrigatória ao rejeitar/banir um usuário.");
        return;
    }

    try {
      await adminApi.updateUserStatus(selectedUserForStatusUpdate.id, payload);
      toast.success('Status do usuário atualizado!');
      setIsUserStatusModalOpen(false);
      setSelectedUserForStatusUpdate(null);
      loadUsers(usersPage, userStatusFilter);
      loadDashboardStats(); 
    } catch (error) { /* Erro já tratado pelo api.tsx */ }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 p-1"> {/* Reduzido padding para evitar scroll excessivo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-600 mt-1">Bem-vindo, {user?.name}! Gerencie usuários e monitore o sistema.</p>
      </div>

      {loadingStats ? <p className="text-center py-4">Carregando estatísticas...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"><div className="flex items-center"><div className="flex-shrink-0 bg-blue-100 p-3 rounded-full"><UsersIcon className="h-6 w-6 text-blue-500" /></div><div className="ml-3"><div className="text-xs font-medium text-gray-500">Total de Usuários</div><div className="text-xl font-bold text-blue-600">{stats.totalUsers}</div></div></div></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"><div className="flex items-center"><div className="flex-shrink-0 bg-green-100 p-3 rounded-full"><AcademicCapIcon className="h-6 w-6 text-green-500" /></div><div className="ml-3"><div className="text-xs font-medium text-gray-500">Estudantes</div><div className="text-xl font-bold text-green-600">{stats.totalStudents}</div></div></div></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"><div className="flex items-center"><div className="flex-shrink-0 bg-purple-100 p-3 rounded-full"><UsersIcon className="h-6 w-6 text-purple-500" /></div><div className="ml-3"><div className="text-xs font-medium text-gray-500">Orientadores</div><div className="text-xl font-bold text-purple-600">{stats.totalAdvisors}</div></div></div></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"><div className="flex items-center"><div className="flex-shrink-0 bg-orange-100 p-3 rounded-full"><ExclamationTriangleIcon className="h-6 w-6 text-orange-500" /></div><div className="ml-3"><div className="text-xs font-medium text-gray-500">Registros Pendentes</div><div className="text-xl font-bold text-orange-600">{pendingRegTotalElements}</div></div></div></div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-lg font-medium text-gray-900">Solicitações de Registro Pendentes</h2>
          {pendingRegTotalPages > 0 && <Link to="/admin/registrations" className="text-sm font-medium text-primary-600 hover:text-primary-500">Ver todas ({pendingRegTotalElements})</Link>}
        </div>
        {loadingRegistrations ? <div className="p-6 text-center">Carregando solicitações...</div> : pendingRegistrations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Nenhuma solicitação pendente.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Instituição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRegistrations.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{req.user.name} <span className="sm:hidden text-gray-500 text-xs block">{req.user.email}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{req.user.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{req.institution}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">{formatDate(req.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                      <button onClick={() => handleApproveRegistration(req.id)} className="btn btn-success btn-sm p-1.5"><UserPlusIcon className="h-4 w-4 sm:mr-1"/><span className="hidden sm:inline">Aprovar</span></button>
                      <button onClick={() => handleRejectRegistration(req.id)} className="btn btn-danger btn-sm p-1.5"><UserMinusIcon className="h-4 w-4 sm:mr-1"/><span className="hidden sm:inline">Rejeitar</span></button>
                      {/* <button title="Ver detalhes" className="btn btn-secondary btn-sm p-1.5"><EyeIcon className="h-4 w-4"/></button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination currentPage={pendingRegPage} totalPages={pendingRegTotalPages} onPageChange={setPendingRegPage} loading={loadingRegistrations} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-lg font-medium text-gray-900">Gerenciar Usuários</h2>
          <div className="flex items-center space-x-2">
             <label htmlFor="userStatusFilter" className="text-sm text-gray-500">Status:</label>
             <select id="userStatusFilter" value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} className="input-field py-1 px-2 text-sm !w-auto">
                <option value="ALL">Todos</option>
                <option value="PENDING">Pendentes</option>
                <option value="APPROVED">Aprovados</option>
                <option value="REJECTED">Rejeitados</option>
             </select>
             {/* <Link to="/admin/users" className="text-sm font-medium text-primary-600 hover:text-primary-500">Ver todos</Link> */}
          </div>
        </div>
        {loadingUsers ? <div className="p-6 text-center">Carregando usuários...</div> : usersList.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Nenhum usuário encontrado com este filtro.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Papéis</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{u.roles.join(', ').replace(/ROLE_/g, '')}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            u.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            u.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {u.status}
                        </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => openUserStatusModal(u)} className="btn btn-secondary btn-sm p-1.5"><PencilSquareIcon className="h-4 w-4 sm:mr-1"/><span className="hidden sm:inline">Alterar Status</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
             <Pagination currentPage={usersPage} totalPages={usersTotalPages} onPageChange={setUsersPage} loading={loadingUsers} />
          </div>
        )}
      </div>
      
      <Transition.Root show={isUserStatusModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsUserStatusModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Alterar Status: {selectedUserForStatusUpdate?.name}
                    </Dialog.Title>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="userStatus" className="block text-sm font-medium text-gray-700">Novo Status</label>
                        <select
                          id="userStatus"
                          value={newUserStatus}
                          onChange={(e) => setNewUserStatus(e.target.value as 'PENDING' | 'APPROVED' | 'REJECTED')}
                          className="input-field mt-1"
                        >
                          <option value="PENDING">Pendente</option>
                          <option value="APPROVED">Aprovado</option>
                          <option value="REJECTED">Rejeitado/Banido</option>
                        </select>
                      </div>
                      {newUserStatus === 'REJECTED' && (
                        <div>
                          <label htmlFor="statusReason" className="block text-sm font-medium text-gray-700">Motivo (obrigatório para rejeição)</label>
                          <textarea
                            id="statusReason"
                            rows={3}
                            value={statusUpdateReason}
                            onChange={(e) => setStatusUpdateReason(e.target.value)}
                            className="input-field mt-1"
                            placeholder="Descreva o motivo..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button type="button" className="btn btn-primary sm:ml-3 sm:w-auto" onClick={handleConfirmUpdateUserStatus}>Salvar</button>
                    <button type="button" className="btn btn-secondary mt-3 sm:mt-0 sm:w-auto" onClick={() => setIsUserStatusModalOpen(false)}>Cancelar</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default AdminDashboard;