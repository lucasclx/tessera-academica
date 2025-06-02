// Arquivo: srcs/src (cópia)/hooks/usePagination.tsx
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Interface para a resposta paginada da API (deve corresponder à estrutura do backend)
interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // Número da página atual (base 0)
  size: number;   // Tamanho da página
  // Outros campos como numberOfElements, first, last, empty podem estar presentes
}

interface UsePaginationResult<T> {
  data: T[];
  currentPage: number; // Base 0
  totalPages: number;
  totalElements: number;
  loading: boolean;
  error: string | null;
  fetchData: (page: number, ...args: any[]) => Promise<void>;
  handlePageChange: (page: number) => void;
  refresh: () => Promise<void>;
}

export function usePagination<T>(
  fetchFunction: (page: number, ...args: any[]) => Promise<Page<T>>
): UsePaginationResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false); // Inicializa como false
  const [error, setError] = useState<string | null>(null);
  const [currentArgs, setCurrentArgs] = useState<any[]>([]);

  const fetchDataInternal = useCallback(async (pageToFetch: number, ...argsToUse: any[]) => {
    setLoading(true);
    setError(null);
    setCurrentArgs(argsToUse); // Armazena os argumentos usados para esta busca

    try {
      const response = await fetchFunction(pageToFetch, ...argsToUse);
      setData(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.number); // Define a página atual a partir da resposta do backend
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar dados';
      setError(errorMessage);
      // O toast de erro agora é primariamente tratado pelo interceptor da API
      // Pode-se adicionar um fallback aqui se necessário, ou um ID específico para evitar spam
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]); // fetchFunction deve ser estável (memoizado pelo chamador)

  const handlePageChangeCallback = useCallback((newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage && !loading) {
      fetchDataInternal(newPage, ...currentArgs); // Usa os argumentos atuais para paginar
    }
  }, [totalPages, currentPage, loading, fetchDataInternal, currentArgs]);

  const refreshCallback = useCallback(async () => {
    if (!loading) { // Evita múltiplas chamadas de refresh simultâneas
      await fetchDataInternal(currentPage, ...currentArgs); // Refaz a busca para a página e argumentos atuais
    }
  }, [fetchDataInternal, currentPage, currentArgs, loading]);

  // O fetch inicial agora é controlado pelo componente que usa o hook, através do seu próprio useEffect.
  // Isso dá mais controle ao componente sobre quando a primeira carga de dados deve ocorrer.

  return {
    data,
    currentPage,
    totalPages,
    totalElements,
    loading,
    error,
    fetchData: fetchDataInternal, // Expõe a função para disparar buscas com novos parâmetros
    handlePageChange: handlePageChangeCallback,
    refresh: refreshCallback,
  };
}