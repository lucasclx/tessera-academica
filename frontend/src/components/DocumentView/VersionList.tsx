import React from 'react';
import StatusBadge from '../common/StatusBadge';
import CollapsibleSection from '../common/CollapsibleSection';
import { formatDate } from '../../utils/dateUtils';

export interface VersionItem {
  id: number;
  versionNumber: number;
  commitMessage?: string;
  createdByName: string;
  createdAt: string;
  commentCount?: number;
}

interface VersionListProps {
  versions: VersionItem[];
  selected?: VersionItem | null;
  onSelect: (v: VersionItem) => void;
}

const VersionList: React.FC<VersionListProps> = ({ versions, selected, onSelect }) => (
  <CollapsibleSection title={`Histórico de Versões (${versions.length})`} defaultOpen>
    {versions.length === 0 ? (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma versão encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">Este documento ainda não possui versões.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selected?.id === version.id
                ? 'border-primary-300 bg-primary-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onSelect(version)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <h4 className="text-sm font-medium text-gray-900">Versão {version.versionNumber}</h4>
                  {index === 0 && <StatusBadge status="CURRENT" />}
                </div>
                {version.commitMessage && (
                  <p className="text-sm text-gray-600 mt-1 italic">"{version.commitMessage}"</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>Por {version.createdByName}</span>
                  <span>{formatDate(version.createdAt)}</span>
                  <span>{version.commentCount || 0} comentário(s)</span>
                </div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onSelect(version);
                }}
                className="btn btn-secondary btn-sm"
              >
                Ver Conteúdo
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </CollapsibleSection>
);

export default VersionList;
