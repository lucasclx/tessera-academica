export const DOCUMENT_STATUSES = {
  DRAFT: { label: 'Rascunho', color: 'status-draft' },
  SUBMITTED: { label: 'Submetido', color: 'status-submitted' },
  REVISION: { label: 'Em Revisão', color: 'status-revision' },
  APPROVED: { label: 'Aprovado', color: 'status-approved' },
  FINALIZED: { label: 'Finalizado', color: 'status-finalized' },
} as const;

export const USER_STATUSES = {
  PENDING: { label: 'Pendente', color: 'status-submitted' },
  APPROVED: { label: 'Aprovado', color: 'status-approved' },
  REJECTED: { label: 'Rejeitado', color: 'status-revision' },
} as const;

export const COLLABORATOR_ROLES = [
  { value: 'PRIMARY_STUDENT', label: 'Estudante Principal', type: 'STUDENT' },
  { value: 'SECONDARY_STUDENT', label: 'Estudante Colaborador', type: 'STUDENT' },
  { value: 'CO_STUDENT', label: 'Co-autor', type: 'STUDENT' },
  { value: 'PRIMARY_ADVISOR', label: 'Orientador Principal', type: 'ADVISOR' },
  { value: 'SECONDARY_ADVISOR', label: 'Orientador Colaborador', type: 'ADVISOR' },
  { value: 'CO_ADVISOR', label: 'Co-orientador', type: 'ADVISOR' },
  { value: 'EXTERNAL_ADVISOR', label: 'Orientador Externo', type: 'ADVISOR' },
  { value: 'EXAMINER', label: 'Banca Examinadora', type: 'OTHER' },
  { value: 'REVIEWER', label: 'Revisor', type: 'OTHER' },
  { value: 'OBSERVER', label: 'Observador', type: 'OTHER' },
] as const;

export const COLLABORATOR_PERMISSIONS = [
  { value: 'READ_ONLY', label: 'Apenas Leitura' },
  { value: 'READ_COMMENT', label: 'Leitura e Comentários' },
  { value: 'READ_WRITE', label: 'Leitura e Escrita' },
  { value: 'FULL_ACCESS', label: 'Acesso Completo' },
] as const;

export const PAGE_SIZES = [5, 10, 20, 50] as const;

export const NOTIFICATION_TYPES = {
  DOCUMENT_CREATED: { icon: '📄', label: 'Documento Criado' },
  DOCUMENT_SUBMITTED: { icon: '📤', label: 'Documento Submetido' },
  DOCUMENT_APPROVED: { icon: '✅', label: 'Documento Aprovado' },
  DOCUMENT_REJECTED: { icon: '❌', label: 'Documento Rejeitado' },
  DOCUMENT_REVISION_REQUESTED: { icon: '🔄', label: 'Revisão Solicitada' },
  DOCUMENT_FINALIZED: { icon: '🎯', label: 'Documento Finalizado' },
  VERSION_CREATED: { icon: '📝', label: 'Nova Versão' },
  VERSION_UPDATED: { icon: '✏️', label: 'Versão Atualizada' },
  COMMENT_ADDED: { icon: '💬', label: 'Novo Comentário' },
  COMMENT_REPLIED: { icon: '↩️', label: 'Resposta ao Comentário' },
  COMMENT_RESOLVED: { icon: '✔️', label: 'Comentário Resolvido' },
  USER_REGISTERED: { icon: '👤', label: 'Usuário Registrado' },
  USER_APPROVED: { icon: '✅', label: 'Usuário Aprovado' },
  USER_REJECTED: { icon: '❌', label: 'Usuário Rejeitado' },
  DEADLINE_APPROACHING: { icon: '⏰', label: 'Prazo Próximo' },
  DEADLINE_OVERDUE: { icon: '🚨', label: 'Prazo Vencido' },
  TASK_ASSIGNED: { icon: '📋', label: 'Tarefa Atribuída' },
  COLLABORATOR_ADDED: { icon: '👥', label: 'Colaborador Adicionado' },
  COLLABORATOR_REMOVED: { icon: '👤➖', label: 'Colaborador Removido' },
  COLLABORATOR_ROLE_CHANGED: { icon: '🧑‍🔧', label: 'Papel Alterado' },
} as const