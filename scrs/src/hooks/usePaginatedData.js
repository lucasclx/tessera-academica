// src/hooks/usePaginatedData.js
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Hook genérico para gerenciar dados paginados com busca e filtros
 * Consolida a lógica comum entre diferentes páginas de listagem
 */
export const usePaginatedData = ({
  fetchFunction,
  initialPageSize = 10,
  dependencies = [],
  onError = null
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize);
  const [totalElements, setTotalElements] = useState(0);
  
  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = useCallback(async () => {
    if (!fetchFunction) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFunction({
        page,
        size: rowsPerPage,
        searchTerm,
        sortBy,
        sortOrder,
        ...filters
      });
      
      if (result && result.content) {
        setData(result.content);
        setTotalElements(result.totalElements || 0);
      } else {
        setData(result || []);
        setTotalElements(Array.isArray(result) ? result.length : 0);
      }
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      const errorMessage = err.response?.data?.message || 'Erro ao carregar dados';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, rowsPerPage, searchTerm, sortBy, sortOrder, filters, onError]);

  useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleSearchChange = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setPage(0);
  };

  const handleFilterChange = (filterKey, filterValue) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterValue
    }));
    setPage(0);
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(0);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({});
    setPage(0);
  };

  const refresh = () => {
    loadData();
  };

  return {
    // Dados
    data,
    loading,
    error,
    
    // Paginação
    page,
    rowsPerPage,
    totalElements,
    handlePageChange,
    handleRowsPerPageChange,
    
    // Busca e filtros
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    resetFilters,
    
    // Ações
    refresh,
    
    // Estados computados
    isEmpty: !loading && data.length === 0,
    hasSearch: searchTerm.length > 0,
    hasFilters: Object.keys(filters).length > 0
  };
};