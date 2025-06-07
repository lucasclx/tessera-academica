import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useApiData } from '../hooks/useApiData';
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon as SaveIcon,
  ClockIcon,
  TrashIcon,
  ArrowDownTrayIcon,

} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { documentsApi, versionsApi, DocumentDetailDTO, Version } from '../lib/api';
import { toast } from 'react-hot-toast';
import { debugLog } from '../utils/logger';
import TiptapEditor, { EditorRef } from '../Editor/TiptapEditor';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { formatDateTime } from '../utils/dateUtils';
import { useWebSocket } from '../components/providers/WebSocketProvider';
import { exportHtmlToPdf, sanitizeFilename } from '../utils/pdfExport';

const schema = yup.object({
  title: yup
    .string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .required('Título é obrigatório'),
  description: yup
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .nullable(),
  // Advisor selection removed
});

interface FormData {
  title: string;
  description?: string | null;
}

const DocumentForm: React.FC<{
  register: any;
  errors: any;
  onFieldChange: () => void;
  disabled?: boolean;
}> = ({ register, errors, onFieldChange, disabled = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Informações do Documento</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Título *
          </label>
          <input
            {...register('title')}
            type="text"
            id="title"
            placeholder="Digite o título do documento"
            className={`input-field ${errors.title ? 'input-error' : ''}`}
            onChange={onFieldChange}
            disabled={disabled}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={3}
            placeholder="Breve descrição do documento (opcional)"
            className={`input-field ${errors.description ? 'input-error' : ''}`}
            onChange={onFieldChange}
            disabled={disabled}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
        {/* Advisor selection removed */}
      </div>
    </div>
  );
};

const DocumentEditor: React.FC<{
  editorRef: React.RefObject<EditorRef>; // EditorRef agora é do Tiptap
  initialContent: string; // Será passado como 'content' para TiptapEditor
  commitMessage: string;
  setCommitMessage: (message: string) => void;
  onContentChange: (newContent: string) => void; // Será o 'onChange' do Tiptap
  onSelectionChange?: (sel: { from: number; to: number }) => void;
  onAddComment?: (sel: { from: number; to: number }) => void;
  isEditingDoc: boolean; // Renomeado para clareza, para diferenciar do 'editable' do Tiptap
  latestVersion?: Version | null;
  disabled?: boolean; // Para desabilitar campos e editor
}> = ({
  editorRef,
  initialContent,
  commitMessage,
  setCommitMessage,
  onContentChange,
  onSelectionChange,
  onAddComment,
  isEditingDoc,
  latestVersion,
  disabled = false,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Conteúdo do Documento</h2>
        <p className="text-sm text-gray-500 mt-1">
          Use o editor abaixo para escrever o conteúdo do seu documento.
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="commitMessage" className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem da Versão (Salvar alterações no conteúdo)
          </label>
          <input
            type="text"
            id="commitMessage"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder={
              isEditingDoc && latestVersion
                ? "Descreva as alterações desta versão (ex: 'Capítulo 1 revisado')"
                : "Mensagem para a primeira versão (ex: 'Versão inicial')"
            }
            className="input-field"
            disabled={disabled}
          />
          <p className="mt-1 text-xs text-gray-500">
            Opcional, mas recomendado ao salvar alterações no conteúdo.
          </p>
        </div>
        <TiptapEditor
          ref={editorRef}
          content={initialContent} // Passa o conteúdo inicial
          onChange={onContentChange} // Callback para mudanças
          onSelectionChange={onSelectionChange}
          onAddComment={onAddComment}
          placeholder="Comece a escrever seu documento aqui..."
          className="border border-gray-300 rounded-lg shadow-sm overflow-hidden" // Estilo para o wrapper do Tiptap
          editorClassName="min-h-[400px] p-4" // Estilo para a área de edição do Tiptap
          showToolbar={true}
          editable={!disabled} // Tiptap usa 'editable'
        />
      </div>
    </div>
  );
};

const UnsavedChangesIndicator: React.FC<{ hasChanges: boolean }> = ({ hasChanges }) => {
  if (!hasChanges) return null;
  return (
    <span className="text-sm text-orange-600 mr-4 flex items-center">
      <ClockIcon className="h-4 w-4 mr-1 animate-pulse" />
      Alterações não salvas
    </span>
  );
};

// Componente Principal
const DocumentEditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { confirmDeletion } = useConfirmDialog();
  const editorRef = useRef<EditorRef>(null);

  const [latestVersion, setLatestVersion] = useState<Version | null>(null);
  const draftKey = `documentDraft_${id ?? 'new'}`;
  const savedDraft = (() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(draftKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { title: string; description?: string; content: string };
    } catch {
      return null;
    }
  })();

  const [editorInitialContent, setEditorInitialContent] = useState(
    savedDraft?.content || ''
  );
  const [commitMessage, setCommitMessage] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(Boolean(savedDraft));
  const [activeEditors, setActiveEditors] = useState<{ id: number; name: string }[]>([]);
  const [selection, setSelection] = useState<{ from: number; to: number } | null>(null);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);

  const { sendMessage, subscribe } = useWebSocket();

  const isEditing = Boolean(id);

  const saveDraftToStorage = useCallback(
    (content?: string) => {
      const values = getValues();
      const draft = {
        title: values.title,
        description: values.description || '',
        content:
          content !== undefined
            ? content
            : editorRef.current?.getContent() || '',
      };
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        // ignore storage errors
      }
    },
    [draftKey, getValues]
  );


  const { data: documentData, loading: documentLoading, refetch: refetchDocument, error: documentError } = useApiData<DocumentDetailDTO>(
    isEditing && id ? `/documents/${id}` : null,
    [id, isEditing],
    { errorMessage: 'Erro ao carregar documento.', immediate: isEditing }
  );

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: savedDraft?.title || '',
      description: savedDraft?.description || '',
    },
  });

  const loadLatestVersion = useCallback(
    async (docId: number) => {
      try {
        debugLog('DocumentEditPage: 📥 Carregando versões do documento', docId);
        const versions = await versionsApi.getByDocument(docId);
        if (versions.length > 0) {
          const latest = versions[0];
          debugLog('DocumentEditPage: 📝 Última versão encontrada:', latest.versionNumber);
          setLatestVersion(latest);
          if (!savedDraft) {
            setEditorInitialContent(latest.content);
          }
        } else {
          debugLog('DocumentEditPage: 📝 Nenhuma versão encontrada para doc existente, editor vazio.');
          setLatestVersion(null);
          if (!savedDraft) {
            setEditorInitialContent('');
          }
        }
      } catch (error) {
      console.error('DocumentEditPage: ❌ Erro ao carregar versões:', error);
      toast.error('Erro ao carregar o conteúdo da última versão do documento');
        if (!savedDraft) {
          setEditorInitialContent('');
        }
      }
    },
    [savedDraft]
  );

  useEffect(() => {
    const currentOverallLoading = isEditing && documentLoading;
    setPageLoading(currentOverallLoading);

      if (!currentOverallLoading) {
        if (isEditing) {
          if (documentData) {
            debugLog('DocumentEditPage: 🔄 Sincronizando dados do documento existente com formulário', documentData);
            if (!savedDraft) {
              reset({
                title: documentData.title,
                description: documentData.description || '',
              });
              loadLatestVersion(Number(id));
            } else {
              loadLatestVersion(Number(id));
            }
          } else if (documentError) {
              toast.error("Falha ao carregar dados do documento para edição.");
          }
        } else {
          debugLog('DocumentEditPage: 🆕 Novo documento - resetando formulário e definindo editorInitialContent');
          if (!savedDraft) {
            reset({ title: '', description: '' });
            setLatestVersion(null);
            setEditorInitialContent(''); // Tiptap receberá string vazia como prop 'content'
          }
          setHasUnsavedChanges(Boolean(savedDraft));
        }
      }
  }, [
    isEditing, id, reset, loadLatestVersion,
    documentData, documentLoading, documentError, savedDraft

  ]);


  const handleFormChange = useCallback(() => {
    debugLog('DocumentEditPage: 📝 Formulário alterado');
    setHasUnsavedChanges(true);
    saveDraftToStorage();
  }, [saveDraftToStorage]);

  const handleEditorContentChange = useCallback((newContent: string) => {
    debugLog('DocumentEditPage: ✏️ Conteúdo do editor (Tiptap) alterado.');
    // Para Tiptap, uma string vazia pode ser representada como '<p></p>' ou similar.
    // A comparação precisa ser mais inteligente ou simplesmente assumir que qualquer `onChange` do editor é uma mudança.
    // Ou, o TiptapEditor pode internamente comparar antes de chamar onChange.
    // Por segurança, marcamos como alterado se o editor chamar.
    setHasUnsavedChanges(true);
    saveDraftToStorage(newContent);
    // Não precisamos definir editorInitialContent aqui, pois onContentChange é para mudanças do usuário.
    // editorInitialContent é para o conteúdo que *vem* dos dados.
  }, [saveDraftToStorage]);

  const handleExportPdf = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.getContent();
    const title = isEditing && documentData ? documentData.title : 'documento';
    const versionLabel = latestVersion ? `v${latestVersion.versionNumber}` : 'draft';
    const filename = `${sanitizeFilename(title)}_${versionLabel}.pdf`;
    exportHtmlToPdf(html, filename);
  }, [isEditing, documentData, latestVersion]);


  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!isEditing || !id || !user) return;
    const docId = Number(id);
    const payload = { documentId: docId, userId: user.id, userName: user.name };
    sendMessage('/app/editing/join', payload);
    const unsubscribe = subscribe(`/topic/documents/${docId}/editors`, (editors: any) => {
      setActiveEditors(Array.isArray(editors) ? editors : []);
    });
    return () => {
      sendMessage('/app/editing/leave', payload);
      if (unsubscribe) unsubscribe();
    };
  }, [isEditing, id, user, sendMessage, subscribe]);


  const onSubmitDocument = async (data: FormData) => {
    debugLog('DocumentEditPage: 💾 Tentando salvar documento (com Tiptap):', data);


    setActionLoading(true);

    let currentEditorHTML = '';
    if (editorRef.current) {
      try {
        currentEditorHTML = editorRef.current.getContent();
      } catch (editorError) {
        console.warn('DocumentEditPage: ⚠️ Erro ao obter conteúdo do editor Tiptap ao salvar:', editorError);
        toast.error("Não foi possível obter o conteúdo do editor. Tente novamente.");
        setActionLoading(false);
        return;
      }
    } else {
        console.warn("DocumentEditPage: ⚠️ editorRef.current (Tiptap) é nulo ao tentar salvar.");
        toast.error("Referência do editor não encontrada. Tente recarregar a página.");
        setActionLoading(false);
        return;
    }


    try {
      let docIdToUse = isEditing ? Number(id) : undefined;

      if (isEditing && docIdToUse && documentData) {
        debugLog('DocumentEditPage: ✏️ Atualizando documento existente (Tiptap):', docIdToUse);
        const formMetaChanged = data.title !== documentData.title ||
                                data.description !== (documentData.description || '');
        let infoUpdated = false;

        if (formMetaChanged) {
          await documentsApi.update(docIdToUse, {
            title: data.title,
            description: data.description,
          });
          infoUpdated = true;
        }

        // Tiptap pode retornar <p></p> para conteúdo vazio.
        const currentEditorIsEmpty = currentEditorHTML === '<p></p>' || currentEditorHTML === '';
        const latestVersionContent = latestVersion?.content || '';
        const latestVersionIsEmpty = latestVersionContent === '<p></p>' || latestVersionContent === '';

        const editorContentActuallyChanged = !(currentEditorIsEmpty && latestVersionIsEmpty) && currentEditorHTML !== latestVersionContent;

        let versionCreated = false;
        if (editorContentActuallyChanged || (commitMessage.trim() !== '' && (!currentEditorIsEmpty || latestVersion))) {
            await versionsApi.create({
              documentId: docIdToUse,
              content: currentEditorHTML, // Salva o HTML do Tiptap
              commitMessage: commitMessage.trim() || (editorContentActuallyChanged ? 'Atualização de conteúdo' : 'Alterações nos metadados com mensagem de versão'),
            });
            versionCreated = true;
        }

        if (infoUpdated || versionCreated) {
            toast.success('Documento atualizado com sucesso!');
            localStorage.removeItem(draftKey);
        } else {
            // react-hot-toast doesn't provide a dedicated `info` helper.
            // Use the default toast function to display informational messages.
            toast('Nenhuma alteração detectada para salvar.');
        }

      } else {
        debugLog('DocumentEditPage: 🆕 Criando novo documento (Tiptap)');
        if (!user?.id) { /* ... */ return; } // Autenticação
        const newDocPayload = {
            title: data.title,
            description: data.description,
            studentId: user.id,
        };
        const newDoc = await documentsApi.create(newDocPayload);
        docIdToUse = newDoc.id;

        // Salva a primeira versão se houver conteúdo no Tiptap
        if (currentEditorHTML.trim() !== '' && currentEditorHTML !== '<p></p>') {
          await versionsApi.create({
            documentId: docIdToUse,
            content: currentEditorHTML,
            commitMessage: commitMessage.trim() || 'Versão inicial',
          });
        }
        toast.success('Documento criado com sucesso!');
        localStorage.removeItem(draftKey);
        navigate(`/student/documents/${docIdToUse}/edit`, { replace: true });
        setActionLoading(false);
        return;
      }

      setHasUnsavedChanges(false);
      setCommitMessage('');
      if (docIdToUse) {
        await refetchDocument();
        await loadLatestVersion(docIdToUse); // Isso definirá editorInitialContent para o Tiptap
      }
      reset(data);

    } catch (error: any) {
      console.error('DocumentEditPage: ❌ Erro ao salvar documento (Tiptap):', error);
      const errorMsg = error.response?.data?.message || (isEditing ? 'Erro ao atualizar documento' : 'Erro ao criar documento');
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentData) return;
    const confirmed = await confirmDeletion(documentData.title);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await documentsApi.delete(documentData.id);
      toast.success('Documento excluído com sucesso!');
      navigate('/student/documents', { replace: true });
    } catch (error: any) {
      console.error('DocumentEditPage: ❌ Erro ao excluir documento:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir documento');
    } finally {
      setActionLoading(false);
    }
  };

  if (pageLoading) {
    return <LoadingSpinner size="lg" message="Carregando dados da página..." fullScreen />;
  }

   if (isEditing && documentError && !documentData) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Erro crítico: Não foi possível carregar os dados deste documento.</p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary mt-4">Voltar</button>
      </div>
    );
  }

  const pageTitle = isEditing
    ? `Editando: ${documentData?.title || 'Carregando...'}`
    : 'Novo Documento';

  const canModifyDocument = !isEditing || (documentData?.status === 'DRAFT' || documentData?.status === 'REVISION');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <PageHeader
        title={pageTitle}
        subtitle={isEditing && documentData ? (
          <div className="space-y-1 text-sm text-gray-600">
            <p>ID: {documentData.id} | Status: {documentData.status} | Versões: {documentData.versionCount}</p>
            <p>Criado: {formatDateTime(documentData.createdAt)} | Atualizado: {formatDateTime(documentData.updatedAt)}</p>
              {activeEditors.length > 0 && (
                <p>Editando agora: {activeEditors.map(e => e.name).join(", ")}</p>
              )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Crie um novo documento acadêmico</p>
        )}
        actions={
          <div className="flex items-center space-x-3">
            <UnsavedChangesIndicator hasChanges={hasUnsavedChanges} />
            <button
              onClick={() => navigate(isEditing ? `/student/documents/${id}` : '/student/documents')}
              className="btn btn-secondary"
              disabled={actionLoading}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              {isEditing ? 'Ver Documento' : 'Voltar'}
            </button>
            {isEditing && documentData && documentData.status === 'DRAFT' && (
              <button
                onClick={handleDeleteDocument}
                className="btn btn-danger"
                disabled={actionLoading}
                title="Excluir Documento"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Excluir
              </button>
            )}
            {canModifyDocument && (
                <button
                onClick={handleSubmit(onSubmitDocument)}
                className="btn btn-primary"
                disabled={actionLoading}
                title={isEditing ? "Salvar Alterações" : "Criar Documento"}
                >
                {actionLoading ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>{isEditing ? 'Salvando...' : 'Criando...'}</>
                ) : (
                    <><SaveIcon className="h-5 w-5 mr-2" />{isEditing ? 'Salvar Alterações' : 'Criar Documento'}</>
                )}
                </button>
            )}
            <button onClick={handleExportPdf} className="btn btn-primary" title="Exportar PDF">
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Exportar PDF
            </button>
          </div>
        }
      />

    {!canModifyDocument && isEditing && documentData && (
        <div className="p-4 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-md text-sm">
            Este documento está no status "{documentData.status}" e não pode mais ser editado diretamente aqui.
            Para fazer alterações, o status precisa ser "Rascunho" (DRAFT) ou "Em Revisão" (REVISION).
        </div>
    )}

      <form onSubmit={handleSubmit(onSubmitDocument)} className="space-y-6">
        <DocumentForm
          register={register}
          errors={errors}
          onFieldChange={handleFormChange}
          disabled={actionLoading || !canModifyDocument}
        />
        <DocumentEditor
          editorRef={editorRef}
          initialContent={editorInitialContent}
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          onContentChange={handleEditorContentChange}
          onSelectionChange={(sel) => setSelection(sel)}
          onAddComment={(sel) => {
            setSelection(sel);
            setIsCommentPanelOpen(true);
          }}
          isEditingDoc={isEditing}
          latestVersion={latestVersion}
          disabled={actionLoading || !canModifyDocument}
        />
      </form>

      {isCommentPanelOpen && latestVersion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-40">
          <div className="relative top-0 right-0 h-full w-full max-w-md ml-auto bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-2" /> Comentários
              </h3>
              <button onClick={() => setIsCommentPanelOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <CommentThread
                versionId={latestVersion.id}
                selectedPosition={selection || undefined}
                onCommentAdded={() => setIsCommentPanelOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditPage;