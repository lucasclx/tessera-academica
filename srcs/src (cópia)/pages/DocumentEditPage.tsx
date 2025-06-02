// src/pages/DocumentEditPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon as SaveIcon,
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
      // Para novos documentos, podemos definir hasUnsavedChanges para true se o título ou orientador padrão for alterado.
      // Por enquanto, focaremos na alteração de conteúdo para hasUnsavedChanges.
    }
  }, [id, isEditing]); // Adicionado isEditing como dependência

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
      const doc = await documentsApi.getById(Number(id));
      setDocument(doc);
      
      setValue('title', doc.title);
      setValue('description', doc.description || '');
      setValue('advisorId', doc.advisorId);
      
      const versions = await versionsApi.getByDocument(Number(id));
      if (versions.length > 0) {
        const latest = versions[0];
        setLatestVersion(latest);
        setContent(latest.content);
        
        setTimeout(() => {
          editorRef.current?.setContent(latest.content);
          setHasUnsavedChanges(false); // Resetar ao carregar conteúdo salvo
        }, 100);
      } else {
        setHasUnsavedChanges(false); // Sem versão, sem mudanças não salvas do editor inicialmente
      }
    } catch (error) {
      toast.error('Erro ao carregar documento');
      navigate('/student/documents');
    } finally {
      setInitialLoading(false);
    }
  };

  // Função para marcar que houve mudanças nos campos do formulário
  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

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
        
        // Só cria nova versão se o conteúdo mudou significativamente ou se há mensagem de commit
        const contentChanged = currentContent !== (latestVersion?.content || '');
        if (contentChanged || commitMessage.trim() !== '') {
          if (currentContent.trim() === "" && !latestVersion) {
             // Não criar versão se o conteúdo estiver vazio e não houver versão anterior (documento novo e vazio)
          } else {
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
          studentId: user!.id, // Garantir que user não é null
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
        setHasUnsavedChanges(false); // Resetar após criação bem-sucedida
        navigate(`/student/documents/${newDoc.id}/edit`); // Navegar para edição do novo doc
        return;
      }
      
      setHasUnsavedChanges(false); // Resetar após salvar
      setCommitMessage(''); // Limpar mensagem de commit
      loadDocument(); // Recarregar documento para pegar a última versão
    } catch (error: any) {
      toast.error(error.response?.data?.message || (isEditing ? 'Erro ao atualizar documento' : 'Erro ao criar documento'));
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    // setContent(newContent); // O editor já gerencia seu conteúdo interno
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    // Trigger form validation
    const isValid = await handleSubmit(onSubmit)(); 
    // Se handleSubmit não retornar um booleano ou promessa que indique validade,
    // você pode precisar verificar `formState.isValid` após `trigger()`
    // ou simplesmente chamar onSubmit diretamente e deixar que ele lide com os erros.
    // A chamada handleSubmit(onSubmit)() já executa a submissão se válido.
  };

  const handleDelete = async () => {
    if (!document || !window.confirm('Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      await documentsApi.delete(document.id);
      toast.success('Documento excluído com sucesso');
      navigate('/student/documents');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir documento');
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
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
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
              {isEditing ? `Editando: ${document?.title || 'Documento'}` : 'Novo Documento'}
            </h1>
            {document && (
              <p className="text-sm text-gray-500 mt-1">
                Última atualização: {new Date(document.updatedAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600 mr-4 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1 animate-pulse" />
              Alterações não salvas
            </span>
          )}
          
          <button
            onClick={handleSaveDraft} // Alterado para handleSaveDraft
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
                onChange={handleFormChange} // Adicionado para rastrear mudanças
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
                onChange={handleFormChange} // Adicionado
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
                onChange={handleFormChange} // Adicionado
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

            <div>
              <label htmlFor="commitMessage" className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem da Versão (opcional ao salvar)
              </label>
              <input
                type="text"
                id="commitMessage"
                value={commitMessage}
                onChange={(e) => {
                  setCommitMessage(e.target.value);
                  // Não necessariamente marca como "hasUnsavedChanges" só por isso,
                  // a menos que seja a única mudança. O conteúdo do editor é mais crítico.
                }}
                placeholder={isEditing && latestVersion ? "Descreva as alterações desta versão" : "Mensagem para a primeira versão"}
                className="input-field"
              />
              <p className="mt-1 text-xs text-gray-500">
                Opcional. Usado ao salvar alterações no conteúdo.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Conteúdo do Documento</h2>
            <p className="text-sm text-gray-500 mt-1">
              Use o editor abaixo para escrever o conteúdo do seu documento.
            </p>
          </div>
          
          <div className="p-6">
            <TiptapEditor
              ref={editorRef}
              content={content}
              onChange={handleContentChange}
              placeholder="Comece a escrever seu documento aqui..."
              // Aplicando classes para centralizar e definir largura máxima para o editor
              className="min-h-[500px] max-w-4xl mx-auto" 
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4">
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
            type="submit" // O botão principal agora é o "Salvar Alterações" / "Criar Documento"
            disabled={loading || !hasUnsavedChanges} // Desabilitar se não houver mudanças não salvas
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