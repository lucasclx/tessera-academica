// src/components/Layout/ChangePasswordModal.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import { XMarkIcon, KeyIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { usersApi, PasswordChangePayload } from '../../lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const passwordSchema = yup.object().shape({
  currentPassword: yup.string().required('Senha atual é obrigatória'),
  newPassword: yup
    .string()
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .required('Nova senha é obrigatória')
    .notOneOf([yup.ref('currentPassword')], 'Nova senha não pode ser igual à senha atual.'),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'As novas senhas devem ser iguais')
    .required('Confirmação da nova senha é obrigatória'),
});

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangePayload>({
    resolver: yupResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordChangePayload) => {
    setIsLoading(true);
    try {
      const response = await usersApi.changePassword(data);
      toast.success(response.message || 'Senha alterada com sucesso!');
      reset();
      onClose();
    } catch (error: any) {
      // O toast de erro genérico já é tratado pelo api.tsx
      // Se o backend retornar uma mensagem específica para "senha atual incorreta",
      // o interceptor de erro no api.tsx já deverá exibi-la.
      // Caso contrário, pode-se adicionar:
      // if (error.response?.data?.message) {
      //   toast.error(error.response.data.message);
      // } else {
      //   toast.error('Erro ao alterar senha. Verifique os dados e tente novamente.');
      // }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const handleCloseModal = () => {
    reset(); // Limpa o formulário ao fechar
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-5 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <KeyIcon className="h-6 w-6 mr-2 text-primary-600" />
            Alterar Senha
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            onClick={handleCloseModal}
            disabled={isLoading}
          >
            <XMarkIcon className="w-5 h-5" />
            <span className="sr-only">Fechar modal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Senha Atual *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  {...register('currentPassword')}
                  className={`input-field pr-10 ${errors.currentPassword ? 'input-error' : ''}`}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nova Senha *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  {...register('newPassword')}
                  className={`input-field pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                 <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmNewPassword"
                  {...register('confirmNewPassword')}
                  className={`input-field pr-10 ${errors.confirmNewPassword ? 'input-error' : ''}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
              </div>
              {errors.confirmNewPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmNewPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end p-6 space-x-2 border-t border-gray-200 rounded-b">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </div>
              ) : (
                'Salvar Nova Senha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;