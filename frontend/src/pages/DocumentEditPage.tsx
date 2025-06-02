// src/pages/DocumentEditPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon as SaveIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
// Caminhos de importação corrigidos:
import { useAuthStore } from '../store/authStore';
import { documentsApi, versionsApi, usersApi, Document, Version, Advisor, DocumentDetailDTO } from '../lib/api'; // Adicionado DocumentDetailDTO se for usado por getById
import { toast } from 'react-hot-toast';
import TiptapEditor, { EditorRef } from '../Editor/TiptapEditor'; // Corrigido caminho

const schema = yup.object({
  title: yup
    .string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .required('Título é obrigatório'),
  description: yup
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .nullable()
    .transform(value => (value === '' ? null : value)),
  advisorId: yup
    .number()
    .transform(value => (isNaN(value) || value === null || value === 0 ? undefined : value)) // Ajuste para tratar 0 ou null como undefined para 'required'
    .positive('Selecione um orientador')
    .required('Orientador é obrigatório'),
});

interface FormData {
  title: string;
  description?: string | null;
  advisorId: number;
}

const DocumentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isStudent } = useAuthStore(); // Adicionado isStudent para verificações
  const editorRef = useRef<EditorRef>(null);
  
  const [documentData, setDocumentData] = useState<Document | DocumentDetailDTO | null>(null);
  const [latestVersion, setLatestVersion] = useState<Version | null>(null);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
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
    reset,
    formState: { errors, isDirty: isFormDirty },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
        title: '',
        description: '',
        advisorId: undefined, // Usar undefined para que o placeholder do select apareça
    }
  });
  
  const currentTitle = watch('title');
  const currentDescription = watch('description');
  const currentAdvisorId = watch('advisorId');
  const currentCommitMessage = watch('commitMessage');


  useEffect(() => {
    if (isFormDirty || (isEditing && commitMessage !== '') || (editorRef.current && content !== editorRef.current.getContent())) {
        // A comparação do editor aqui é mais complexa devido à inicialização
        // Simplificando: qualquer alteração no form ou commit message marca como sujo
        // O onChange do Tiptap já chama setHasUnsavedChanges(true)
    }
  }, [isFormDirty, commitMessage, content, isEditing, currentTitle, currentDescription, currentAdvisorId]);


  const loadAdvisors = useCallback(async () => {
    try {
      const advisorsList = await usersApi.getAdvisors();
      setAdvisors(advisorsList);
    } catch (error) {
      toast.error('Erro ao carregar orientadores.');
    }
  }, []);

  const loadDocumentData = useCallback(async () => {
    if (!id) return;
    
    setInitialLoading(true);
    try {
      const doc = await documentsApi.getById(Number(id)); // API retorna DocumentDetailDTO
      setDocumentData(doc);
      
      reset({
        title: doc.title,
        description: doc.description || '',
        advisorId: doc.advisorId,
      });
      
      const versions = await versionsApi.getByDocument(Number(id));
      if (versions.length > 0) {
        const latest = versions[0];
        setLatestVersion(latest);
        setContent(latest.content); 
      } else {
        setContent('');
      }
      setCommitMessage('');
      setHasUnsavedChanges(false); 
    } catch (error) {
      toast.error('Erro ao carregar documento.');
      navigate(isStudent() ? '/student/documents' : '/advisor/documents'); // Redireciona com base no papel
    } finally {
      setInitialLoading(false);
    }
  }, [id, navigate, reset, isStudent]);

  useEffect(() => {
    loadAdvisors();
    if (isEditing) {
      loadDocumentData();
    } else {
      setInitialLoading(false);
      setContent(''); 
      reset({ title: '', description: '', advisorId: undefined });
      setHasUnsavedChanges(false);
    }
  }, [isEditing, loadDocumentData, loadAdvisors, reset]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleNavigateBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Você tem alterações não salvas. Deseja descartá-las e voltar?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };


  const onSubmitHandler = async (data: FormData) => {
    setLoading(true);
    const currentEditorContent = editorRef.current?.getContent() || '';
    // Se estiver editando e não houver mensagem de commit, usa um placeholder. Se for novo, usa "Versão inicial".
    const finalCommitMessage = commitMessage.trim() || 
                               (isEditing ? (latestVersion?.versionNumber ? `Atualização da v${latestVersion.versionNumber}` : 'Atualização de conteúdo') 
                                          : 'Versão inicial');

    try {
      if (isEditing && documentData) {
        await documentsApi.update(documentData.id, {
          title: data.title,
          description: data.description || undefined, 
          advisorId: data.advisorId,
        });
        
        const contentChanged = currentEditorContent !== (latestVersion?.content || '');
        const commitMessageProvided = commitMessage.trim() !== '';

        if (contentChanged || commitMessageProvided) {
            await versionsApi.create({
                documentId: documentData.id,
                content: currentEditorContent,
                commitMessage: finalCommitMessage,
            });
        }
        toast.success('Documento atualizado com sucesso!');
        // Recarregar os dados para refletir as mudanças e resetar 'dirty' states
        // Isso também obterá a nova 'latestVersion' e 'content'
        await loadDocumentData(); 
        // setHasUnsavedChanges(false); // loadDocumentData já faz isso
        // setCommitMessage(''); // loadDocumentData já faz isso
      } else {
        if (!user?.id) {
            toast.error("Usuário não autenticado.");
            setLoading(false);
            return;
        }
        const newDocPayload = {
          title: data.title,
          description: data.description || undefined,
          studentId: user.id, 
          advisorId: data.advisorId,
        };
        const newDoc = await documentsApi.create(newDocPayload);
        
        await versionsApi.create({
          documentId: newDoc.id,
          content: currentEditorContent,
          commitMessage: finalCommitMessage,
        });
        
        toast.success('Documento criado com sucesso!');
        // Após criar, redireciona para a página de edição do novo documento,
        // permitindo que o usuário continue editando e criando mais versões.
        navigate(`/student/documents/${newDoc.id}/edit`, { replace: true }); 
        // Chamada explícita para carregar os dados do novo documento após o redirecionamento
        // (ou a página de edição pode fazer isso em seu próprio useEffect [id])
      }
    } catch (error) {
      // Erro já tratado pelo api.tsx
    } finally {
      setLoading(false);
    }
  };

  const handleActualContentChange = () => {
    // Esta função é chamada pelo onChange do TiptapEditor
    // Comparamos o conteúdo atual do editor com o da última versão salva (ou conteúdo inicial)
    const editorHTML = editorRef.current?.getHTML() || '';
    const baseContent = latestVersion?.content || (isEditing ? '' : content); // `content` aqui é o estado inicial para novo doc
    if (editorHTML !== baseContent) {
        setHasUnsavedChanges(true);
    }
  };
  
  const handleFieldChange = () => {
      setHasUnsavedChanges(true);
  }
  
  const handleCommitMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommitMessage(e.target.value);
    setHasUnsavedChanges(true); // Qualquer alteração na mensagem de commit marca como não salvo
  };

  if (initialLoading && isEditing) { // Só mostra loading se estiver editando e carregando
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-4 text-gray-700">Carregando documento...</span>
      </div>
    );
  }
  
  // Lógica de permissão de edição:
  // Apenas estudantes podem editar. Se for um documento existente, deve estar em DRAFT.
  // Para novo documento (isEditing = false), sempre pode editar.
  const canEditThisDocument = isStudent() && (isEditing ? documentData?.status === 'DRAFT' : true);

  if (isEditing && !initialLoading && !canEditThisDocument) {
    return (
        <div className="max-w-6xl mx-auto space-y-6 p-4 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-gray-800 mt-4">Acesso Negado</h1>
            <p className="text-gray-600">Você não tem permissão para editar este documento ou ele não está em um estado editável (DRAFT).</p>
            <button onClick={() => navigate(-1)} className="btn btn-primary mt-6">
                Voltar
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleNavigateBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            title="Voltar"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEditing ? 'Editar Documento' : 'Novo Documento'}
            </h1>
            {isEditing && documentData && (
              <p className="text-sm text-gray-500">
                Status: <span className={`font-medium ${
                    documentData.status === 'DRAFT' ? 'text-yellow-600' : 
                    documentData.status === 'SUBMITTED' ? 'text-blue-600' :
                    documentData.status === 'APPROVED' ? 'text-green-600' :
                    documentData.status === 'REVISION' ? 'text-orange-600' :
                    'text-gray-600'
                }`}>{documentData.status}</span>
                {latestVersion && ` (v${latestVersion.versionNumber})`}
                {' - '}
                Última atualização: {new Date(documentData.updatedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <span className="text-sm text-yellow-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1"/> Alterações não salvas
            </span>
          )}
          {isEditing && documentData?.status === 'DRAFT' && ( // Só permite excluir se for DRAFT
            <button
              type="button"
              onClick={async () => {
                if (documentData && window.confirm('Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.')) {
                    try {
                        setLoading(true);
                        await documentsApi.delete(documentData.id);
                        toast.success('Documento excluído com sucesso');
                        navigate('/student/documents');
                    } catch (error) { /* tratado em api.tsx */ } finally {
                        setLoading(false);
                    }
                }
              }}
              disabled={loading}
              className="btn btn-danger"
            >
              <TrashIcon className="h-5 w-5 mr-1.5" />
              Excluir
            </button>
          )}
           <button
            type="submit" 
            form="documentForm" 
            disabled={loading || !hasUnsavedChanges}
            className="btn btn-primary"
          >
            <SaveIcon className="h-5 w-5 mr-1.5" />
            {loading ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Documento')}
          </button>
        </div>
      </div>

      <form id="documentForm" onSubmit={handleSubmit(onSubmitHandler)} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Informações do Documento</h2>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900 mb-1">
                Título do Documento *
              </label>
              <input
                {...register('title')}
                type="text"
                id="title"
                placeholder="Ex: Proposta de TCC sobre Inteligência Artificial na Educação"
                className={`input-field ${errors.title ? 'input-error' : ''}`}
                onChangeCapture={handleFieldChange}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900 mb-1">
                Descrição (Opcional)
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={3}
                placeholder="Um breve resumo ou subtítulo para o seu documento..."
                className={`input-field ${errors.description ? 'input-error' : ''}`}
                onChangeCapture={handleFieldChange}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="advisorId" className="block text-sm font-medium leading-6 text-gray-900 mb-1">
                Orientador Principal *
              </label>
              <select
                {...register('advisorId')}
                id="advisorId"
                className={`input-field ${errors.advisorId ? 'input-error' : ''}`}
                onChangeCapture={handleFieldChange}
              >
                <option value="">Selecione um orientador...</option>
                {advisors.map((advisor) => (
                  <option key={advisor.id} value={advisor.id}>
                    {advisor.name}
                  </option>
                ))}
              </select>
              {errors.advisorId && <p className="mt-1 text-sm text-red-600">{errors.advisorId.message}</p>}
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="commitMessage" className="block text-sm font-medium leading-6 text-gray-900 mb-1">
                Mensagem da Versão (Opcional ao salvar)
              </label>
              <input
                type="text"
                id="commitMessage"
                value={commitMessage}
                onChange={handleCommitMessageInputChange}
                placeholder={isEditing && latestVersion ? `Alterações desde v${latestVersion.versionNumber}` : "Ex: Versão inicial da proposta"}
                className="input-field"
              />
              <p className="mt-1 text-xs text-gray-500">
                Descreva brevemente as alterações feitas nesta versão.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Conteúdo do Documento</h2>
            <p className="text-sm text-gray-500 mt-1">
             {isEditing && latestVersion ? `Editando conteúdo da v${latestVersion.versionNumber}.` : 'Escreva o conteúdo inicial do seu documento.'}
            </p>
          </div>
          <div className="p-1 sm:p-2 md:p-4">
            <TiptapEditor
              ref={editorRef}
              content={content}
              onChange={handleActualContentChange} // Alterado para handleActualContentChange
              placeholder="Comece a escrever seu documento aqui..."
              editorClassName="min-h-[400px] md:min-h-[600px]" // Classe específica para o editor
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default DocumentEditPage;