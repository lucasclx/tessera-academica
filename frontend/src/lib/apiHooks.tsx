// src/lib/apiHooks.ts
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from './api';
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
      } catch (error) {
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, dependencies);

  return { data, loading, refetch: () => fetchData() };
};

// Simplifica chamadas de API em todas as páginas