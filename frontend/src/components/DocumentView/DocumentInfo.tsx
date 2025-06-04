import React from 'react';
import {
  InformationCircleIcon,
  ClockIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from '../common/StatusBadge';
import CollapsibleSection from '../common/CollapsibleSection';
import { formatDateTime } from '../../utils/dateUtils';
import { DocumentDetailDTO } from '../../lib/api';

interface DocumentInfoProps {
  document: DocumentDetailDTO;
}

const InfoSection: React.FC<{ title: string; icon: React.ElementType; items: { label: string; value: any }[] }> = ({ title, icon: Icon, items }) => (
  <CollapsibleSection
    title={<span className="flex items-center"><Icon className="h-5 w-5 mr-2 text-primary-600" />{title}</span>}
    defaultOpen
  >
    <dl className="space-y-2 text-sm">
      {items.map((item, index) => (
        <div key={index}>
          <dt className="font-medium text-gray-500">{item.label}</dt>
          <dd className="text-gray-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  </CollapsibleSection>
);

const DocumentInfo: React.FC<DocumentInfoProps> = ({ document }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      <InfoSection
        title="Informações Gerais"
        icon={InformationCircleIcon}
        items={[
          { label: 'Título', value: document.title },
          { label: 'Descrição', value: document.description || 'N/A' },
          { label: 'Status', value: <StatusBadge status={document.status} showIcon /> },
          { label: 'Total de Versões', value: document.versionCount },
        ]}
      />
      <InfoSection
        title="Histórico"
        icon={ClockIcon}
        items={[
          { label: 'Criado em', value: formatDateTime(document.createdAt) },
          { label: 'Última atualização', value: formatDateTime(document.updatedAt) },
          { label: 'Submetido em', value: document.submittedAt ? formatDateTime(document.submittedAt) : 'N/A' },
          { label: 'Aprovado em', value: document.approvedAt ? formatDateTime(document.approvedAt) : 'N/A' },
        ]}
      />
      <InfoSection
        title="Equipe de Colaboração"
        icon={UserGroupIcon}
        items={[
          { label: 'Estudante(s)', value: document.allStudentNames || 'N/A' },
          { label: 'Orientador(es)', value: document.allAdvisorNames || 'N/A' },
          { label: 'Total de Estudantes Ativos', value: document.activeStudentCount || 0 },
          { label: 'Total de Orientadores Ativos', value: document.activeAdvisorCount || 0 },
        ]}
      />
      <InfoSection
        title="Configurações de Colaboração"
        icon={Cog6ToothIcon}
        items={[
          { label: 'Permite múltiplos estudantes?', value: document.allowMultipleStudents ? 'Sim' : 'Não' },
          { label: 'Máximo de Estudantes', value: document.maxStudents || 'N/A' },
          { label: 'Permite múltiplos orientadores?', value: document.allowMultipleAdvisors ? 'Sim' : 'Não' },
          { label: 'Máximo de Orientadores', value: document.maxAdvisors || 'N/A' },
        ]}
      />
    </div>
    {document.rejectionReason && (
      <div className="mt-4">
        <CollapsibleSection title="Motivo da Solicitação de Revisão" defaultOpen>
          <p className="text-sm text-yellow-700 whitespace-pre-wrap">{document.rejectionReason}</p>
        </CollapsibleSection>
      </div>
    )}
  </div>
);

export default DocumentInfo;
