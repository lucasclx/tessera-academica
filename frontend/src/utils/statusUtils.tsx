// src/utils/statusUtils.ts - CORRIGIDO
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserIcon 
} from '@heroicons/react/24/outline';

export interface StatusInfo {
  label: string;
  color: string;
  icon: React.ElementType;
}

export const getDocumentStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    DRAFT: { 
      label: 'Rascunho', 
      color: 'status-draft', 
      icon: DocumentTextIcon 
    },
    SUBMITTED: { 
      label: 'Submetido', 
      color: 'status-submitted', 
      icon: ClockIcon 
    },
    REVISION: {
      label: 'Em Revisão',
      color: 'status-revision',
      icon: ExclamationTriangleIcon
    },
    REJECTED: {
      label: 'Rejeitado',
      color: 'status-revision',
      icon: ExclamationTriangleIcon
    },
    APPROVED: {
      label: 'Aprovado',
      color: 'status-approved',
      icon: CheckCircleIcon
    },
    FINALIZED: { 
      label: 'Finalizado', 
      color: 'status-finalized', 
      icon: CheckCircleIcon 
    },
  };
  
  return statusMap[status] || { 
    label: status, 
    color: 'status-draft', 
    icon: DocumentTextIcon 
  };
};

export const getUserStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    PENDING: { 
      label: 'Pendente', 
      color: 'status-submitted', 
      icon: ClockIcon 
    },
    APPROVED: { 
      label: 'Aprovado', 
      color: 'status-approved', 
      icon: CheckCircleIcon 
    },
    REJECTED: { 
      label: 'Rejeitado', 
      color: 'status-revision', 
      icon: ExclamationTriangleIcon 
    },
  };
  
  return statusMap[status] || { 
    label: status, 
    color: 'status-draft', 
    icon: UserIcon 
  };
};

export const getRegistrationStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    PENDING: { 
      label: 'Pendente', 
      color: 'status-submitted', 
      icon: ClockIcon 
    },
    APPROVED: { 
      label: 'Aprovada', 
      color: 'status-approved', 
      icon: CheckCircleIcon 
    },
    REJECTED: { 
      label: 'Rejeitada', 
      color: 'status-revision', 
      icon: ExclamationTriangleIcon 
    },
  };
  
  return statusMap[status] || { 
    label: status, 
    color: 'status-draft', 
    icon: ClockIcon 
  };
};