// src/utils/statusConfigs.js
import { 
  Edit, Send, Warning, CheckCircle, Info, 
  Person, Assignment, Schedule, School, SupervisorAccount 
} from '@mui/icons-material';

/**
 * Configurações centralizadas para todos os status e tipos do sistema
 * Evita duplicação de código entre componentes
 */

export const DOCUMENT_STATUS_CONFIG = {
  DRAFT: { 
    label: 'Rascunho', 
    color: 'default', 
    icon: Edit,
    description: 'Documento em elaboração'
  },
  SUBMITTED: { 
    label: 'Enviado', 
    color: 'primary', 
    icon: Send,
    description: 'Aguardando revisão do orientador'
  },
  REVISION: { 
    label: 'Em Revisão', 
    color: 'warning', 
    icon: Warning,
    description: 'Orientador solicitou alterações'
  },
  APPROVED: { 
    label: 'Aprovado', 
    color: 'success', 
    icon: CheckCircle,
    description: 'Documento aprovado pelo orientador'
  },
  FINALIZED: { 
    label: 'Finalizado', 
    color: 'info', 
    icon: Info,
    description: 'Processo concluído'
  }
};

export const USER_ROLE_CONFIG = {
  STUDENT: { 
    label: 'Estudante', 
    color: 'primary', 
    icon: School,
    description: 'Usuário estudante'
  },
  ADVISOR: { 
    label: 'Orientador', 
    color: 'secondary', 
    icon: SupervisorAccount,
    description: 'Professor orientador'
  },
  ADMIN: { 
    label: 'Administrador', 
    color: 'error', 
    icon: Person,
    description: 'Administrador do sistema'
  }
};

export const PRIORITY_CONFIG = {
  LOW: { 
    label: 'Baixa', 
    color: 'default', 
    icon: null,
    description: 'Prioridade baixa'
  },
  NORMAL: { 
    label: 'Normal', 
    color: 'primary', 
    icon: null,
    description: 'Prioridade normal'
  },
  HIGH: { 
    label: 'Alta', 
    color: 'warning', 
    icon: null,
    description: 'Prioridade alta'
  },
  URGENT: { 
    label: 'Urgente', 
    color: 'error', 
    icon: Schedule,
    description: 'Prioridade urgente'
  }
};

// Funções utilitárias para buscar configurações
export const getStatusConfig = (status, type = 'document') => {
  const configs = {
    document: DOCUMENT_STATUS_CONFIG,
    role: USER_ROLE_CONFIG,
    priority: PRIORITY_CONFIG
  };
  
  return configs[type]?.[status] || {
    label: status || 'Desconhecido',
    color: 'default',
    icon: null,
    description: ''
  };
};

export const getStatusOptions = (type = 'document', includeAll = true) => {
  const configs = {
    document: DOCUMENT_STATUS_CONFIG,
    role: USER_ROLE_CONFIG,
    priority: PRIORITY_CONFIG
  };
  
  const options = Object.entries(configs[type] || {}).map(([value, config]) => ({
    value,
    label: config.label,
    icon: config.icon,
    color: config.color
  }));
  
  if (includeAll) {
    options.unshift({ value: 'ALL', label: 'Todos', icon: null, color: 'default' });
  }
  
  return options;
};

export const getSortOptions = (type = 'document') => {
  const options = {
    document: [
      { value: 'updatedAt,desc', label: 'Atualização (Mais Recente)' },
      { value: 'updatedAt,asc', label: 'Atualização (Mais Antiga)' },
      { value: 'createdAt,desc', label: 'Criação (Mais Recente)' },
      { value: 'createdAt,asc', label: 'Criação (Mais Antiga)' },
      { value: 'title,asc', label: 'Título (A-Z)' },
      { value: 'title,desc', label: 'Título (Z-A)' }
    ],
    user: [
      { value: 'name,asc', label: 'Nome (A-Z)' },
      { value: 'name,desc', label: 'Nome (Z-A)' },
      { value: 'createdAt,desc', label: 'Cadastro (Mais Recente)' },
      { value: 'createdAt,asc', label: 'Cadastro (Mais Antigo)' }
    ],
    notification: [
      { value: 'createdAt,desc', label: 'Mais Recentes' },
      { value: 'createdAt,asc', label: 'Mais Antigas' },
      { value: 'priority,desc', label: 'Prioridade (Alta → Baixa)' },
      { value: 'priority,asc', label: 'Prioridade (Baixa → Alta)' }
    ]
  };
  
  return options[type] || options.document;
};