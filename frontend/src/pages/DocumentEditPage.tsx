import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon as SaveIcon,
  ClockIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftEllipsisIcon,
  XMarkIcon,
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
import CommentThread from '../components/Comments/CommentThread';

const schema = yup.object({
  title: yup.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título deve ter no máximo 200 caracteres').required('Título é obrigatório'),
  description: yup.string().max(500, 'Descrição deve ter no máximo 500 caracteres').nullable(),
});

interface FormData {
  title: string;
  description?: string | null;
}

const DocumentForm: React.FC<{ register: any; errors: any; onFieldChange: () => void; disabled?: boolean; }> = ({ register, errors, onFieldChange, disabled = false }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Informações do Documento</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
          <input {...register('title')} type="text" id="title" placeholder="Digite o título do documento" className={`input-field ${errors.title ? 'input-error' : ''}`} onChange={onFieldChange} disabled={disabled} />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
          <textarea {...register('description')} id="description" rows={3} placeholder="Breve descrição do documento (opcional)" className={`input-field ${errors.description ? 'input-error' : ''}`} onChange={onFieldChange} disabled={disabled} />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>
      </div>
    </div>
);
  
const DocumentEditor: React.FC<{ editorRef: React.RefObject<EditorRef>; initialContent: string; commitMessage: string; setCommitMessage: (message: string) => void; onContentChange: (newContent: string) => void; isEditingDoc: boolean; latestVersion?: Version | null; disabled?: boolean; }> = ({ editorRef, initialContent, commitMessage, setCommitMessage, onContentChange, isEditingDoc, latestVersion, disabled = false, }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Conteúdo do Documento</h2>
        <p className="text-sm text-gray-500 mt-1">Use o editor abaixo para escrever o conteúdo do seu documento.</p>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="commitMessage" className="block text-sm font-medium text-gray-700 mb-2">Mensagem da Versão</label>
          <input type="text" id="commitMessage" value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} placeholder={isEditingDoc && latestVersion ? "Descreva as alterações desta versão..." : "Mensagem para a primeira versão..."} className="input-field" disabled={disabled} />
        </div>
        <TiptapEditor ref={editorRef} content={initialContent} onChange={onContentChange} placeholder="Comece a escrever seu documento aqui..." className="border border-gray-300 rounded-lg shadow-sm overflow-hidden" editorClassName="min-h-[400px] p-4" showToolbar={true} editable={!disabled} />
      </div>
    </div>
);
  
const UnsavedChangesIndicator: React.FC<{ hasChanges: boolean; }> = ({ hasChanges }) => {
    if (!hasChanges) return null;
    return (
      <span className="text-sm text-orange-600 mr-4 flex items-center">
        <ClockIcon className="h-4 w-4 mr-1 animate-pulse" />
        Alterações não salvas
      </span>
    );
};

const DocumentEditPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const documentId = id ? Number(id) : null;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { confirmDeletion } = useConfirmDialog();
    const editorRef = useRef<EditorRef>(null);
    const isMounted = useRef(true);

    const [latestVersion, setLatestVersion] = useState<Version | null>(null);
    const [editorInitialContent, setEditorInitialContent] = useState('');
    const [commitMessage, setCommitMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const isEditing = !!documentId;

    const { data: documentData, isLoading: pageLoading, error: documentError, refetch: refetchDocument } = useQuery<DocumentDetailDTO, Error>({
        queryKey: ['document', documentId],
        queryFn: () => documentsApi.getById(documentId!),
        enabled: isEditing,
        staleTime: 5 * 60 * 1000,
    });
    
    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>();

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const loadLatestVersion = useCallback(async (docId: number) => {
        try {
            const versions = await versionsApi.getByDocument(docId);
            if (isMounted.current && versions.length > 0) {
                setLatestVersion(versions[0]);
                setEditorInitialContent(versions[0].content);
            }
        } catch (error) {
            toast.error('Erro ao carregar o conteúdo da última versão.');
        }
    }, []);
    
    useEffect(() => {
        if (isEditing && documentData) {
            reset({ title: documentData.title, description: documentData.description || '' });
            loadLatestVersion(documentId!);
        }
    }, [isEditing, documentData, documentId, reset, loadLatestVersion]);

    const handleContentChange = useCallback(() => {
        setHasUnsavedChanges(true);
    }, []);

    const onSubmitDocument = async (data: FormData) => {
        if (!isMounted.current) return;
        setActionLoading(true);
        const editorContent = editorRef.current?.getContent() || '';
    
        try {
            if (isEditing && documentData) {
                if (isDirty) {
                  await documentsApi.update(documentId!, { title: data.title, description: data.description });
                }
                const contentChanged = editorContent !== (latestVersion?.content || '');
                if (contentChanged || commitMessage.trim()) {
                    await versionsApi.create({
                        documentId: documentId!,
                        content: editorContent,
                        commitMessage: commitMessage.trim() || 'Atualização de conteúdo',
                    });
                }
                toast.success('Documento atualizado com sucesso!');
                if (isMounted.current) {
                  setHasUnsavedChanges(false);
                  setCommitMessage('');
                  queryClient.invalidateQueries({ queryKey: ['document', documentId] });
                }
            } else {
                const newDocPayload = { title: data.title, description: data.description };
                const newDoc = await documentsApi.create(newDocPayload);
                if (editorContent.trim() && editorContent !== '<p></p>') {
                    await versionsApi.create({
                        documentId: newDoc.id,
                        content: editorContent,
                        commitMessage: commitMessage.trim() || 'Versão inicial',
                    });
                }
                toast.success('Documento criado com sucesso!');
                navigate(`/student/documents/${newDoc.id}/edit`, { replace: true });
            }
        } catch (error: any) {
            if (isMounted.current) {
                toast.error(error.response?.data?.message || 'Ocorreu um erro ao salvar.');
            }
        } finally {
            if (isMounted.current) {
                setActionLoading(false);
            }
        }
    };
    
    const handleDeleteDocument = async () => {
      // ...
    };

    if (pageLoading && isEditing) {
        return <LoadingSpinner size="lg" message="Carregando editor..." fullScreen />;
    }
  
    if (documentError) {
        return (
            <div className="text-center py-12 text-red-600">
                <p>Erro: {documentError.message}</p>
                <button onClick={() => navigate(-1)} className="btn btn-secondary mt-4">Voltar</button>
            </div>
        );
    }
    
    const canModifyDocument = !isEditing || (documentData?.status === 'DRAFT' || documentData?.status === 'REVISION');

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10">
            <PageHeader
                title={isEditing ? `Editando: ${documentData?.title || '...'}` : 'Novo Documento'}
                actions={
                  <div className="flex items-center space-x-3">
                      <UnsavedChangesIndicator hasChanges={hasUnsavedChanges || isDirty} />
                      {/* ... outros botões ... */}
                      {canModifyDocument && (
                          <button onClick={handleSubmit(onSubmitDocument)} className="btn btn-primary" disabled={actionLoading}>
                            <SaveIcon className="h-5 w-5 mr-2" />{isEditing ? 'Salvar Alterações' : 'Criar Documento'}
                          </button>
                      )}
                  </div>
                }
            />
            
            <form onSubmit={handleSubmit(onSubmitDocument)} className="space-y-6">
                <DocumentForm
                    register={register}
                    errors={errors}
                    onFieldChange={handleContentChange}
                    disabled={actionLoading || !canModifyDocument}
                />
                <DocumentEditor
                    editorRef={editorRef}
                    initialContent={editorInitialContent}
                    commitMessage={commitMessage}
                    setCommitMessage={setCommitMessage}
                    onContentChange={handleContentChange}
                    isEditingDoc={isEditing}
                    latestVersion={latestVersion}
                    disabled={actionLoading || !canModifyDocument}
                />
            </form>
        </div>
    );
};

export default DocumentEditPage;