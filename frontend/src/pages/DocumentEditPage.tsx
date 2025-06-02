// src/pages/DocumentEditPage.tsx
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
import { documentsApi, versionsApi, usersApi, DocumentDetailDTO, Version, UserSelection } from '../lib/api'; 
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

// Componente do Formulário de Documento
const DocumentForm: React.FC<{
  register: any;
  errors: any;
  advisors: UserSelection[]; 
  onFieldChange: () => void;
  disabled?: boolean;
}> = ({ register, errors, advisors, onFieldChange, disabled = false }) => {
  console.log('📋 DocumentForm renderizando', { advisorsCount: advisors.length, disabled });
  
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
};

// Componente do Editor de Documento
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
}) => {
  console.log('🎯 DocumentEditor renderizando', { 
    initialContent: initialContent?.substring(0, 100) + '...', 
    disabled, 
    isEditing,
    hasLatestVersion: !!latestVersion 
  });

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
        
        {/* Debug container - remover em produção */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🔍 DEBUG: Container do editor renderizado | 
              Conteúdo inicial: {initialContent ? 'Presente' : 'Vazio'} | 
              Desabilitado: {disabled ? 'Sim' : 'Não'}
            </p>
          </div>
        )}
        
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
};

// Componente de Indicador de Alterações Não Salvas
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
  const { confirm, confirmDeletion } = useConfirmDialog(); 
  const editorRef = useRef<EditorRef>(null);
  
  const [latestVersion, setLatestVersion] = useState<Version | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorInitialized, setEditorInitialized] = useState(false);

  const isEditing = Boolean(id); 

  console.log('📄 DocumentEditPage renderizando', { id, isEditing, userId: user?.id });

  // Carregar orientadores
  const { data: advisorsData, loading: advisorsLoading } = useApiData<UserSelection[]>( 
    '/users/advisors', 
    [], 
    { errorMessage: 'Erro ao carregar orientadores' }
  );

  // Carregar documento se estiver editando
  const { data: document, loading: documentLoading, refetch: refetchDocument } = useApiData<DocumentDetailDTO>( 
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

  // Carregar última versão do documento
  const loadLatestVersion = async () => {
    if (!id) return; 
    
    try {
      console.log('📥 Carregando versões do documento', id);
      const versions = await versionsApi.getByDocument(Number(id)); 
      if (versions.length > 0) {
        const latest = versions[0];
        console.log('📝 Última versão encontrada:', latest.versionNumber);
        setLatestVersion(latest);
        setEditorContent(latest.content); 
        
        // Aguardar um pouco para garantir que o editor está pronto
        const setContentWithDelay = () => {
          if (editorRef.current) {
            try {
              console.log('✏️ Definindo conteúdo no editor');
              editorRef.current.setContent(latest.content, 'api');
              setHasUnsavedChanges(false);
              setEditorInitialized(true);
            } catch (error) {
              console.warn('⚠️ Erro ao definir conteúdo do editor:', error);
              setTimeout(setContentWithDelay, 200);
            }
          } else {
            setTimeout(setContentWithDelay, 100);
          }
        };
        
        setTimeout(setContentWithDelay, 150);
      } else {
        console.log('📝 Nenhuma versão encontrada, editor vazio');
        setEditorContent(''); 
        setLatestVersion(null);
        setHasUnsavedChanges(false);
        setEditorInitialized(true);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar versões:', error);
      toast.error('Erro ao carregar versões do documento');
      setEditorInitialized(true);
    }
  };
  
  // Sincronizar dados do documento com o formulário
  useEffect(() => {
    if (document && isEditing) {
      console.log('🔄 Sincronizando dados do documento com formulário');
      reset({ 
        title: document.title,
        description: document.description || '',
        advisorId: document.advisorId,
      });
      loadLatestVersion();
    } else if (!isEditing) { 
      console.log('🆕 Novo documento - limpando formulário');
      reset(); 
      setEditorContent('');
      setLatestVersion(null);
      setHasUnsavedChanges(false);
      setEditorInitialized(true);
      
      // Limpar editor para novos documentos
      setTimeout(() => {
        if (editorRef.current) {
          try {
            editorRef.current.setContent('', 'api');
          } catch (error) {
            console.warn('⚠️ Erro ao limpar editor:', error);
          }
        }
      }, 100);
    }
  }, [document, isEditing, reset]); 

  // Aviso antes de sair com alterações não salvas
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

  const handleFormChange = () => {
    console.log('📝 Formulário alterado');
    setHasUnsavedChanges(true);
  };
  
  const handleEditorContentChange = (newContent: string) => {
    console.log('✏️ Conteúdo do editor alterado:', newContent.substring(0, 100) + '...');
    
    if (!editorInitialized) return;
    
    const baseContentToCompare = latestVersion?.content || (isEditing ? '' : editorContent); 
    if (newContent !== baseContentToCompare) {
      setHasUnsavedChanges(true);
    }
  };

  // Submeter/Salvar documento
  const onSubmitDocument = async (data: FormData) => {
    console.log('💾 Salvando documento:', data);
    setLoading(true);
    
    let currentEditorHTML = '';
    try {
      currentEditorHTML = editorRef.current?.getContent() || '';
    } catch (error) {
      console.warn('⚠️ Erro ao obter conteúdo do editor:', error);
      currentEditorHTML = editorContent;
    }
    
    try {
      let docIdToUse = document?.id;

      if (isEditing && docIdToUse) { 
        console.log('✏️ Atualizando documento existente:', docIdToUse);
        
        const formChanged = Object.keys(dirtyFields).length > 0;
        if (formChanged) {
          await documentsApi.update(docIdToUse, {
            title: data.title,
            description: data.description,
            advisorId: data.advisorId,
          }); 
        }

        const editorContentActuallyChanged = currentEditorHTML !== (latestVersion?.content || '');
        if (editorContentActuallyChanged || commitMessage.trim() !== '') {
          if (currentEditorHTML.trim() !== "" || latestVersion) { 
            await versionsApi.create({
              documentId: docIdToUse,
              content: currentEditorHTML,
              commitMessage: commitMessage.trim() || (editorContentActuallyChanged ? 'Atualização de conteúdo' : 'Alterações nos metadados'),
            }); 
          }
        }
        toast.success('Documento atualizado com sucesso!');
      } else { 
        console.log('🆕 Criando novo documento');
        
        const newDocPayload = {
            title: data.title,
            description: data.description,
            studentId: user!.id, 
            advisorId: data.advisorId,
        };
        const newDoc = await documentsApi.create(newDocPayload); 
        docIdToUse = newDoc.id; 
        
        if (currentEditorHTML.trim() !== "") {
          await versionsApi.create({
            documentId: docIdToUse,
            content: currentEditorHTML,
            commitMessage: commitMessage.trim() || 'Versão inicial',
          }); 
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
      console.error('❌ Erro ao salvar documento:', error);
      toast.error(error.response?.data?.message || (isEditing ? 'Erro ao atualizar documento' : 'Erro ao criar documento'));
    } finally {
      setLoading(false);
    }