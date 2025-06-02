// src/pages/DocumentViewPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { documentsApi, versionsApi, Document, Version } from '../lib/api';
import { toast } from 'react-hot-toast';

const DocumentViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isStudent, isAdvisor } = useAuthStore();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'versions' | 'comments'>('content');

  useEffect(() => {
    if (id) {
      loadDocument();
      loadVersions();
    }
  }, [id]);

  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]); // Select latest version
    }
  }, [versions, selectedVersion]);

  const loadDocument = async () => {
    try {
      const doc = await documentsApi.getById(Number(id));
      setDocument(doc);
    } catch (error) {
      toast.error('Erro ao carregar documento');
      navigate(-1);
    }
  };

  const loadVersions = async () => {
    try {
      setLoading(true);
      const versionsList = await versionsApi.getByDocument(Number(id));
      setVersions(versionsList);
    } catch (error) {
      toast.error('Erro ao carregar versões');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    if (!document) return;

    try {
      await documentsApi.changeStatus(document.id, newStatus, reason);
      toast.success('Status alterado com sucesso');
      loadDocument(); // Reload document
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleApprove = () => {
    handleStatusChange('APPROVED');
  };

  const handleRequestRevision = () => {
    const reason = prompt('Motivo da solicitação de revisão:');
    if (reason) {
      handleStatusChange('REVISION', reason);
    }
  };

  const handleSubmit = () => {
    if (window.confirm('Deseja submeter este documento para revisão?')) {
      handleStatusChange('SUBMITTED');
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
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEdit = () => {
    return isStudent() && document?.status === 'DRAFT';
  };

  const canSubmit = () => {
    return isStudent() && (document?.status === 'DRAFT' || document?.status === 'REVISION');
  };

  const canApprove = () => {
    return isAdvisor() && document?.status === 'SUBMITTED';
  };

  const canRequestRevision = () => {
    return isAdvisor() && document?.status === 'SUBMITTED';
  };

  if (loading || !document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(document.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span className={statusInfo.color}>
                <StatusIcon className="h-4 w-4 inline mr-1" />
                {statusInfo.label}
              </span>
              <span>
                <UserIcon className="h-4 w-4 inline mr-1" />
                {isStudent() ? `Orientador: ${document.advisorName}` : `Estudante: ${document.studentName}`}
              </span>
              <span>
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Atualizado: {formatDate(document.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {canEdit() && (
            <Link
              to={`/${isStudent() ? 'student' : 'advisor'}/documents/${document.id}/edit`}
              className="btn btn-secondary"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Editar
            </Link>
          )}

          {canSubmit() && (
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              Submeter
            </button>
          )}

          {canApprove() && (
            <button
              onClick={handleApprove}
              className="btn btn-success"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Aprovar
            </button>
          )}

          {canRequestRevision() && (
            <button
              onClick={handleRequestRevision}
              className="btn btn-danger"
            >
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Solicitar Revisão
            </button>
          )}
        </div>
      </div>

      {/* Document Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Documento</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Título</dt>
                <dd className="text-sm text-gray-900">{document.title}</dd>
              </div>
              {document.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                  <dd className="text-sm text-gray-900">{document.description}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className={`text-sm ${statusInfo.color}`}>{statusInfo.label}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Versões</dt>
                <dd className="text-sm text-gray-900">{document.versionCount}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Criado em</dt>
                <dd className="text-sm text-gray-900">{formatDate(document.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Última atualização</dt>
                <dd className="text-sm text-gray-900">{formatDate(document.updatedAt)}</dd>
              </div>
              {document.submittedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Submetido em</dt>
                  <dd className="text-sm text-gray-900">{formatDate(document.submittedAt)}</dd>
                </div>
              )}
              {document.approvedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Aprovado em</dt>
                  <dd className="text-sm text-green-600">{formatDate(document.approvedAt)}</dd>
                </div>
              )}
              {document.rejectedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Rejeitado em</dt>
                  <dd className="text-sm text-red-600">{formatDate(document.rejectedAt)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Rejection Reason */}
        {document.rejectionReason && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Motivo da Solicitação de Revisão:</h4>
              <p className="text-sm text-red-700">{document.rejectionReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`${
                activeTab === 'content'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              Conteúdo
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`${
                activeTab === 'versions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Versões ({versions.length})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`${
                activeTab === 'comments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-2" />
              Comentários
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'content' && (
            <div>
              {selectedVersion ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Versão {selectedVersion.versionNumber}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {selectedVersion.commitMessage && (
                        <span className="mr-4">"{selectedVersion.commitMessage}"</span>
                      )}
                      <span>Por {selectedVersion.createdByName} em {formatDate(selectedVersion.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma versão disponível</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este documento ainda não possui conteúdo.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'versions' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Histórico de Versões</h3>
              {versions.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma versão encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este documento ainda não possui versões.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedVersion(version);
                        setActiveTab('content');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-900">
                              Versão {version.versionNumber}
                              {index === 0 && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Atual
                                </span>
                              )}
                            </h4>
                          </div>
                          {version.commitMessage && (
                            <p className="text-sm text-gray-600 mt-1">"{version.commitMessage}"</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Por {version.createdByName}</span>
                            <span>{formatDate(version.createdAt)}</span>
                            <span>{version.commentCount} comentário(s)</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVersion(version);
                            setActiveTab('content');
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Comentários</h3>
              <div className="text-center py-12">
                <ChatBubbleLeftEllipsisIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sistema de comentários</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Funcionalidade de comentários será implementada em breve.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewPage;