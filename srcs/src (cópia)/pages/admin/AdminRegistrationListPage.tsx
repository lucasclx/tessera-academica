// src/pages/admin/AdminRegistrationListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import AdminRegistrationDetailModal from './AdminRegistrationDetailModal';
import AdminQuickRejectModal from './AdminQuickRejectModal'; // <-- IMPORTAR O NOVO MODAL

interface UserSummary {
  id: number;
  name: string;
  email: string;
}

interface RegistrationRequest {
  id: number;
  user: UserSummary;
  institution: string;
  department: string;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
}

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const AdminRegistrationListPage: React.FC = () => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<RegistrationRequest | null>(null);

  const [isQuickRejectModalOpen, setIsQuickRejectModalOpen] = useState(false); // Estado para o modal de rejeição rápida
  const [requestToQuickReject, setRequestToQuickReject] = useState<RegistrationRequest | null>(null); // Solicitação para o modal de rejeição rápida


  const fetchPendingRegistrations = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get<Page<RegistrationRequest>>(
        `/admin/registrations?page=${page}&size=${pageSize}&sort=createdAt,asc`
      );
      setRequests(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.number);
    } catch (error) {
      toast.error('Erro ao carregar solicitações de registro.');
      console.error("Erro ao buscar solicitações:", error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchPendingRegistrations(currentPage);
  }, [fetchPendingRegistrations, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchPendingRegistrations(newPage);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  
  const openDetailModal = (request: RegistrationRequest) => {
    setSelectedRequestForDetail(request);
    setIsDetailModalOpen(true);
  };

  const openQuickRejectModal = (request: RegistrationRequest) => {
    setRequestToQuickReject(request);
    setIsQuickRejectModalOpen(true);
  };

  const handleModalActionComplete = () => {
    fetchPendingRegistrations(currentPage); // Recarrega a lista
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <ClipboardDocumentListIcon className="h-7 w-7 mr-2 text-primary-600" />
          Solicitações de Registro
        </h1>
        <span className="text-sm text-gray-500">{totalElements} solicitações encontradas</span>
      </div>

      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : !loading && requests.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Nenhuma solicitação de registro.
          </h3>
           <p className="mt-1 text-sm text-gray-500">
            Parece que não há solicitações no momento.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instituição / Departamento</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Solicitação</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id} className={`${loading ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{req.user.name}</div>
                        <div className="text-xs text-gray-500">{req.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{req.institution}</div>
                    <div className="text-xs text-gray-500">{req.department}</div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${
                        req.status === 'PENDING' ? 'status-submitted' : 
                        req.status === 'APPROVED' ? 'status-approved' : 
                        req.status === 'REJECTED' ? 'status-revision' : 'status-draft'
                    }`}>
                        {req.status === 'PENDING' ? 'Pendente' : req.status === 'APPROVED' ? 'Aprovada' : 'Rejeitada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(req.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2"> {/* Adicionado space-x-2 para espaçamento */}
                        <button 
                            onClick={() => openDetailModal(req)}
                            className="btn btn-secondary btn-sm p-1.5" 
                            title="Ver Detalhes e Ações"
                            disabled={loading}
                        >
                        <EyeIcon className="h-4 w-4" />
                        </button>
                        {req.status === 'PENDING' && ( // Mostrar botão de rejeição rápida apenas para pendentes
                             <button
                                onClick={() => openQuickRejectModal(req)}
                                className="btn btn-danger btn-sm p-1.5"
                                title="Rejeitar Rapidamente"
                                disabled={loading}
                             >
                                <XCircleIcon className="h-4 w-4"/>
                             </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && !loading && requests.length > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm border border-gray-200">
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

      {/* Modal de Detalhes */}
      <AdminRegistrationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        request={selectedRequestForDetail}
        onActionComplete={handleModalActionComplete}
      />

      {/* Modal de Rejeição Rápida */}
      <AdminQuickRejectModal
        isOpen={isQuickRejectModalOpen}
        onClose={() => setIsQuickRejectModalOpen(false)}
        requestToReject={requestToQuickReject}
        onRejectionComplete={handleModalActionComplete}
      />
    </div>
  );
};

export default AdminRegistrationListPage;