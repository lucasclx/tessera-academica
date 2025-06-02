import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

interface UsePaginationResult<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  loading: boolean;
  error: string | null;
  fetchData: (...args: any[]) => Promise<void>;
  handlePageChange: (page: number) => void;
  refresh: () => Promise<void>;
}

export function usePagination<T>(
  fetchFunction: (page: number, ...args: any[]) => Promise<Page<T>>,
  pageSize: number = 10,
  initialArgs: any[] = []
): UsePaginationResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastArgs, setLastArgs] = useState<any[]>(initialArgs);

  const fetchData = useCallback(async (...args: any[]) => {
    setLoading(true);
    setError(null);
    setLastArgs(args);
    
    try {
      const response = await fetchFunction(currentPage, ...args);
      setData(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.number);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar dados';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 0 && page < totalPages && page !== currentPage) {
      setCurrentPage(page);
      fetchData(...lastArgs);
    }
  }, [totalPages, currentPage, fetchData, lastArgs]);

  const refresh = useCallback(async () => {
    await fetchData(...lastArgs);
  }, [fetchData, lastArgs]);

  return {
    data,
    currentPage,
    totalPages,
    totalElements,
    loading,
    error,
    fetchData,
    handlePageChange,
    refresh,
  };
}