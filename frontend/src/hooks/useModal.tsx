import { useState, useCallback } from 'react';

interface UseModalResult<T = any> {
  isOpen: boolean;
  selectedItem: T | null;
  openModal: (item?: T) => void;
  closeModal: () => void;
  setSelectedItem: (item: T | null) => void;
}

export function useModal<T = any>(): UseModalResult<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const openModal = useCallback((item?: T) => {
    if (item !== undefined) {
      setSelectedItem(item);
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedItem(null);
  }, []);

  return {
    isOpen,
    selectedItem,
    openModal,
    closeModal,
    setSelectedItem,
  };
}

// src/hooks/useApiData.ts
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApiData<T>(
  endpoint: string,
  dependencies: any[] = [],
  options?: { 
    errorMessage?: string;
    showToastOnError?: boolean;
    immediate?: boolean;
  }
): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options?.immediate !== false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!endpoint) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<T>(endpoint);
      setData(response);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || options?.errorMessage || 'Erro ao carregar dados';
      setError(errorMessage);
      
      if (options?.showToastOnError !== false) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options?.immediate !== false) {
      fetchData();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}