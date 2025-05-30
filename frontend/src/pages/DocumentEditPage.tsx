// src/pages/DocumentEditPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  SaveIcon,
  ClockIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { documentsApi, versionsApi, usersApi, Document, Version } from '../lib/api';
import { toast } from 'react-hot-toast';
import TiptapEditor, { EditorRef } from '../Editor/TiptapEditor';

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

const DocumentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const editorRef = useRef<EditorRef>(null);
  
  const [document, setDocument] = useState<Document | null>(null);
  const [latestVersion, setLatestVersion] = useState<Version | null>(null);
  const [advisors, setAdvisors] = useState<Array<{ id: number; name: string }>>([]);
  const [content, setContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isEditing = Boolean(id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    loadAdvisors();
    if (isEditing) {
      loadDocument();
    } else {
      setInitialLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Warn user about unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadAdvisors = async () => {
    try {
      const advisorsList = await usersApi.getAdvisors();
      setAdvisors(advisorsList);
    } catch (error) {
      toast.error('Erro ao carregar orientadores');
    }
  };

  const loadDocument = async () => {
    if (!id) return;
    
    try {
      setInitialLoading(true);
      
      // Load document
      const doc = await documentsApi.getById(Number(id));
      setDocument(doc);
      
      // Set form values
      setValue('title', doc.title);
      setValue('description', doc.description || '');
      setValue('advisorId', doc.advisorId);
      
      // Load latest version
      const versions = await versionsApi.getByDocument(Number(id));
      if (versions.length > 0) {
        const latest = versions[0];
        setLatestVersion(latest);
        setContent(latest.content);
        
        // Set content in editor
        setTimeout(() => {
          editorRef.current?.setContent(latest.content);
        }, 100);
      }
    } catch (error) {
      toast.error('Erro ao carregar documento');
      navigate('/student/documents');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      if (isEditing && document) {
        // Update document info
        await documentsApi.update(document.id, {
          title: data.title,
          description: data.description,
          advisorId: data.advisorId,
        });
        
        // Create new version if content changed
        const currentContent = editorRef.current?.getContent() || '';
        if (currentContent !== latestVersion?.content && currentContent.trim()) {
          await versionsApi.create({
            documentId: document.id,
            content: currentContent,
            commitMessage: commitMessage || 'Atualização de conteúdo',
          });
        }
        
        toast.success('Documento atualizado com sucesso');
      } else {
        // Create new document
        const newDoc = await documentsApi.create({
          title: data.title,
          description: data.description,
          studentId: user!.id,
          advisorId: data.advisorId,
        });
        
        // Create initial version if there's content
        const currentContent = editorRef.current?.getContent() || '';
        if (currentContent.trim()) {
          await versionsApi.create({
            documentId: newDoc.id,
            content: currentContent,
            commitMessage: commitMessage || 'Versão inicial',
          });
        }
        
        toast.success('Documento criado com sucesso');
        navigate(`/student/documents/${newDoc.id}`);
        return;
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error(isEditing ? 'Erro ao atualizar documento' : 'Erro ao criar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    const formData = {
      title: watch('title'),
      description: watch('description'),
      advisorId: watch('advisorId'),
    };

    // Validate required fields
    if (!formData.title || !formData.advisorId) {
      toast.error('Preencha o título e selecione um orientador');
      return;
    }

    await onSubmit(formData);
  };

  const handleDelete = async () => {
    if (!document || !window.confirm('Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await documentsApi.delete(document.id);
      toast.success('Documento excluído com sucesso');
      navigate('/student/documents');
    } catch (error) {
      toast.error('Erro ao excluir documento');
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (hasUnsavedChanges && !window.confirm('Você tem alterações não salvas. Deseja sair mesmo assim?')) {
                return;
              }
              navigate(-1);
            }}
            className="btn btn-secondary"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Documento' : 'Novo Documento'}
            </h1>
            {document && (
              <p className="text-sm text-gray-500 mt-1">
                Última atualização: {new Date(document.updatedAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600 mr-4">
              • Alterações não salvas
            </span>
          )}
          
          <button
            onClick={handleSaveDraft}
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
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Document Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Informações do Documento</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Title */}
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
                onChange={() => setHasUnsavedChanges(true)}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
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
                onChange={() => setHasUnsavedChanges(true)}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Advisor */}
            <div>
              <label htmlFor="advisorId" className="block text-sm font-medium text-gray-700 mb-2">
                Orientador *
              </label>
              <select
                {...register('advisorId')}
                id="advisorId"
                className={`input-field ${errors.advisorId ? 'input-error' : ''}`}
                onChange={() => setHasUnsavedChanges(true)}
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

            {/* Version Message */}
            <div>
              <label htmlFor="commitMessage" className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem da Versão
              </label>
              <input
                type="text"
                id="commitMessage"
                value={commitMessage}
                onChange={(e) => {
                  setCommitMessage(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder={isEditing ? "Descreva as alterações realizadas" : "Versão inicial"}
                className="input-field"
              />
              <p className="mt-1 text-xs text-gray-500">
                Esta mensagem ajudará a identificar as mudanças nesta versão
              </p>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Conteúdo do Documento</h2>
            <p className="text-sm text-gray-500 mt-1">
              Use o editor abaixo para escrever o conteúdo do seu documento
            </p>
          </div>
          
          <div className="p-6">
            <TiptapEditor
              ref={editorRef}
              content={content}
              onChange={handleContentChange}
              placeholder="Comece a escrever seu documento aqui..."
              className="min-h-[500px]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges && !window.confirm('Você tem alterações não salvas. Deseja sair mesmo assim?')) {
                return;
              }
              navigate(-1);
            }}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Salvando...' : 'Criando...'}
              </div>
            ) : (
              <>
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                {isEditing ? 'Salvar Alterações' : 'Criar Documento'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentEditPage;