// src/pages/DocumentListPage.tsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { documentsApi, Document } from '../lib/api';
import { toast } from 'react-hot-toast';

const DocumentListPage: React.FC = () => {
  const { isStudent, isAdvisor } = useAuthStore();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false); // Mudança: iniciar com false
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null); // Novo: estado de erro
  
  // Filter and search states
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Carregamento inicial
  useEffect(() => {
    loadDocuments();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (currentPage > 0) params.set('page', currentPage.toString());
    setSearchParams(params, { replace: true }); // Evita criar histórico excessivo
  }, [searchTerm, statusFilter, currentPage, setSearchParams]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null); // Limpar erro anterior

      // Escolher o endpoint correto baseado no papel do usuário
      let apiCall;
      if (isAdvisor()) {
        apiCall = () => documentsApi.getAdvisorDocuments(currentPage, 10, searchTerm, statusFilter);
      } else if (isStudent()) {
        apiCall = () => documentsApi.getMyDocuments(currentPage, 10, searchTerm, statusFilter);
      } else {
        // Fallback para administradores ou outros casos
        apiCall = () => documentsApi.getAll(currentPage, 10, searchTerm, statusFilter);
      }

      const response = await apiCall();
      
      setDocuments(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao carregar documentos';
      setError(errorMessage);
      
      // Mostrar toast apenas se não for um erro 401 (já tratado pelo interceptor)
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
      
      // Limpar dados em caso de erro
      setDocuments([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadDocuments();
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(0);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Rascunho', color: 'status-draft', icon: DocumentTextIcon };
      case 'SUBMITTED':
        return { 
          label: isAdvisor() ? 'Aguardando Revisão' : 'Submetido', 
          color: 'status-submitted', 
          icon: ClockIcon 
        };
      case 'REVISION':
        return { label: 'Em Revisão', color: 'status-revision', icon: ExclamationTriangleIcon };
      case 'REJECTED':
        return { label: 'Rejeitado', color: 'status-revision', icon: ExclamationTriangleIcon };
      case 'APPROVED':
        return { label: 'Aprovado', color: 'status-approved', icon: CheckCircleIcon };
      case 'FINALIZED':
        return { label: 'Finalizado', color: 'status-finalized', icon: CheckCircleIcon };
      default:
        return { label: status, color: 'status-draft', icon: DocumentTextIcon };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const canEditDocument = (document: Document) => {
    return isStudent() && document.status === 'DRAFT';
  };

  const statusOptions = [
    { value: 'ALL', label: 'Todos os Status' },
    { value: 'DRAFT', label: 'Rascunho' },
    { value: 'SUBMITTED', label: isAdvisor() ? 'Aguardando Revisão' : 'Submetido' },
    { value: 'REVISION', label: 'Em Revisão' },
    { value: 'REJECTED', label: 'Rejeitado' },
    { value: 'APPROVED', label: 'Aprovado' },
    { value: 'FINALIZED', label: 'Finalizado' },
  ];

  // Renderização de erro
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdvisor() ? 'Documentos dos Orientandos' : 'Meus Documentos'}
            </h1>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao Carregar Documentos</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDocuments}
            className="btn btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdvisor() ? 'Documentos dos Orientandos' : 'Meus Documentos'}
          </h1>
          <p className="text-gray-600 mt-1">
            {loading ? 'Carregando...' : `${totalElements} documento(s) encontrado(s)`}
          </p>
        </div>
        {isStudent() && (
          <div className="mt-4 sm:mt-0">
            <Link
              to="/student/documents/new"
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Documento
            </Link>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
                disabled={loading}
              />
            </div>
          </form>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary"
              disabled={loading}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filtros
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilter(option.value)}
                  disabled={loading}
                  className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                    statusFilter === option.value
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Carregando documentos...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum documento encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Tente ajustar os filtros de busca.'
                : isStudent()
                ? 'Comece criando seu primeiro documento.'
                : 'Nenhum documento foi encontrado para os orientandos.'}
            </p>
            {isStudent() && !searchTerm && statusFilter === 'ALL' && (
              <div className="mt-6">
                <Link
                  to="/student/documents/new"
                  className="btn btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Criar Primeiro Documento
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Documents Grid */}
            <div className="divide-y divide-gray-200">
              {documents.map((document) => {
                const statusInfo = getStatusInfo(document.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={document.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start">
                          <StatusIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <Link
                                to={`/${isStudent() ? 'student' : 'advisor'}/documents/${document.id}`}
                                className="text-lg font-medium text-gray-900 hover:text-primary-600"
                              >
                                {document.title}
                              </Link>
                              <span className={`ml-3 ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            
                            {document.description && (
                              <p className="text-gray-600 mt-2">{document.description}</p>
                            )}
                            
                            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                              {isAdvisor() && (
                                <span>Estudante: {document.studentName}</span>
                              )}
                              {isStudent() && (
                                <span>Orientador: {document.advisorName}</span>
                              )}
                              <span>Criado: {formatDate(document.createdAt)}</span>
                              <span>Atualizado: {formatDate(document.updatedAt)}</span>
                              <span>{document.versionCount} versão(ões)</span>
                            </div>

                            {/* Additional Status Info */}
                            {document.submittedAt && (
                              <div className="mt-2 text-sm text-gray-500">
                                Submetido em: {formatDate(document.submittedAt)}
                              </div>
                            )}
                            {document.approvedAt && (
                              <div className="mt-2 text-sm text-green-600">
                                Aprovado em: {formatDate(document.approvedAt)}
                              </div>
                            )}
                            {document.rejectedAt && document.rejectionReason && (
                              <div className="mt-2 text-sm text-red-600">
                                Rejeitado em: {formatDate(document.rejectedAt)} - {document.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          to={`/${isStudent() ? 'student' : 'advisor'}/documents/${document.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                        
                        {canEditDocument(document) && (
                          <Link
                            to={`/student/documents/${document.id}/edit`}
                            className="btn btn-primary btn-sm"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Editar
                          </Link>
                        )}

                        {isAdvisor() && document.status === 'SUBMITTED' && (
                          <Link
                            to={`/advisor/documents/${document.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Revisar
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Mostrando {currentPage * 10 + 1} a {Math.min((currentPage + 1) * 10, totalElements)} de {totalElements} resultados
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0 || loading}
                      className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(0, Math.min(currentPage - 2 + i, totalPages - 1));
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          disabled={loading}
                          className={`btn btn-sm ${
                            currentPage === page
                              ? 'btn-primary'
                              : 'btn-secondary'
                          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {page + 1}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= totalPages - 1 || loading}
                      className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentListPage;