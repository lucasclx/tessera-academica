// src/pages/DocumentViewPage.tsx - OTIMIZADO
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { documentsApi, versionsApi, DocumentDetailDTO as ApiDocumentDetailDTO } from '../lib/api';
import { toast } from 'react-hot-toast';

// Componentes otimizados
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useApiData } from '../hooks/useApiData';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { getDocumentStatusInfo } from '../utils/statusUtils';
import { canEditDocument, canSubmitDocument, canPerformAdvisorActions } from '../utils/documentUtils';

// Lazy load dos componentes das abas
const CommentThread = React.lazy(() => import('../components/Comments/CommentThread'));
const CollaboratorManager = React.lazy(() => import('../components/Collaborators/CollaboratorManager'));
const VersionDiff = React.lazy(() => import('../components/Versions/VersionDiff'));

interface DocumentDetail extends ApiDocumentDetailDTO {}

// Componente de Tab otimizado
const TabButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
  disabled?: boolean;
}> = ({ isActive, onClick, icon: Icon, label, count, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${
      isActive
        ? 'border-primary-500 text-primary-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center group`}
  >
    <Icon className={`h-5 w-5 mr-2 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
    {label}
    {typeof count !== 'undefined' && (
      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
        isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// Componente de Informações do Documento otimizado
const DocumentInfo: React.FC<{ document: DocumentDetail }> = ({ document }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      <InfoSection 
        title="Informações Gerais" 
        icon={InformationCircleIcon}
        items={[
          { label: 'Título', value: document.title },
          { label: 'Descrição', value: document.description || 'N/A' },
          { label: 'Status', value: <StatusBadge status={document.status} showIcon /> },
          { label: 'Total de Versões', value: document.versionCount },
        ]}
      />
      
      <InfoSection 
        title="Histórico" 
        icon={ClockIcon}
        items={[
          { label: 'Criado em', value: formatDateTime(document.createdAt) },
          { label: 'Última atualização', value: formatDateTime(document.updatedAt) },
          { label: 'Submetido em', value: document.submittedAt ? formatDateTime(document.submittedAt) : 'N/A' },
          { label: 'Aprovado em', value: document.approvedAt ? formatDateTime(document.approvedAt) : 'N/A' },
        ]}
      />

      <InfoSection 
        title="Equipe de Colaboração" 
        icon={UserGroupIcon}
        items={[
          { label: 'Estudante(s)', value: document.allStudentNames || 'N/A' },
          { label: 'Orientador(es)', value: document.allAdvisorNames || 'N/A' },
          { label: 'Total de Estudantes Ativos', value: document.activeStudentCount || 0 },
          { label: 'Total de Orientadores Ativos', value: document.activeAdvisorCount || 0 },
        ]}
      />

      <InfoSection 
        title="Configurações de Colaboração" 
        icon={Cog6ToothIcon}
        items={[
          { label: 'Permite múltiplos estudantes?', value: document.allowMultipleStudents ? 'Sim' : 'Não' },
          { label: 'Máximo de Estudantes', value: document.maxStudents || 'N/A' },
          { label: 'Permite múltiplos orientadores?', value: document.allowMultipleAdvisors ? 'Sim' : 'Não' },
          { label: 'Máximo de Orientadores', value: document.maxAdvisors || 'N/A' },
        ]}
      />
    </div>

    {document.rejectionReason && (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Motivo da Solicitação de Revisão:</h4>
          <p className="text-sm text-yellow-700 whitespace-pre-wrap">{document.rejectionReason}</p>
        </div>
      </div>
    )}
  </div>
);

// Componente de Seção de Informações
const InfoSection: React.FC<{
  title: string;
  icon: React.ElementType;
  items: { label: string; value: any }[];
}> = ({ title, icon: Icon, items }) => (
  <div className="space-y-3">
    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
      <Icon className="h-5 w-5 mr-2 text-primary-600" />
      {title}
    </h3>
    <dl className="space-y-2 text-sm">
      {items.map((item, index) => (
        <div key={index}>
          <dt className="font-medium text-gray-500">{item.label}</dt>
          <dd className="text-gray-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

// Componente de Actions otimizado
const DocumentActions: React.FC<{
  document: DocumentDetail;
  onStatusChange: (status: string, reason?: string) => void;
}> = ({ document, onStatusChange }) => {
  const { isStudent, isAdvisor } = useAuthStore();
  
  const canEdit = canEditDocument(document, isStudent());
  const canSubmit = canSubmitDocument(document, isStudent());
  const canReview = canPerformAdvisorActions(document, isAdvisor());

  const handleApprove = () => onStatusChange('APPROVED');
  const handleRequestRevision = () => {
    const reason = prompt('Motivo da solicitação de revisão (necessário):');
    if (reason && reason.trim() !== "") {
      onStatusChange('REVISION', reason);
    } else if (reason !== null) {
      toast.error("O motivo da solicitação de revisão é obrigatório.");
    }
  };
  const handleSubmit = () => {
    if (window.confirm('Deseja submeter este documento para revisão?')) {
      onStatusChange('SUBMITTED');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {canEdit && (
        <Link to={`/${isStudent() ? 'student' : 'advisor'}/documents/${document.id}/edit`} className="btn btn-secondary">
          <PencilIcon className="h-5 w-5 mr-2" /> Editar
        </Link>
      )}
      
      {canSubmit && (
        <button onClick={handleSubmit} className="btn btn-primary">
          <ClockIcon className="h-5 w-5 mr-2" /> Submeter
        </button>
      )}
      
      {canReview && (
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
  );
};

const DocumentViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const documentIdNum = Number(id);
  const navigate = useNavigate();
  const { user, isStudent, isAdvisor } = useAuthStore();
  
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'versions' | 'comments' | 'collaborators' | 'diff'>('content');
  const [versionToCompare1, setVersionToCompare1] = useState<any>(null);
  const [versionToCompare2, setVersionToCompare2] = useState<any>(null);

  // Hook otimizado para buscar documento
  const { data: document, loading, refetch } = useApiData<DocumentDetail>(
    documentIdNum ? `/documents/${documentIdNum}` : '',
    [documentIdNum],
    { errorMessage: 'Erro ao carregar dados do documento.' }
  );

  const loadVersions = useCallback(async () => {
    if (!documentIdNum) return;
    try {
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
      }
    } catch (error) {
      toast.error('Erro ao carregar versões.');
    }
  }, [documentIdNum]);

  useEffect(() => {
    if (documentIdNum) {
      loadVersions();
    }
  }, [loadVersions]);

  const handleStatusChange = useCallback(async (newStatus: string, reason?: string) => {
    if (!document) return;
    try {
      await documentsApi.changeStatus(document.id, newStatus, reason);
      toast.success('Status alterado com sucesso!');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status.');
    }
  }, [document, refetch]);

  if (loading || !document) {
    return <LoadingSpinner size="lg" message="Carregando documento..." fullScreen />;
  }

  const statusInfo = getDocumentStatusInfo(document.status);
  const StatusIcon = statusInfo.icon;

  const TABS = [
    { id: 'content', name: 'Conteúdo', icon: statusInfo.icon, condition: true },
    { id: 'versions', name: 'Versões', count: versions.length, icon: statusInfo.icon, condition: true },
    { id: 'diff', name: 'Comparar Versões', icon: ArrowsRightLeftIcon, condition: versions.length >= 1 },
    { id: 'comments', name: 'Comentários', icon: ChatBubbleLeftEllipsisIcon, condition: selectedVersion !== null },
    { id: 'collaborators', name: 'Colaboradores', icon: UserGroupIcon, condition: true },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header da Página */}
      <PageHeader
        title={document.title}
        subtitle={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            <StatusBadge status={document.status} showIcon />
            <span className="flex items-center">
              <UserIcon className="h-4 w-4 inline mr-1" />
              Estudante(s): {document.allStudentNames || 'N/A'}
            </span>
            <span className="flex items-center">
              <AcademicCapIcon className="h-4 w-4 inline mr-1 text-gray-400" />
              Orientador(es): {document.allAdvisorNames || 'N/A'}
            </span>
            <span className="flex items-center">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Atualizado: {formatDate(document.updatedAt)}
            </span>
          </div>
        }
        actions={
          <>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <DocumentActions document={document} onStatusChange={handleStatusChange} />
          </>
        }
      />

      {/* Informações Detalhadas do Documento */}
      <DocumentInfo document={document} />

      {/* Abas de Navegação e Conteúdo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 px-6 overflow-x-auto custom-scrollbar">
            {TABS.filter(tab => tab.condition).map((tabInfo) => (
              <TabButton
                key={tabInfo.id}
                isActive={activeTab === tabInfo.id}
                onClick={() => setActiveTab(tabInfo.id as any)}
                icon={tabInfo.icon}
                label={tabInfo.name}
                count={tabInfo.count}
                disabled={!tabInfo.condition}
              />
            ))}
          </nav>
        </div>

        {/* Conteúdo das Abas com Suspense */}
        <div className="p-6 min-h-[300px]">
          <Suspense fallback={<LoadingSpinner message="Carregando conteúdo..." />}>
            {activeTab === 'content' && (
              selectedVersion ? (
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
                  <div 
                    className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none p-4 border rounded-md bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: selectedVersion.content }} 
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <StatusIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma versão disponível</h3>
                  <p className="mt-1 text-sm text-gray-500">Este documento ainda não possui conteúdo.</p>
                </div>
              )
            )}
            
            {activeTab === 'versions' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Histórico de Versões</h3>
                {versions.length === 0 ? (
                  <div className="text-center py-12">
                    <StatusIcon className="mx-auto h-12 w-12 text-gray-400" />
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
                              {index === 0 && <StatusBadge status="CURRENT" />}
                            </div>
                            {version.commitMessage && (
                              <p className="text-sm text-gray-600 mt-1 italic">"{version.commitMessage}"</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Por {version.createdByName}</span>
                              <span>{formatDate(version.createdAt)}</span>
                              <span>{version.commentCount || 0} comentário(s)</span>
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
                            Ver Conteúdo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'diff' && versions.length >= 1 && documentIdNum && (
              <VersionDiff 
                documentId={documentIdNum} 
                version1Id={versionToCompare1?.id} 
                version2Id={versionToCompare2?.id} 
                onVersionSelect={(v1, v2) => { 
                  setVersionToCompare1(v1); 
                  setVersionToCompare2(v2); 
                }} 
              />
            )}
            
            {activeTab === 'comments' && selectedVersion && (
              <CommentThread versionId={selectedVersion.id} />
            )}
            
            {activeTab === 'comments' && !selectedVersion && (
              <div className="text-center py-12">
                <ChatBubbleLeftEllipsisIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Selecione uma versão</h3>
                <p className="mt-1 text-sm text-gray-500">Para ver ou adicionar comentários, selecione uma versão na aba "Versões".</p>
              </div>
            )}
            
            {activeTab === 'collaborators' && documentIdNum && (
              <CollaboratorManager 
                documentId={documentIdNum} 
                canManageThisDocument={document?.canManageCollaborators ?? false} 
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewPage;