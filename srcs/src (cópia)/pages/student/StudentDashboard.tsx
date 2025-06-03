// src/pages/student/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { documentsApi, Document } from '../../lib/api';
import { toast } from 'react-hot-toast';

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    revision: 0,
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.getAll(0, 10);
      setDocuments(response.content);
      
      // Calculate stats
      const newStats = response.content.reduce(
        (acc, doc) => {
          acc.total++;
          acc[doc.status.toLowerCase() as keyof typeof acc]++;
          return acc;
        },
        { total: 0, draft: 0, submitted: 0, approved: 0, revision: 0 }
      );
      setStats(newStats);
    } catch (error) {
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Rascunho', color: 'status-draft', icon: DocumentTextIcon };
      case 'SUBMITTED':
        return { label: 'Submetido', color: 'status-submitted', icon: ClockIcon };
      case 'REVISION':
        return { label: 'Em Revisão', color: 'status-revision', icon: ExclamationTriangleIcon };
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
              Bem-vindo, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie seus documentos acadêmicos de forma fácil e organizada.
            </p>
          </div>
          <div className="hidden sm:block">
            <Link
              to="/student/documents/new"
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Documento
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Rascunhos</div>
              <div className="text-2xl font-bold text-gray-900">{stats.draft}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Submetidos</div>
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Em Revisão</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.revision}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Aprovados</div>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Documentos Recentes</h2>
            <Link
              to="/student/documents"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver todos
            </Link>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="p-6 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum documento</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece criando seu primeiro documento acadêmico.
            </p>
            <div className="mt-6">
              <Link
                to="/student/documents/new"
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Criar Documento
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.slice(0, 5).map((document) => {
              const statusInfo = getStatusInfo(document.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={document.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <StatusIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <Link
                            to={`/student/documents/${document.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-primary-600"
                          >
                            {document.title}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1">
                            {document.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Orientador: {document.advisorName}</span>
                            <span>Atualizado: {formatDate(document.updatedAt)}</span>
                            <span>{document.versionCount} versão(ões)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={statusInfo.color}>
                        {statusInfo.label}
                      </span>
                      {document.status === 'DRAFT' && (
                        <Link
                          to={`/student/documents/${document.id}/edit`}
                          className="btn btn-secondary btn-sm"
                        >
                          Editar
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/student/documents/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <PlusIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Novo Documento</div>
              <div className="text-sm text-gray-500">Criar um novo documento</div>
            </div>
          </Link>

          <Link
            to="/student/documents?status=REVISION"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Revisões Pendentes</div>
              <div className="text-sm text-gray-500">Ver documentos em revisão</div>
            </div>
          </Link>

          <Link
            to="/notifications"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Notificações</div>
              <div className="text-sm text-gray-500">Ver atualizações</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;