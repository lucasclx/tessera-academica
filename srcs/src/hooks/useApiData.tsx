import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api'; // Ajuste o caminho se 'api.tsx' estiver em outro local

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>; // Para permitir atualizações otimistas
}

export function useApiData<T>(
  endpoint: string | null, // Permite endpoint nulo para não buscar inicialmente
  dependencies: any[] = [], // Dependências para o useEffect que dispara o fetch
  options?: {
    errorMessage?: string;
    showToastOnError?: boolean;
    immediate?: boolean; // Controla se o fetch ocorre imediatamente na montagem
  }
): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options?.immediate !== false && !!endpoint); // Carrega se 'immediate' não for false e houver endpoint
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!endpoint) { // Não faz fetch se o endpoint for nulo
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<T>(endpoint);
      setData(response);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || options?.errorMessage || 'Erro ao carregar dados da API.';
      setError(errorMessage);

      if (options?.showToastOnError !== false && !toast.isActive(`useApiData-${endpoint}`)) {
        toast.error(errorMessage, { id: `useApiData-${endpoint}` });
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, ...(options?.errorMessage ? [options.errorMessage] : []), ...(options?.showToastOnError !== undefined ? [options.showToastOnError] : [])]); // Inclui options mutáveis nas dependências do useCallback

  useEffect(() => {
    if (options?.immediate !== false && endpoint) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, endpoint, options?.immediate, ...dependencies]); // Adiciona fetchData e endpoint como dependências do efeito principal

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
  };
}