// src/pages/admin/AdminRegistrationDetailModal.tsx
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserCircleIcon,
  BuildingOffice2Icon, // Para Instituição
  AcademicCapIcon, // Para Departamento
  ChatBubbleLeftRightIcon, // Para Justificativa
  CalendarDaysIcon, // Para Data
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';

// Reutilizando a interface de AdminRegistrationListPage.tsx
interface UserSummary {
  id: number;
  name: string;
  email: string;
}

interface RegistrationRequest {
  id: number;
  user: UserSummary;
  institution: string;
  department: string;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
}

interface AdminRegistrationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RegistrationRequest | null;
  onActionComplete: () => void; // Callback para atualizar a lista na página pai
}

const AdminRegistrationDetailModal: React.FC<AdminRegistrationDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onActionComplete,
}) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (request) {
      setAdminNotes(request.adminNotes || '');
      // Não preenchemos rejectionReason pois é para nova rejeição
      setRejectionReason(''); 
    }
  }, [request]);

  if (!isOpen || !request) {
    return null;
  }

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await api.put(`/admin/registrations/${request.id}/approve`, { adminNotes });
      toast.success('Solicitação aprovada com sucesso!');
      onActionComplete();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao aprovar solicitação.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("O motivo da rejeição é obrigatório.");
      return;
    }
    setIsProcessing(true);
    try {
      await api.put(`/admin/registrations/${request.id}/reject`, { rejectionReason });
      toast.success('Solicitação rejeitada com sucesso!');
      onActionComplete();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao rejeitar solicitação.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header do Modal */}
        <div className="flex items-start justify-between p-5 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900">
            Detalhes da Solicitação de Registro
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            onClick={onClose}
            disabled={isProcessing}
          >
            <XMarkIcon className="w-5 h-5" />
            <span className="sr-only">Fechar modal</span>
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-1 flex items-center"><UserCircleIcon className="h-5 w-5 mr-2 text-primary-600"/>Usuário</h4>
              <p><strong>Nome:</strong> {request.user.name}</p>
              <p><strong>Email:</strong> {request.user.email}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1 flex items-center"><BuildingOffice2Icon className="h-5 w-5 mr-2 text-primary-600"/>Instituição</h4>
              <p>{request.institution}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1 flex items-center"><AcademicCapIcon className="h-5 w-5 mr-2 text-primary-600"/>Departamento</h4>
              <p>{request.department}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1 flex items-center"><CalendarDaysIcon className="h-5 w-5 mr-2 text-primary-600"/>Data da Solicitação</h4>
              <p>{formatDate(request.createdAt)}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1 flex items-center"><ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-primary-600"/>Justificativa</h4>
            <p className="bg-gray-50 p-3 rounded-md border whitespace-pre-wrap">{request.justification}</p>
          </div>

          {request.status === 'PENDING' && (
            <div className="pt-4 border-t">
              <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notas para Aprovação (Opcional)
                </label>
                <textarea
                  id="adminNotes"
                  rows={2}
                  className="input-field"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione notas internas para esta aprovação..."
                  disabled={isProcessing}
                />
              </div>
              <div className="mt-4">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo para Rejeição (Obrigatório se rejeitar)
                </label>
                <textarea
                  id="rejectionReason"
                  rows={2}
                  className="input-field"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Se for rejeitar, explique o motivo..."
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}
          {request.status !== 'PENDING' && request.adminNotes && (
             <div>
                <h4 className="font-medium text-gray-700 mb-1 flex items-center"><InformationCircleIcon className="h-5 w-5 mr-2 text-primary-600"/>Notas do Administrador</h4>
                <p className="bg-gray-50 p-3 rounded-md border whitespace-pre-wrap">{request.adminNotes}</p>
            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-end p-6 space-x-2 border-t border-gray-200 rounded-b">
          <button
            onClick={onClose}
            type="button"
            className="btn btn-secondary"
            disabled={isProcessing}
          >
            Fechar
          </button>
          {request.status === 'PENDING' && (
            <>
              <button
                onClick={handleReject}
                type="button"
                className="btn btn-danger"
                disabled={isProcessing || !rejectionReason.trim()}
              >
                {isProcessing ? 'Rejeitando...' : 'Rejeitar Solicitação'}
                <XCircleIcon className="h-5 w-5 ml-2"/>
              </button>
              <button
                onClick={handleApprove}
                type="button"
                className="btn btn-success"
                disabled={isProcessing}
              >
                {isProcessing ? 'Aprovando...' : 'Aprovar Solicitação'}
                <CheckCircleIcon className="h-5 w-5 ml-2"/>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRegistrationDetailModal;