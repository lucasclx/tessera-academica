// pages/index.js - PÁGINAS CONSOLIDADAS E OTIMIZADAS
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Visibility, Edit, Delete, CheckCircle, Cancel, 
  Person, Email, School 
} from '@mui/icons-material';
import { documentService, adminService } from '../services';
import { createPage, ConfirmDialog, handleAsyncAction } from '../utils';
import { AuthContext } from '../context/AuthContext';

// ============================================================================
// CONFIGURAÇÕES DAS PÁGINAS
// ============================================================================

const PAGE_CONFIGS = {
  studentDocuments: {
    title: 'Meus Documentos',
    service: documentService,
    fetchFunctionName: 'getMyDocumentsPaged',
    createPath: '/documents/new',
    tableType: 'studentDocuments',
    rowActions: (row, { navigate, reload }) => [
      {
        label: 'Visualizar',
        icon: <Visibility />,
        onClick: () => navigate(`/documents/${row.id}`)
      },
      {
        label: 'Editar',
        icon: <Edit />,
        onClick: () => navigate(`/documents/${row.id}/edit`),
        disabled: !row.canEdit
      },
      {
        label: 'Excluir',
        icon: <Delete />,
        onClick: () => handleDeleteDocument(row.id, reload),
        disabled: row.status === 'FINALIZED'
      }
    ]
  },

  advisorDocuments: {
    title: 'Documentos Orientados',
    service: documentService,
    fetchFunctionName: 'getMyAdvisingDocumentsPaged',
    createPath: null,
    tableType: 'advisorDocuments',
    rowActions: (row, { navigate, reload }) => [
      {
        label: 'Revisar',
        icon: <Visibility />,
        onClick: () => navigate(`/documents/${row.id}/review`)
      },
      {
        label: 'Aprovar',
        icon: <CheckCircle />,
        onClick: () => handleApproveDocument(row.id, reload),
        disabled: row.status !== 'SUBMITTED'
      },
      {
        label: 'Solicitar Revisão',
        icon: <Cancel />,
        onClick: () => handleRequestRevision(row.id, reload),
        disabled: row.status !== 'SUBMITTED'
      }
    ]
  },

  pendingRegistrations: {
    title: 'Registros Pendentes',
    service: adminService,
    fetchFunctionName: 'getPendingRegistrations',
    createPath: null,
    tableType: 'pendingRegistrations',
    rowActions: (row, { navigate, reload }) => [
      {
        label: 'Visualizar Perfil',
        icon: <Person />,
        onClick: () => navigate(`/admin/users/${row.user?.id}`)
      },
      {
        label: 'Aprovar',
        icon: <CheckCircle />,
        onClick: () => handleApproveRegistration(row.id, reload)
      },
      {
        label: 'Rejeitar',
        icon: <Cancel />,
        onClick: () => handleRejectRegistration(row.id, reload)
      },
      {
        label: 'Enviar Email',
        icon: <Email />,
        onClick: () => window.open(`mailto:${row.user?.email}`)
      }
    ]
  }
};

// ============================================================================
// HANDLERS DE AÇÕES
// ============================================================================

const handleDeleteDocument = async (documentId, reload) => {
  await handleAsyncAction(
    () => documentService.delete(documentId),
    {
      successMessage: 'Documento excluído com sucesso!',
      onSuccess: reload
    }
  );
};

const handleApproveDocument = async (documentId, reload) => {
  await handleAsyncAction(
    () => documentService.changeStatus(documentId, 'APPROVED'),
    {
      successMessage: 'Documento aprovado com sucesso!',
      onSuccess: reload
    }
  );
};

const handleRequestRevision = async (documentId, reload) => {
  const reason = prompt('Motivo da revisão (opcional):');
  await handleAsyncAction(
    () => documentService.changeStatus(documentId, 'REVISION', reason),
    {
      successMessage: 'Revisão solicitada com sucesso!',
      onSuccess: reload
    }
  );
};

const handleApproveRegistration = async (registrationId, reload) => {
  const notes = prompt('Observações (opcional):');
  await handleAsyncAction(
    () => adminService.approveRegistration(registrationId, notes),
    {
      successMessage: 'Registro aprovado com sucesso!',
      onSuccess: reload
    }
  );
};

const handleRejectRegistration = async (registrationId, reload) => {
  const reason = prompt('Motivo da rejeição:');
  if (!reason?.trim()) return;
  
  await handleAsyncAction(
    () => adminService.rejectRegistration(registrationId, reason),
    {
      successMessage: 'Registro rejeitado com sucesso!',
      onSuccess: reload
    }
  );
};

// ============================================================================
// COMPONENTES DE PÁGINA
// ============================================================================

// Documentos do Estudante
export const MyDocuments = () => {
  const PageComponent = createPage(PAGE_CONFIGS.studentDocuments);
  return <PageComponent />;
};

// Documentos do Orientador
export const AdvisingDocuments = () => {
  const PageComponent = createPage(PAGE_CONFIGS.advisorDocuments);
  return <PageComponent />;
};

// Registros Pendentes (Admin)
export const PendingRegistrations = () => {
  const PageComponent = createPage(PAGE_CONFIGS.pendingRegistrations);
  return <PageComponent />;
};

// Orientandos do Professor
export const MyStudents = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const studentsConfig = {
    title: 'Meus Orientandos',
    service: { 
      getStudentsPaged: async (page = 0, size = 10, search = '') => {
        // Simular API call - substituir pela implementação real
        return {
          content: [],
          totalElements: 0,
          totalPages: 0
        };
      }
    },
    fetchFunctionName: 'getStudentsPaged',
    createPath: null,
    tableType: 'students',
    columns: [
      {
        id: 'name',
        label: 'Nome',
        render: (student) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
              {student.name?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            <Typography variant="subtitle2">{student.name || 'Nome não disponível'}</Typography>
          </Box>
        )
      },
      { id: 'email', label: 'Email', render: (student) => student.email || 'Email não disponível' },
      { id: 'institution', label: 'Instituição', render: (student) => student.institution || 'Não informado' },
      { 
        id: 'status', 
        label: 'Status', 
        render: (student) => (
          <StatusChip 
            status={student.isActive ? 'ACTIVE' : 'INACTIVE'} 
            type="user" 
          />
        )
      }
    ],
    rowActions: (student, { navigate }) => [
      {
        label: 'Ver Documentos',
        icon: <School />,
        onClick: () => navigate(`/advisor/students/${student.id}/documents`)
      },
      {
        label: 'Enviar Email',
        icon: <Email />,
        onClick: () => window.open(`mailto:${student.email}`)
      }
    ]
  };

  const PageComponent = createPage(studentsConfig);
  return <PageComponent />;
};

// ============================================================================
// COMPONENTE DE REVISÃO UNIFICADO
// ============================================================================

export const DocumentReview = ({ mode = 'advisor' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadDocumentData();
  }, [id]);

  const loadDocumentData = async () => {
    try {
      setLoading(true);
      const [docData, versionsData] = await Promise.all([
        documentService.get(id),
        versionService.getVersionsByDocument(id)
      ]);
      
      setDocument(docData);
      setVersions(versionsData || []);
      
      if (versionsData?.length > 0) {
        const latestVersion = versionsData[0];
        setSelectedVersionId(latestVersion.id.toString());
        const commentsData = await commentService.getCommentsByVersion(latestVersion.id);
        setComments(commentsData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionChange = async (versionId) => {
    setSelectedVersionId(versionId);
    try {
      const commentsData = await commentService.getCommentsByVersion(versionId);
      setComments(commentsData || []);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedVersionId) return;
    
    await handleAsyncAction(
      () => commentService.create({
        versionId: selectedVersionId,
        content: newComment.trim()
      }),
      {
        successMessage: 'Comentário adicionado!',
        onSuccess: () => {
          setNewComment('');
          handleVersionChange(selectedVersionId);
        }
      }
    );
  };

  const handleStatusChange = async (newStatus, reason = '') => {
    await handleAsyncAction(
      () => documentService.changeStatus(id, newStatus, reason),
      {
        successMessage: `Documento ${newStatus === 'APPROVED' ? 'aprovado' : 'enviado para revisão'}!`,
        onSuccess: loadDocumentData
      }
    );
  };

  if (loading) return <Typography>Carregando...</Typography>;
  if (!document) return <Typography>Documento não encontrado</Typography>;

  const selectedVersion = versions.find(v => v.id.toString() === selectedVersionId);
  const canTakeActions = mode === 'advisor' && currentUser?.roles?.includes('ROLE_ADVISOR');

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title={`Revisão: ${document.title}`}
        backButton
        actions={canTakeActions ? [
          {
            label: 'Aprovar',
            icon: <CheckCircle />,
            onClick: () => handleStatusChange('APPROVED'),
            color: 'success',
            disabled: document.status !== 'SUBMITTED'
          },
          {
            label: 'Solicitar Revisão',
            icon: <Cancel />,
            onClick: () => {
              const reason = prompt('Motivo da revisão:');
              if (reason) handleStatusChange('REVISION', reason);
            },
            color: 'warning',
            disabled: document.status !== 'SUBMITTED'
          }
        ] : []}
      />

      <Grid container spacing={3}>
        {/* Conteúdo Principal */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Conteúdo da Versão</Typography>
              {versions.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Versão</InputLabel>
                  <Select
                    value={selectedVersionId}
                    onChange={(e) => handleVersionChange(e.target.value)}
                    label="Versão"
                  >
                    {versions.map(v => (
                      <MenuItem key={v.id} value={v.id.toString()}>
                        v{v.versionNumber} - {v.commitMessage || 'Sem mensagem'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ 
              maxHeight: '60vh', 
              overflowY: 'auto', 
              p: 2, 
              border: '1px solid #eee', 
              borderRadius: 1,
              bgcolor: '#f9f9f9'
            }}>
              {selectedVersion?.content ? (
                <div dangerouslySetInnerHTML={{ 
                  __html: selectedVersion.content.replace(/\n/g, '<br>') 
                }} />
              ) : (
                <Typography color="textSecondary">
                  Conteúdo não disponível
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Informações do Documento */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Informações</Typography>
            <Typography variant="body2"><strong>Estudante:</strong> {document.studentName}</Typography>
            <Typography variant="body2"><strong>Orientador:</strong> {document.advisorName}</Typography>
            <Typography variant="body2">
              <strong>Status:</strong> <StatusChip status={document.status} size="small" />
            </Typography>
            <Typography variant="body2">
              <strong>Última atualização:</strong> {new Date(document.updatedAt).toLocaleDateString('pt-BR')}
            </Typography>
          </Paper>

          {/* Comentários */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Comentários da Versão {selectedVersion?.versionNumber}
            </Typography>
            
            {/* Adicionar comentário */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Adicionar comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="small"
              >
                Adicionar Comentário
              </Button>
            </Box>

            {/* Lista de comentários */}
            <Box sx={{ maxHeight: '40vh', overflowY: 'auto' }}>
              {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum comentário para esta versão.
                </Typography>
              ) : (
                comments.map(comment => (
                  <Box key={comment.id} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2">{comment.userName}</Typography>
                    <Typography variant="body2">{comment.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(comment.createdAt).toLocaleString('pt-BR')}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

// Alias para manter compatibilidade
export const DocumentView = () => <DocumentReview mode="student" />;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  MyDocuments,
  AdvisingDocuments,
  PendingRegistrations,
  MyStudents,
  DocumentReview,
  DocumentView
};