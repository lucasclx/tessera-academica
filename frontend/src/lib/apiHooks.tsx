// src/lib/apiHooks.tsx - CORRIGIDO
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from './api';
import { toastManager } from '../utils/toastManager';

export const useApiData = <T>(
  endpoint: string,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<T>(endpoint);
        setData(response);
      } catch (error: any) {
        // Verificar se o toast já está ativo usando toastManager
        const toastId = `useApiData-${endpoint}-error`;
        if (!toastManager.isActive(toastId)) {
          toastManager.add(toastId);
          const errorMessage = error.response?.data?.message || error.message || 'Erro ao carregar dados';
          toast.error(errorMessage, { id: toastId });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, dependencies);

  const refetch = async () => {
    setLoading(true);
    try {
      const response = await api.get<T>(endpoint);
      setData(response);
    } catch (error: any) {
      const toastId = `useApiData-${endpoint}-refetch-error`;
      if (!toastManager.isActive(toastId)) {
        toastManager.add(toastId);
        const errorMessage = error.response?.data?.message || error.message || 'Erro ao recarregar dados';
        toast.error(errorMessage, { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, refetch };
};

// Simplifica chamadas de API em todas as páginas