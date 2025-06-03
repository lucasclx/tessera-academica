// src/pages/admin/AdminQuickRejectModal.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon, XCircleIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';

// Usaremos um resumo da solicitação, pois só precisamos do ID e nome/email para o modal
interface RegistrationRequestSummary {
  id: number;
  user: {
    name: string;
    email: string;
  };
}

interface AdminQuickRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestToReject: RegistrationRequestSummary | null;
  onRejectionComplete: () => void; // Callback para atualizar a lista na página pai
}

const AdminQuickRejectModal: React.FC<AdminQuickRejectModalProps> = ({
  isOpen,
  onClose,
  requestToReject,
  onRejectionComplete,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRejectionReason(''); // Limpar o motivo ao abrir o modal
    }
  }, [isOpen]);

  if (!isOpen || !requestToReject) {
    return null;
  }

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("O motivo da rejeição é obrigatório.");
      return;
    }
    setIsProcessing(true);
    try {
      await api.put(`/admin/registrations/${requestToReject.id}/reject`, { rejectionReason });
      toast.success(`Solicitação de ${requestToReject.user.name} rejeitada com sucesso!`);
      onRejectionComplete();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao rejeitar solicitação.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-4 border-b rounded-t">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <XCircleIcon className="h-6 w-6 mr-2 text-red-600" />
            Rejeitar Solicitação de Registro
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
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Você está prestes a rejeitar a solicitação de registro para:
          </p>
          <div className="bg-gray-50 p-3 rounded-md border">
            <p className="text-sm"><strong>Nome:</strong> {requestToReject.user.name}</p>
            <p className="text-sm"><strong>Email:</strong> {requestToReject.user.email}</p>
          </div>
          <div>
            <label htmlFor="quickRejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4 inline mr-1 text-gray-500" />
              Motivo da Rejeição (Obrigatório)
            </label>
            <textarea
              id="quickRejectionReason"
              rows={3}
              className="input-field"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explique por que a solicitação está sendo rejeitada..."
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-end p-4 space-x-2 border-t border-gray-200 rounded-b">
          <button
            onClick={onClose}
            type="button"
            className="btn btn-secondary"
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmReject}
            type="button"
            className="btn btn-danger"
            disabled={isProcessing || !rejectionReason.trim()}
          >
            {isProcessing ? 'Rejeitando...' : 'Confirmar Rejeição'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminQuickRejectModal;