// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, BookOpenIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { authApi, RegisterRequest } from '../lib/api';

const schema = yup.object({
  name: yup
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .required('Nome é obrigatório'),
  email: yup
    .string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Senhas devem ser iguais')
    .required('Confirmação de senha é obrigatória'),
  role: yup
    .string()
    .oneOf(['STUDENT', 'ADVISOR'], 'Papel inválido')
    .required('Papel é obrigatório'),
  institution: yup
    .string()
    .min(2, 'Instituição deve ter pelo menos 2 caracteres')
    .required('Instituição é obrigatória'),
  department: yup
    .string()
    .min(2, 'Departamento deve ter pelo menos 2 caracteres')
    .required('Departamento é obrigatório'),
  justification: yup
    .string()
    .min(20, 'Justificativa deve ter pelo menos 20 caracteres')
    .max(500, 'Justificativa deve ter no máximo 500 caracteres')
    .required('Justificativa é obrigatória'),
});

type FormData = RegisterRequest & {
  confirmPassword: string;
};

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const justification = watch('justification', '');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await authApi.register(registerData);
      
      setSuccess(true);
      toast.success('Registro realizado com sucesso! Aguarde aprovação do administrador.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao fazer registro');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Registro Realizado!
            </h2>
            <p className="text-gray-600 mb-6">
              Seu registro foi enviado com sucesso. Você receberá um email quando sua conta for aprovada pelo administrador.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary w-full"
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-primary-600 p-3 rounded-2xl">
              <BookOpenIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Criar Conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Registre-se para acessar o Tessera Acadêmica
          </p>
        </div>

        {/* Form */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Pessoais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  placeholder="Seu nome completo"
                  className={`input-field ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  placeholder="seu@email.com"
                  className={`input-field ${errors.email ? 'input-error' : ''}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Senhas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Senha */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="••••••••"
                    className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="••••••••"
                    className={`input-field pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Papel */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Conta
              </label>
              <select
                {...register('role')}
                id="role"
                className={`input-field ${errors.role ? 'input-error' : ''}`}
              >
                <option value="">Selecione um tipo</option>
                <option value="STUDENT">Estudante</option>
                <option value="ADVISOR">Orientador</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Informações Acadêmicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Instituição */}
              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                  Instituição
                </label>