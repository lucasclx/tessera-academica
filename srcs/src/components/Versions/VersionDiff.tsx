// src/components/Versions/VersionDiff.tsx
import React, { useState, useEffect } from 'react';
import {
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { versionsApi, Version } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface VersionDiffProps {
  documentId: number;
  version1Id?: number;
  version2Id?: number;
  onVersionSelect?: (version1: Version, version2: Version) => void;
}

const VersionDiff: React.FC<VersionDiffProps> = ({
  documentId,
  version1Id,
  version2Id,
  onVersionSelect,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion1, setSelectedVersion1] = useState<Version | null>(null);
  const [selectedVersion2, setSelectedVersion2] = useState<Version | null>(null);
  const [diffHtml, setDiffHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [diffLoading, setDiffLoading] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  useEffect(() => {
    if (version1Id && version2Id) {
      loadSpecificVersions();
    }
  }, [version1Id, version2Id]);

  useEffect(() => {
    if (selectedVersion1 && selectedVersion2 && selectedVersion1.id !== selectedVersion2.id) {
      loadDiff();
      onVersionSelect?.(selectedVersion1, selectedVersion2);
    }
  }, [selectedVersion1, selectedVersion2]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const versionsData = await versionsApi.getByDocument(documentId);
      setVersions(versionsData);
      
      // Auto-select latest two versions if available
      if (versionsData.length >= 2 && !version1Id && !version2Id) {
        setSelectedVersion1(versionsData[1]); // Previous version
        setSelectedVersion2(versionsData[0]); // Latest version
      }
    } catch (error) {
      toast.error('Erro ao carregar versões');
    } finally {
      setLoading(false);
    }
  };

  const loadSpecificVersions = async () => {
    try {
      if (version1Id && version2Id) {
        const [v1, v2] = await Promise.all([
          versionsApi.getById(version1Id),
          versionsApi.getById(version2Id),
        ]);
        setSelectedVersion1(v1);
        setSelectedVersion2(v2);
      }
    } catch (error) {
      toast.error('Erro ao carregar versões específicas');
    }
  };

  const loadDiff = async () => {
    if (!selectedVersion1 || !selectedVersion2) return;

    try {
      setDiffLoading(true);
      const diff = await versionsApi.getDiff(selectedVersion1.id, selectedVersion2.id);
      
      // Convert diff to HTML for display (simplified version)
      // In a real implementation, you might want to use a proper diff library
      setDiffHtml(generateDiffHtml(selectedVersion1.content, selectedVersion2.content));
    } catch (error) {
      toast.error('Erro ao gerar comparação');
    } finally {
      setDiffLoading(false);
    }
  };

  const generateDiffHtml = (content1: string, content2: string): string => {
    // This is a simplified diff generator
    // In production, you'd want to use a proper diff library like diff2html
    
    // Remove HTML tags for comparison
    const text1 = content1.replace(/<[^>]*>/g, '');
    const text2 = content2.replace(/<[^>]*>/g, '');
    
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    
    let diffHtml = '<div class="diff-container">';
    
    const maxLines = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        diffHtml += `<div class="diff-line unchanged">
          <div class="line-number">${i + 1}</div>
          <div class="line-content">${escapeHtml(line1)}</div>
        </div>`;
      } else {
        if (line1) {
          diffHtml += `<div class="diff-line removed">
            <div class="line-number">-</div>
            <div class="line-content">${escapeHtml(line1)}</div>
          </div>`;
        }
        if (line2) {
          diffHtml += `<div class="diff-line added">
            <div class="line-number">+</div>
            <div class="line-content">${escapeHtml(line2)}</div>
          </div>`;
        }
      }
    }
    
    diffHtml += '</div>';
    return diffHtml;
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const swapVersions = () => {
    const temp = selectedVersion1;
    setSelectedVersion1(selectedVersion2);
    setSelectedVersion2(temp);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Version Selectors */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ArrowsRightLeftIcon className="h-5 w-5 mr-2" />
          Comparar Versões
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Version 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Versão Base
            </label>
            <select
              value={selectedVersion1?.id || ''}
              onChange={(e) => {
                const version = versions.find(v => v.id === Number(e.target.value));
                setSelectedVersion1(version || null);
              }}
              className="input-field"
            >
              <option value="">Selecione uma versão</option>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.versionNumber} - {version.commitMessage || 'Sem mensagem'}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={swapVersions}
              className="btn btn-secondary btn-sm"
              disabled={!selectedVersion1 || !selectedVersion2}
            >
              <ArrowsRightLeftIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Version 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Versão Comparada
            </label>
            <select
              value={selectedVersion2?.id || ''}
              onChange={(e) => {
                const version = versions.find(v => v.id === Number(e.target.value));
                setSelectedVersion2(version || null);
              }}
              className="input-field"
            >
              <option value="">Selecione uma versão</option>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.versionNumber} - {version.commitMessage || 'Sem mensagem'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Version Info */}
        {selectedVersion1 && selectedVersion2 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center text-red-800 mb-2">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">Versão {selectedVersion1.versionNumber}</span>
              </div>
              <div className="text-sm text-red-700 space-y-1">
                <div className="flex items-center">
                  <UserIcon className="h-3 w-3 mr-1" />
                  {selectedVersion1.createdByName}
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {formatDate(selectedVersion1.createdAt)}
                </div>
                {selectedVersion1.commitMessage && (
                  <div className="italic">"{selectedVersion1.commitMessage}"</div>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-800 mb-2">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">Versão {selectedVersion2.versionNumber}</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div className="flex items-center">
                  <UserIcon className="h-3 w-3 mr-1" />
                  {selectedVersion2.createdByName}
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {formatDate(selectedVersion2.createdAt)}
                </div>
                {selectedVersion2.commitMessage && (
                  <div className="italic">"{selectedVersion2.commitMessage}"</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diff Display */}
      {selectedVersion1 && selectedVersion2 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Comparação</h4>
            <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-200 rounded-sm mr-2"></div>
                Removido da v{selectedVersion1.versionNumber}
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-200 rounded-sm mr-2"></div>
                Adicionado na v{selectedVersion2.versionNumber}
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-100 rounded-sm mr-2"></div>
                Inalterado
              </div>
            </div>
          </div>

          <div className="p-6">
            {diffLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Gerando comparação...</span>
              </div>
            ) : diffHtml ? (
              <div className="diff-viewer">
                <style jsx>{`
                  .diff-container {
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    line-height: 1.5;
                  }
                  .diff-line {
                    display: flex;
                    padding: 2px 0;
                  }
                  .diff-line.unchanged {
                    background-color: transparent;
                  }
                  .diff-line.removed {
                    background-color: #fee;
                    border-left: 3px solid #f87171;
                  }
                  .diff-line.added {
                    background-color: #efe;
                    border-left: 3px solid #34d399;
                  }
                  .line-number {
                    width: 40px;
                    text-align: right;
                    padding-right: 8px;
                    color: #6b7280;
                    background-color: #f9fafb;
                    border-right: 1px solid #e5e7eb;
                  }
                  .line-content {
                    padding-left: 8px;
                    flex: 1;
                    white-space: pre-wrap;
                  }
                `}</style>
                <div
                  className="border border-gray-200 rounded-md overflow-auto max-h-96"
                  dangerouslySetInnerHTML={{ __html: diffHtml }}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <ArrowsRightLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Selecione duas versões diferentes para comparar
                </h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionDiff;