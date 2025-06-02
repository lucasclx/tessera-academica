// src/pages/DocumentEditPage.tsx - OTIMIZADO
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
import { documentsApi, versionsApi, usersApi, Document, Version } from '../lib/api';
import { toast } from 'react-hot-toast';
import TiptapEditor, { EditorRef } from '../Editor/TiptapEditor';

// Componentes otimizados
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useApiData } from '../hooks/useApiData';
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
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  advisorId: yup
    .number()
    .positive('Selecione um orientador')
    .required('Orientador é obrigatório'),
});

interface FormData {
  title: string;
  description: string;
  advisorId: number;
}

// Componente de Formulário otimizado
const DocumentForm: React.FC<{
  register: any;
  errors: any;
  advisors: Array<{ id: number; name: string }>;
  onFieldChange: () => void;
}> = ({ register, errors, advisors, onFieldChange }) => (
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
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="advisorId" className="block text-sm font-medium text-gray-700 mb-2">
          Orientador *
        </label>
        <select
          {...register('advisorId')}
          id="advisorId"
          className={`input-field ${errors.advisorId ? 'input-error' : ''}`}
          onChange={onFieldChange}
        >
          <option value="">Selecione um orientador</option>
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

// Componente de Editor otimizado
const DocumentEditor: React.FC<{
  editorRef: React.RefObject<EditorRef>;
  content: string;
  commitMessage: string;
  setCommitMessage: (message: string) => void;
  onContentChange: (content: string) => void;
  isEditing: boolean;
  latestVersion?: Version;
}> = ({ 
  editorRef, 
  content, 
  commitMessage, 
  setCommitMessage, 
  onContentChange, 
  isEditing, 
  latestVersion 
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
          Mensagem da Versão (opcional ao salvar)
        </label>
        <input
          type="text"
          id="commitMessage"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder={
            isEditing && latestVersion 
              ? "Descreva as alterações desta versão" 
              : "Mensagem para a primeira versão"
          }
          className="input-field"
        />
        <p className="mt-1 text-xs text-gray-500">
          Opcional. Usado ao salvar alterações no conteúdo.
        </p>
      </div>
      
      <TiptapEditor
        ref={editorRef}
        content={content}
        onChange={onContentChange}
        placeholder="Comece a escrever seu documento aqui..."
        className="min-h-[500px] max-w-4xl mx-auto"
      />
    </div>
  </div>
);

// Componente de Status de Mudanças
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { confirm, confirmDeletion } = useConfirmDialog();
  const editorRef = useRef<EditorRef>(null);
  
  const [latestVersion, setLatestVersion] = useState<Version | null>(null);
  const [content, setContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isEditing = Boolean(id);

  // Hook otimizado para buscar orientadores
  const { data: advisors = [] } = useApiData<Array<{ id: number; name: string }>>(
    '/users/advisors',
    [],
    { errorMessage: 'Erro ao carregar orientadores' }
  );

  // Hook otimizado para buscar documento (apenas se editando)
  const { data: document, loading: documentLoading } = useApiData<Document>(
    isEditing && id ? `/documents/${id}` : '',
    [id, isEditing],
    { 
      errorMessage: 'Erro ao carregar documento',
      immediate: isEditing 
    }
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  // Carregar documento e versões
  useEffect(() => {
    if (document && isEditing) {
      setValue('title', document.title);
      setValue('description', document.description || '');
      setValue('advisorId', document.advisorId);
      
      loadLatestVersion();
    }
  }, [document, isEditing, setValue]);

  const loadLatestVersion = async () => {
    if (!id) return;
    
    try {
      const versions = await versionsApi.getByDocument(Number(id));
      if (versions.length > 0) {
        const latest = versions[0];
        setLatestVersion(latest);
        setContent(latest.content);
        
        setTimeout(() => {
          editorRef.current?.setContent(latest.content);
          setHasUnsavedChanges(false);
        }, 100);
      } else {
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      toast.error('Erro ao carregar versões do documento');
    }
  };

  // Controle de mudanças não salvas
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
  const handleContentChange = () => setHasUnsavedChanges(true);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const currentContent = editorRef.current?.getContent() || '';
    
    try {
      if (isEditing && document) {
        await documentsApi.update(document.id, {
          title: data.title,
          description: data.description,
          advisorId: data.advisorId,
        });
        
        const contentChanged = currentContent !== (latestVersion?.content || '');
        if (contentChanged || commitMessage.trim() !== '') {
          if (currentContent.trim() !== "" || latestVersion) {
            await versionsApi.create({
              documentId: document.id,
              content: currentContent,
              commitMessage: commitMessage.trim() || (contentChanged ? 'Atualização de conteúdo' : 'Alterações nos metadados'),
            });
          }
        }
        toast.success('Documento atualizado com sucesso');
      } else {
        const newDoc = await documentsApi.create({
          title: data.title,
          description: data.description,
          studentId: user!.id,
          advisorId: data.advisorId,
        });
        
        if (currentContent.trim() !== "") {
          await versionsApi.create({
            documentId: newDoc.id,
            content: currentContent,
            commitMessage: commitMessage.trim() || 'Versão inicial',
          });
        }
        toast.success('Documento criado com sucesso');
        setHasUnsavedChanges(false);
        navigate(`/student/documents/${newDoc.id}/edit`);
        return;
      }
      
      setHasUnsavedChanges(false);
      setCommitMessage('');
      loadLatestVersion();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isEditing ? 'Erro ao atualizar documento' : 'Erro ao criar documento'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    
    const confirmed = await confirmDeletion(document.title);
    if (!confirmed) return;

    try {
      await documentsApi.delete(document.id);
      toast.success('Documento excluído com sucesso');
      navigate('/student/documents');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir documento');
    }
  };

  const handleBack = async () => {
    if (hasUnsavedChanges) {
      const confirmed = await confirm('Você tem alterações não salvas. Deseja sair mesmo assim?');
      if (!confirmed) return;
    }
    navigate(-1);
  };

  if (documentLoading || (isEditing && !document)) {
    return <LoadingSpinner size="lg" message="Carregando documento..." fullScreen />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <PageHeader
        title={isEditing ? `Editando: ${document?.title || 'Documento'}` : 'Novo Documento'}
        subtitle={
          document && (
            <p className="text-sm text-gray-500 mt-1">
              Última atualização: {formatDateTime(document.updatedAt)}
            </p>
          )
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

            <button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="btn btn-secondary"
            >
              <SaveIcon className="h-5 w-5 mr-2" />
              Salvar Rascunho
            </button>

            {isEditing && document?.status === 'DRAFT' && (
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Excluir
              </button>
            )}
          </div>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <DocumentForm
          register={register}
          errors={errors}
          advisors={advisors}
          onFieldChange={handleFormChange}
        />

        <DocumentEditor
          editorRef={editorRef}
          content={content}
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          onContentChange={handleContentChange}
          isEditing={isEditing}
          latestVersion={latestVersion}
        />

        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading || !hasUnsavedChanges}
            className="btn btn-primary"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Salvando...' : 'Criando...'}
              </div>
            ) : (
              <>
                <SaveIcon className="h-5 w-5 mr-2" />
                {isEditing ? 'Salvar Alterações' : 'Criar Documento e Salvar Versão'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentEditPage;