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
  UserGroupIcon,
  ArrowsRightLeftIcon,
  InformationCircleIcon,
  Cog6ToothIcon, // <-- ÍCONE CORRIGIDO AQUI (era CogIcon)
  AcademicCapIcon, // Adicionado para exibição de orientador no cabeçalho
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { documentsApi, versionsApi, Document as BaseDocument, Version } from '../lib/api';
import { toast } from 'react-hot-toast';
import CommentThread from '../components/Comments/CommentThread';
import CollaboratorManager from '../components/Collaborators/CollaboratorManager';
import VersionDiff from '../components/Versions/VersionDiff';

interface DocumentDetail extends BaseDocument {
  canEdit?: boolean;
  canManageCollaborators?: boolean;
  canSubmitDocument?: boolean;
  canApproveDocument?: boolean;
  canAddMoreStudents?: boolean;
  canAddMoreAdvisors?: boolean;
  activeStudentCount?: number;
  activeAdvisorCount?: number;
  maxStudents?: number;
  maxAdvisors?: number;
  allowMultipleStudents?: boolean;
  allowMultipleAdvisors?: boolean;
  primaryStudentName?: string;
  primaryAdvisorName?: string;
  allStudentNames?: string;
  allAdvisorNames?: string;
}


const DocumentViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const documentIdNum = Number(id);
  const navigate = useNavigate();
  const { user, isStudent, isAdvisor, isAdmin } = useAuthStore();
  
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'versions' | 'comments' | 'collaborators' | 'diff'>('content');

  const [versionToCompare1, setVersionToCompare1] = useState<Version | null>(null);
  const [versionToCompare2, setVersionToCompare2] = useState<Version | null>(null);

  useEffect(() => {
    if (documentIdNum) {
      loadDocumentAndVersions();
    }
  }, [documentIdNum, user]);

  const loadDocumentAndVersions = async () => {
    setLoading(true);
    try {
      const doc = await documentsApi.getById(documentIdNum) as DocumentDetail; 
      
      if (doc) {
        if (typeof doc.canManageCollaborators === 'undefined' && user) {
          const isDocStudent = doc.studentId === user.id;
          const isDocAdvisor = doc.advisorId === user.id;
          doc.canManageCollaborators = isAdmin() || isDocStudent || isDocAdvisor;
        }
        doc.allStudentNames = doc.allStudentNames || doc.studentName;
        doc.allAdvisorNames = doc.allAdvisorNames || doc.advisorName;
        doc.activeStudentCount = doc.activeStudentCount ?? 1;
        doc.activeAdvisorCount = doc.activeAdvisorCount ?? 1;
        doc.allowMultipleStudents = doc.allowMultipleStudents ?? true;
        doc.maxStudents = doc.maxStudents ?? 5;
        doc.canEdit = doc.canEdit ?? (isStudent() && doc.status === 'DRAFT');
        doc.canSubmitDocument = doc.canSubmitDocument ?? (isStudent() && (doc.status === 'DRAFT' || doc.status === 'REVISION'));
        doc.canApproveDocument = doc.canApproveDocument ?? (isAdvisor() && doc.status === 'SUBMITTED');
      }
      setDocument(doc);

      const versionsList = await versionsApi.getByDocument(documentIdNum);
      setVersions(versionsList);
      if (versionsList.length > 0) {
        setSelectedVersion(versionsList[0]);
        if (versionsList.length >= 2) {
            setVersionToCompare1(versionsList[1]);
            setVersionToCompare2(versionsList[0]);
        } else if (versionsList.length === 1) {
            setVersionToCompare2(versionsList[0]);
        }
      } else {
        setSelectedVersion(null);
        setVersionToCompare1(null);
        setVersionToCompare2(null);
      }

    } catch (error) {
      toast.error('Erro ao carregar dados do documento');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    if (!document) return;
    try {
      await documentsApi.changeStatus(document.id, newStatus, reason);
      toast.success('Status alterado com sucesso');
      loadDocumentAndVersions(); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status');
    }
  };

  const handleApprove = () => handleStatusChange('APPROVED');
  const handleRequestRevision = () => {
    const reason = prompt('Motivo da solicitação de revisão (necessário):');
    if (reason && reason.trim() !== "") {
      handleStatusChange('REVISION', reason);
    } else if (reason !== null) {
        toast.error("O motivo da solicitação de revisão é obrigatório.");
    }
  };
  const handleSubmit = () => {
    if (window.confirm('Deseja submeter este documento para revisão?')) {
      handleStatusChange('SUBMITTED');
    }
  };

  const getStatusInfo = (status: string | undefined) => {
    if (!status) return { label: 'Desconhecido', color: 'status-draft', icon: DocumentTextIcon };
    switch (status) {
      case 'DRAFT': return { label: 'Rascunho', color: 'status-draft', icon: DocumentTextIcon };
      case 'SUBMITTED': return { label: 'Submetido', color: 'status-submitted', icon: ClockIcon };
      case 'REVISION': return { label: 'Em Revisão', color: 'status-revision', icon: ExclamationTriangleIcon };
      case 'APPROVED': return { label: 'Aprovado', color: 'status-approved', icon: CheckCircleIcon };
      case 'FINALIZED': return { label: 'Finalizado', color: 'status-finalized', icon: CheckCircleIcon };
      default: return { label: status, color: 'status-draft', icon: DocumentTextIcon };
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  
  const canEditDocument = () => document?.canEdit ?? (isStudent() && document?.status === 'DRAFT');
  const canSubmitDocument = () => document?.canSubmitDocument ?? (isStudent() && (document?.status === 'DRAFT' || document?.status === 'REVISION'));
  const canPerformAdvisorActions = () => document?.canApproveDocument ?? (isAdvisor() && document?.status === 'SUBMITTED');

  if (loading || !document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(document.status);
  const StatusIcon = statusInfo.icon;

  const TABS = [
    { id: 'content', name: 'Conteúdo', icon: EyeIcon, condition: true },
    { id: 'versions', name: 'Versões', count: versions.length, icon: DocumentTextIcon, condition: true },
    { id: 'diff', name: 'Comparar Versões', icon: ArrowsRightLeftIcon, condition: versions.length >= 1 },
    { id: 'comments', name: 'Comentários', icon: ChatBubbleLeftEllipsisIcon, condition: selectedVersion !== null },
    { id: 'collaborators', name: 'Colaboradores', icon: UserGroupIcon, condition: true },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
              <span className={statusInfo.color}>
                <StatusIcon className="h-4 w-4 inline mr-1" /> {statusInfo.label}
              </span>
              <span className="flex items-center">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Estudante(s): {document.allStudentNames || document.studentName}
              </span>
              <span className="flex items-center">
                <AcademicCapIcon className="h-4 w-4 inline mr-1 text-gray-400" />
                Orientador(es): {document.allAdvisorNames || document.advisorName}
              </span>
              <span className="flex items-center">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Atualizado: {formatDate(document.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canEditDocument() && (
            <Link to={`/${isStudent() ? 'student' : 'advisor'}/documents/${document.id}/edit`} className="btn btn-secondary">
              <PencilIcon className="h-5 w-5 mr-2" /> Editar
            </Link>
          )}
          {canSubmitDocument() && (
            <button onClick={handleSubmit} className="btn btn-primary">
              <ClockIcon className="h-5 w-5 mr-2" /> Submeter
            </button>
          )}
          {canPerformAdvisorActions() && (
            <>
              <button onClick={handleApprove} className="btn btn-success">
                <CheckCircleIcon className="h-5 w-5 mr-2" /> Aprovar
              </button>
              <button onClick={handleRequestRevision} className="btn btn-warning">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" /> Solicitar Revisão
              </button>
            </>
          )}
        </div>
      </div>

      {/* Document Info (Expandido) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-primary-600" />
                Informações Gerais
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Título</dt>
                  <dd className="text-gray-900">{document.title}</dd>
                </div>
                {document.description && (
                  <div>
                    <dt className="font-medium text-gray-500">Descrição</dt>
                    <dd className="text-gray-900 whitespace-pre-wrap">{document.description}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-gray-500">Status</dt>
                  <dd className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Total de Versões</dt>
                  <dd className="text-gray-900">{document.versionCount}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
                Histórico
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Criado em</dt>
                  <dd className="text-gray-900">{formatDate(document.createdAt)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Última atualização</dt>
                  <dd className="text-gray-900">{formatDate(document.updatedAt)}</dd>
                </div>
                {document.submittedAt && (
                  <div>
                    <dt className="font-medium text-gray-500">Submetido em</dt>
                    <dd className="text-gray-900">{formatDate(document.submittedAt)}</dd>
                  </div>
                )}
                {document.approvedAt && (
                  <div>
                    <dt className="font-medium text-gray-500">Aprovado em</dt>
                    <dd className="text-green-600 font-semibold">{formatDate(document.approvedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2 text-primary-600" />
                Equipe de Colaboração
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Estudante(s)</dt>
                  <dd className="text-gray-900">{document.allStudentNames || document.studentName || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Orientador(es)</dt>
                  <dd className="text-gray-900">{document.allAdvisorNames || document.advisorName || 'N/A'}</dd>
                </div>
                 {typeof document.activeStudentCount === 'number' &&
                    <div>
                        <dt className="font-medium text-gray-500">Total de Estudantes Ativos</dt>
                        <dd className="text-gray-900">{document.activeStudentCount}</dd>
                    </div>
                 }
                 {typeof document.activeAdvisorCount === 'number' &&
                    <div>
                        <dt className="font-medium text-gray-500">Total de Orientadores Ativos</dt>
                        <dd className="text-gray-900">{document.activeAdvisorCount}</dd>
                    </div>
                 }
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Cog6ToothIcon className="h-5 w-5 mr-2 text-primary-600" /> {/* ÍCONE CORRIGIDO */}
                Configurações de Colaboração
              </h3>
              <dl className="space-y-2 text-sm">
                {typeof document.allowMultipleStudents === 'boolean' &&
                    <div>
                        <dt className="font-medium text-gray-500">Permite múltiplos estudantes?</dt>
                        <dd className="text-gray-900">{document.allowMultipleStudents ? 'Sim' : 'Não'}</dd>
                    </div>
                }
                {typeof document.maxStudents === 'number' && document.allowMultipleStudents &&
                    <div>
                        <dt className="font-medium text-gray-500">Máximo de Estudantes</dt>
                        <dd className="text-gray-900">{document.maxStudents}</dd>
                    </div>
                }
              </dl>
            </div>
          </div>
        </div>

        {document.rejectionReason && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Motivo da Solicitação de Revisão (pelo orientador):</h4>
              <p className="text-sm text-yellow-700 whitespace-pre-wrap">{document.rejectionReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 px-6 overflow-x-auto custom-scrollbar">
            {TABS.filter(tab => tab.condition).map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center group`}
                >
                  <TabIcon className={`h-5 w-5 mr-2 ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {tab.name}
                  {typeof tab.count !== 'undefined' && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'}`}>
                        {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 min-h-[300px]">
          {activeTab === 'content' && (
            <div>
              {selectedVersion ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Versão {selectedVersion.versionNumber}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {selectedVersion.commitMessage && (
                        <span className="mr-4 italic">"{selectedVersion.commitMessage}"</span>
                      )}
                      <span>Por {selectedVersion.createdByName} em {formatDate(selectedVersion.createdAt)}</span>
                    </div>
                  </div>
                  <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none p-4 border rounded-md bg-gray-50 editor-readonly-content">
                    <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma versão disponível</h3>
                  <p className="mt-1 text-sm text-gray-500">Este documento ainda não possui conteúdo.</p>
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
                   <p className="mt-1 text-sm text-gray-500">Este documento ainda não possui versões.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id
                          ? 'border-primary-300 bg-primary-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => { setSelectedVersion(version); setActiveTab('content'); }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-900">Versão {version.versionNumber}</h4>
                            {index === 0 && (<span className="ml-2 status-badge bg-green-100 text-green-800">Atual</span>)}
                          </div>
                          {version.commitMessage && (<p className="text-sm text-gray-600 mt-1 italic">"{version.commitMessage}"</p>)}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Por {version.createdByName}</span>
                            <span>{formatDate(version.createdAt)}</span>
                            <span>{version.commentCount || 0} comentário(s)</span>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedVersion(version); setActiveTab('content');}} className="btn btn-secondary btn-sm">
                          <EyeIcon className="h-4 w-4 mr-1" /> Ver Conteúdo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'diff' && ( 
            <VersionDiff
                documentId={documentIdNum}
                version1Id={versionToCompare1?.id}
                version2Id={versionToCompare2?.id}
                onVersionSelect={(v1, v2) => { setVersionToCompare1(v1); setVersionToCompare2(v2); }}
            />
          )}
          {activeTab === 'comments' && selectedVersion && ( 
            <CommentThread versionId={selectedVersion.id} selectedPosition={undefined} />
          )}
          {activeTab === 'comments' && !selectedVersion && (
             <div className="text-center py-12">
                <ChatBubbleLeftEllipsisIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Selecione uma versão</h3>
                <p className="mt-1 text-sm text-gray-500">Para ver ou adicionar comentários, selecione uma versão na aba "Versões".</p>
              </div>
          )}
          {activeTab === 'collaborators' && ( 
            <CollaboratorManager 
              documentId={document.id}
              canManageCollaborators={document.canManageCollaborators ?? false} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewPage;