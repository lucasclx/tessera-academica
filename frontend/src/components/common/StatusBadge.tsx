import React from 'react';
import { DocumentTextIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface StatusBadgeProps {
  status: string;
  type?: 'document' | 'user' | 'registration';
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'document', showIcon = false }) => {
  const configs = {
    document: {
      DRAFT: { label: 'Rascunho', className: 'status-draft', icon: DocumentTextIcon },
      SUBMITTED: { label: 'Submetido', className: 'status-submitted', icon: ClockIcon },
      REVISION: { label: 'Em Revisão', className: 'status-revision', icon: ExclamationTriangleIcon },
      APPROVED: { label: 'Aprovado', className: 'status-approved', icon: CheckCircleIcon },
      FINALIZED: { label: 'Finalizado', className: 'status-finalized', icon: CheckCircleIcon },
    },
    user: {
      PENDING: { label: 'Pendente', className: 'status-submitted', icon: ClockIcon },
      APPROVED: { label: 'Aprovado', className: 'status-approved', icon: CheckCircleIcon },
      REJECTED: { label: 'Rejeitado', className: 'status-revision', icon: ExclamationTriangleIcon },
    },
    registration: {
      PENDING: { label: 'Pendente', className: 'status-submitted', icon: ClockIcon },
      APPROVED: { label: 'Aprovada', className: 'status-approved', icon: CheckCircleIcon },
      REJECTED: { label: 'Rejeitada', className: 'status-revision', icon: ExclamationTriangleIcon },
    }
  };

  const config = configs[type]?.[status] || { 
    label: status, 
    className: 'status-draft', 
    icon: DocumentTextIcon 
  };

  const Icon = config.icon;

  return (
    <span className={`status-badge ${config.className}`}>
      {showIcon && <Icon className="h-3 w-3 mr-1 inline" />}
      {config.label}
    </span>
  );
};

export default StatusBadge;
