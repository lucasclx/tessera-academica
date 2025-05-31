// src/pages/advisor/AdvisorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ChartBarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { documentsApi, Document } from '../../lib/api';
import { toast } from 'react-hot-toast';

const AdvisorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    revision: 0,
    approved: 0,
    students: 0,
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.getAdvisorDocuments(0, 10);
      setDocuments(response.content);
      
      // Calculate stats
      const uniqueStudents = new Set(response.content.map(doc => doc.studentId));
      const newStats = response.content.reduce(
        (acc, doc) => {
          acc.total++;
          if (doc.status === 'SUBMITTED') acc.submitted++;
          if (doc.status === 'REVISION') acc.revision++;
          if (doc.status === 'APPROVED' || doc.status === 'FINALIZED') acc.approved++;
          return acc;
        },
        { 
          total: 0, 
          submitted: 0, 
          revision: 0, 
          approved: 0, 
          students: uniqueStudents.size 
        }
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
        return { label: 'Aguardando Revisão', color: 'status-submitted', icon: ClockIcon };
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

  const getPriorityLevel = (document: Document) => {
    if (document.status === 'SUBMITTED') {
      const daysSinceSubmission = Math.floor(
        (Date.now() - new Date(document.submittedAt || document.updatedAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      if (daysSinceSubmission > 7) return 'high';
      if (daysSinceSubmission > 3) return 'medium';
    }
    return 'low';
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
              Bem-vindo, Prof. {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Acompanhe o progresso dos seus orientandos e gerencie as revisões de documentos.
            </p>
          </div>
          <div className="hidden sm:block">
            <Link
              to="/advisor/students"
              className="btn btn-primary"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Meus Estudantes
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Estudantes</div>
              <div className="text-2xl font-bold text-blue-600">{stats.students}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Documentos</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Aguardando</div>
              <div className="text-2xl font-bold text-orange-600">{stats.submitted}</div>
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

      {/* Documents Requiring Attention */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Documentos Necessitando Atenção</h2>
            <Link
              to="/advisor/documents?status=SUBMITTED"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver todos pendentes
            </Link>
          </div>
        </div>

        {documents.filter(doc => doc.status === 'SUBMITTED').length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tudo em dia!</h3>
            <p className="mt-1 text-sm text-gray-500">
              Não há documentos aguardando sua revisão no momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents
              .filter(doc => doc.status === 'SUBMITTED')
              .slice(0, 5)
              .map((document) => {
                const priority = getPriorityLevel(document);
                const priorityColors = {
                  high: 'border-l-red-500 bg-red-50',
                  medium: 'border-l-yellow-500 bg-yellow-50',
                  low: 'border-l-blue-500 bg-blue-50'
                };
                
                return (
                  <div key={document.id} className={`p-6 border-l-4 ${priorityColors[priority as keyof typeof priorityColors]}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start">
                          <ClockIcon className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />
                          <div>
                            <Link
                              to={`/advisor/documents/${document.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-primary-600"
                            >
                              {document.title}
                            </Link>
                            <p className="text-sm text-gray-500 mt-1">
                              {document.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Estudante: {document.studentName}</span>
                              <span>Submetido: {formatDate(document.submittedAt || document.updatedAt)}</span>
                              <span>{document.versionCount} versão(ões)</span>
                              {priority === 'high' && (
                                <span className="text-red-600 font-medium">• Urgente</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/advisor/documents/${document.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Revisar
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Reviewed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Revisados Recentemente</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {documents
              .filter(doc => doc.status === 'APPROVED' || doc.status === 'REVISION')
              .slice(0, 3)
              .map((document) => {
                const statusInfo = getStatusInfo(document.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={document.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center">
                      <StatusIcon className="h-4 w-4 text-gray-400 mr-3" />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/advisor/documents/${document.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
                        >
                          {document.title}
                        </Link>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">{document.studentName}</span>
                          <span className={`text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            {documents.filter(doc => doc.status === 'APPROVED' || doc.status === 'REVISION').length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                Nenhuma atividade recente
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Ações Rápidas</h2>
          </div>
          <div className="p-6 space-y-4">
            <Link
              to="/advisor/documents?status=SUBMITTED"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ClockIcon className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Revisar Documentos</div>
                <div className="text-sm text-gray-500">{stats.submitted} aguardando revisão</div>
              </div>
            </Link>

            <Link
              to="/advisor/students"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserGroupIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Meus Estudantes</div>
                <div className="text-sm text-gray-500">Gerenciar {stats.students} estudante(s)</div>
              </div>
            </Link>

            <Link
              to="/advisor/documents"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DocumentTextIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Todos os Documentos</div>
                <div className="text-sm text-gray-500">Ver histórico completo</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorDashboard;