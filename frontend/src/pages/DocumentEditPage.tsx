// src/pages/DocumentEditPage.tsx - MIGRADO PARA REACT QUILL E CORRIGIDO
import React, { useState, useEffect, useRef } from 'react';
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
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { documentsApi, versionsApi, usersApi, Document, Version, Advisor } from '../lib/api'; 
import { toast } from 'react-hot-toast';
import ReactQuillEditor, { EditorRef } from '../Editor/ReactQuillEditor';

import PageHeader from '../components/common/PageHeader'; 
import LoadingSpinner from '../components/common/LoadingSpinner'; 
import { useConfirmDialog } from '../hooks/useConfirmDialog'; 
import { formatDateTime } from '../utils/dateUtils'; 

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
  advisorId: yup
    .number()
    .positive('Selecione um orientador')
    .required('Orientador é obrigatório'),
});

interface FormData {
  title: string;
  description?: string | null; 
  advisorId: number;
}

const DocumentForm: React.FC<{
  register: any;
  errors: any;
  advisors: Advisor[]; 
  onFieldChange: () => void;
  disabled?: boolean;
}> = ({ register, errors, advisors, onFieldChange, disabled = false }) => (
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

      <div>
        <label htmlFor="advisorId" className="block text-sm font-medium text-gray-700 mb-2">
          Orientador Principal *
        </label>
        <select
          {...register('advisorId')}
          id="advisorId"
          className={`input-field ${errors.advisorId ? 'input-error' : ''}`}
          onChange={onFieldChange}
          disabled={disabled}
        >
          <option value="">Selecione um orientador</option>
          {/* A prop 'advisors' agora é garantida como array (pode ser vazia) */}
          {advisors.map((advisor) => ( 
            <option key={advisor.id} value={advisor.id}>
              {advisor.name}
            </option>
          ))}
        </select>
        {errors.advisorId && (
          <p className="mt-1 text-sm text-red-600">{errors.advisorId.message}</p>
        )}
      </div>
    </div>
  </div>
);

const DocumentEditor: React.FC<{
  editorRef: React.RefObject<EditorRef>;
  initialContent: string; 
  commitMessage: string;
  setCommitMessage: (message: string) => void;
  onContentChange: (newContent: string) => void;
  isEditing: boolean;
  latestVersion?: Version | null; 
  disabled?: boolean;
}> = ({ 
  editorRef, 
  initialContent, 
  commitMessage, 
  setCommitMessage, 
  onContentChange, 
  isEditing, 
  latestVersion,
  disabled = false,
}) => (
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
            isEditing && latestVersion 
              ? "Descreva as alterações desta versão (ex: 'Capítulo 1 revisado')" 
              : "Mensagem para a primeira versão (ex: 'Primeira submissão')"
          }
          className="input-field"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-gray-500">
          Opcional, mas recomendado ao salvar alterações no conteúdo.
        </p>
      </div>
      
      <ReactQuillEditor
        ref={editorRef}
        content={initialContent} 
        onChange={onContentChange} 
        placeholder="Comece a escrever seu documento aqui..."
        className="min-h-[500px] max-w-4xl mx-auto"
        showToolbar={true}
        editable={!disabled} 
      />
    </div>
  </div>
);

const UnsavedChangesIndicator: React.FC<{ hasChanges: boolean }> = ({ hasChanges }) => {
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
  const navigate = useNavigate();
  const { user } = useAuthStore(); //
  const { confirm, confirmDeletion } = useConfirmDialog(); //
  const editorRef = useRef<EditorRef>(null);
  
  const [latestVersion, setLatestVersion] = useState<Version | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isEditing = Boolean(id); 

  // MODIFICAÇÃO: Renomear 'advisors' desestruturado para 'advisorsDataFromHook' para evitar conflito e usar no fallback.
  const { data: advisorsDataFromHook, loading: advisorsLoading } = useApiData<Advisor[]>( //
    '/users/advisors', [], { errorMessage: 'Erro ao carregar orientadores' }
  );

  const { data: document, loading: documentLoading, refetch: refetchDocument } = useApiData<Document>( //
    isEditing && id ? `/documents/${id}` : null, 
    [id, isEditing],
    { errorMessage: 'Erro ao carregar documento', immediate: isEditing }
  ); 

  const {
    register,
    handleSubmit,
    setValue,
    reset, 
    formState: { errors, dirtyFields }, 
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { 
        title: '',
        description: '',
        advisorId: undefined,
    }
  });

  const loadLatestVersion = async () => {
    if (!id) return; 
    
    try {
      const versions = await versionsApi.getByDocument(Number(id)); //
      if (versions.length > 0) {
        const latest = versions[0];
        setLatestVersion(latest);
        setEditorContent(latest.content); 
        
        setTimeout(() => {
          editorRef.current?.setContent(latest.content, 'api');
          setHasUnsavedChanges(false); 
        }, 100);
      } else {
        setEditorContent(''); 
        setLatestVersion(null);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      toast.error('Erro ao carregar versões do documento');
    }
  };
  
  useEffect(() => {
    if (document && isEditing) {
      reset({ 
        title: document.title,
        description: document.description || '',
        advisorId: document.advisorId,
      });
      loadLatestVersion();
    } else if (!isEditing) { 
      reset(); 
      setEditorContent('');
      setLatestVersion(null);
      setHasUnsavedChanges(false);
      setTimeout(() => editorRef.current?.setContent('', 'api'), 100); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, isEditing, reset]); 

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

  const handleFormChange = () => setHasUnsavedChanges(true);
  const handleEditorContentChange = (newContent: string) => {
    const baseContentToCompare = latestVersion?.content || (isEditing ? '' : editorContent); 
    if(newContent !== baseContentToCompare) {
      setHasUnsavedChanges(true);
    }
  };

  const onSubmitDocument = async (data: FormData) => {
    setLoading(true);
    const currentEditorHTML = editorRef.current?.getContent() || '';
    
    try {
      let docIdToUse = document?.id;

      if (isEditing && docIdToUse) { 
        const formChanged = Object.keys(dirtyFields).length > 0;
        if (formChanged) {
          await documentsApi.update(docIdToUse, {
            title: data.title,
            description: data.description,
            advisorId: data.advisorId,
          }); //
        }

        const editorContentActuallyChanged = currentEditorHTML !== (latestVersion?.content || '');
        if (editorContentActuallyChanged || commitMessage.trim() !== '') {
          if (currentEditorHTML.trim() !== "" || latestVersion) { 
            await versionsApi.create({
              documentId: docIdToUse,
              content: currentEditorHTML,
              commitMessage: commitMessage.trim() || (editorContentActuallyChanged ? 'Atualização de conteúdo' : 'Alterações nos metadados'),
            }); //
          }
        }
        toast.success('Documento atualizado com sucesso!');
      } else { 
        const newDocPayload = {
            title: data.title,
            description: data.description,
            studentId: user!.id, 
            advisorId: data.advisorId,
        };
        const newDoc = await documentsApi.create(newDocPayload); //
        docIdToUse = newDoc.id; 
        
        if (currentEditorHTML.trim() !== "") {
          await versionsApi.create({
            documentId: docIdToUse,
            content: currentEditorHTML,
            commitMessage: commitMessage.trim() || 'Versão inicial',
          }); //
        }
        toast.success('Documento criado com sucesso!');
        navigate(`/student/documents/${docIdToUse}/edit`, { replace: true });
        return; 
      }
      
      setHasUnsavedChanges(false);
      setCommitMessage('');
      if (docIdToUse) {
        refetchDocument(); 
        loadLatestVersion(); 
      }
      reset(data); 

    } catch (error: any) {
      toast.error(error.response?.data?.message || (isEditing ? 'Erro ao atualizar documento' : 'Erro ao criar documento'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    
    const confirmed = await confirmDeletion(`o documento "${document.title}"`); //
    if (!confirmed) return;

    try {
      await documentsApi.delete(document.id); //
      toast.success('Documento excluído com sucesso');
      navigate('/student/documents');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir documento');
    }
  };

  const handleBack = async () => {
    if (hasUnsavedChanges) {
      const confirmed = await confirm(
        'Você tem alterações não salvas. Deseja sair mesmo assim e descartar as alterações?',
        'Sair sem Salvar?'
      ); //
      if (!confirmed) return;
    }
    navigate(-1); 
  };

  const isViewOnly = isEditing && document?.status !== 'DRAFT';

  if ((documentLoading || advisorsLoading) && isEditing) { //
    return <LoadingSpinner size="lg" message="Carregando documento..." fullScreen />; //
  }
   if (advisorsLoading && !isEditing) { 
    return <LoadingSpinner size="lg" message="Carregando dados..." fullScreen />; //
  }


  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <PageHeader
        title={isEditing ? `Editando: ${document?.title || 'Documento'}` : 'Novo Documento'}
        subtitle={
          isEditing && document && (
            // A prop subtitle agora espera um ReactNode, então o <p> está correto aqui.
            // A correção do aninhamento foi feita em PageHeader.tsx
            <p className="text-sm text-gray-500 mt-1">
              Última atualização: {formatDateTime(document.updatedAt)} {isViewOnly ? `(Status: ${document.status} - Somente Leitura)` : ''}
            </p>
          ) //
        }
        actions={
          <div className="flex items-center space-x-2">
            <UnsavedChangesIndicator hasChanges={hasUnsavedChanges} />
            
            <button
              onClick={handleBack}
              className="btn btn-secondary"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>

            {!isViewOnly && (
              <button
                onClick={handleSubmit(onSubmitDocument)}
                disabled={loading || !hasUnsavedChanges} 
                className="btn btn-primary" 
                title={!hasUnsavedChanges ? "Nenhuma alteração para salvar" : (isEditing ? "Salvar alterações no documento e/ou criar nova versão" : "Criar documento e salvar conteúdo como primeira versão")}
              >
                <SaveIcon className="h-5 w-5 mr-2" />
                {isEditing ? 'Salvar Alterações' : 'Criar Documento'}
              </button>
            )}

            {isEditing && document?.status === 'DRAFT' && (
              <button
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={loading}
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Excluir Rascunho
              </button>
            )}
          </div>
        }
      /> {/* */}

      <form onSubmit={handleSubmit(onSubmitDocument)} className="space-y-6">
        <DocumentForm
          register={register}
          errors={errors}
          advisors={advisorsDataFromHook || []} // CORREÇÃO APLICADA AQUI
          onFieldChange={handleFormChange}
          disabled={isViewOnly || loading || advisorsLoading} 
        />

        <DocumentEditor
          editorRef={editorRef}
          initialContent={editorContent} 
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          onContentChange={handleEditorContentChange}
          isEditing={isEditing}
          latestVersion={latestVersion}
          disabled={isViewOnly || loading} 
        />

        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          
          {!isViewOnly && (
            <button
              type="submit"
              disabled={loading || !hasUnsavedChanges}
              className="btn btn-primary"
              title={!hasUnsavedChanges ? "Nenhuma alteração para salvar" : (isEditing ? "Salvar alterações no documento e/ou criar nova versão" : "Criar documento e salvar conteúdo como primeira versão")}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Salvando...' : 'Criando...'}
                </div>
              ) : (
                <>
                  <SaveIcon className="h-5 w-5 mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Documento'}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DocumentEditPage;